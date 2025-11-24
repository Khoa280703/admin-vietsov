using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.Models;

namespace Vietsov.Api.Services;

public interface ILogService
{
    Task<Log?> WriteLogAsync(LogData data);
    object? SanitizeMetadata(object? metadata);
}

public class LogData
{
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string Message { get; set; } = string.Empty;
    public Models.LogLevel Level { get; set; } = Models.LogLevel.Info;
    public object? Metadata { get; set; }
}

public class LogService : ILogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LogService> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly string _logsDirectory;

    public LogService(ApplicationDbContext context, ILogger<LogService> logger, IWebHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
        _logsDirectory = Path.Combine(_environment.ContentRootPath, "logs");

        // Ensure logs directory exists
        if (!Directory.Exists(_logsDirectory))
        {
            Directory.CreateDirectory(_logsDirectory);
        }
    }

    public async Task<Log?> WriteLogAsync(LogData data)
    {
        try
        {
            // Write to database (primary storage)
            var log = await WriteToDatabaseAsync(data);

            // Write to file (backup/archive) - don't wait for it
            _ = Task.Run(async () =>
            {
                try
                {
                    await WriteToFileAsync(data);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to write log to file");
                }
            });

            return log;
        }
        catch (Exception ex)
        {
            // Logging should never break the application
            _logger.LogError(ex, "Unexpected error in WriteLog");
            return null;
        }
    }

    private async Task<Log?> WriteToDatabaseAsync(LogData data)
    {
        try
        {
            // Safely stringify metadata, handling circular references
            string? metadataString = null;
            if (data.Metadata != null)
            {
                try
                {
                    var sanitized = SanitizeMetadata(data.Metadata);
                    metadataString = JsonSerializer.Serialize(sanitized);
                }
                catch (Exception ex)
                {
                    // If JSON serialization fails, store error message
                    metadataString = JsonSerializer.Serialize(new { error = "Failed to serialize metadata", message = ex.Message });
                }
            }

            var log = new Log
            {
                UserId = data.UserId,
                Action = data.Action,
                Module = data.Module,
                Endpoint = data.Endpoint,
                Method = data.Method,
                StatusCode = data.StatusCode,
                IpAddress = data.IpAddress,
                UserAgent = data.UserAgent,
                Message = data.Message,
                Level = data.Level,
                Metadata = metadataString,
                CreatedAt = DateTime.UtcNow
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();

            return log;
        }
        catch (Exception ex)
        {
            // Log error but don't throw - logging should never break the application
            _logger.LogError(ex, "Failed to write log to database");
            return null;
        }
    }

    private async Task WriteToFileAsync(LogData data)
    {
        try
        {
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var logFile = Path.Combine(_logsDirectory, $"logs-{today}.json");

            var logEntry = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                userId = data.UserId,
                action = data.Action,
                module = data.Module,
                endpoint = data.Endpoint,
                method = data.Method,
                statusCode = data.StatusCode,
                ipAddress = data.IpAddress,
                userAgent = data.UserAgent,
                message = data.Message,
                level = data.Level.ToString(),
                metadata = data.Metadata != null ? SanitizeMetadata(data.Metadata) : null
            };

            // Read existing logs or create new array
            var logs = new List<object>();
            if (File.Exists(logFile))
            {
                try
                {
                    var fileContent = await File.ReadAllTextAsync(logFile);
                    var existingLogs = JsonSerializer.Deserialize<List<object>>(fileContent);
                    if (existingLogs != null)
                    {
                        logs = existingLogs;
                    }
                }
                catch
                {
                    // If file is corrupted, start fresh
                    logs = new List<object>();
                }
            }

            // Add new log entry
            logs.Add(logEntry);

            // Write back to file
            var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(logFile, json);
        }
        catch (Exception ex)
        {
            // Don't throw error if file logging fails, just log to console
            _logger.LogError(ex, "Failed to write log to file");
        }
    }

    public object? SanitizeMetadata(object? metadata)
    {
        if (metadata == null)
            return null;

        return SanitizeMetadataInternal(metadata, new HashSet<object>());
    }

    private object? SanitizeMetadataInternal(object? metadata, HashSet<object> visited)
    {
        if (metadata == null)
            return null;

        // Handle circular references
        if (visited.Contains(metadata))
        {
            return "[Circular Reference]";
        }

        visited.Add(metadata);

        try
        {
            if (metadata is JsonElement jsonElement)
            {
                return SanitizeJsonElement(jsonElement, visited);
            }

            if (metadata is string || metadata is int || metadata is long || metadata is double || metadata is bool || metadata is DateTime)
            {
                return metadata;
            }

            if (metadata is System.Collections.IDictionary dict)
            {
                var sanitized = new Dictionary<string, object?>();
                var sensitiveFields = new[] { "password", "token", "accessToken", "refreshToken", "authorization" };

                foreach (System.Collections.DictionaryEntry entry in dict)
                {
                    var key = entry.Key?.ToString() ?? "";
                    var value = entry.Value;

                    if (sensitiveFields.Contains(key, StringComparer.OrdinalIgnoreCase))
                    {
                        sanitized[key] = "[REDACTED]";
                    }
                    else
                    {
                        sanitized[key] = SanitizeMetadataInternal(value, visited);
                    }
                }

                visited.Remove(metadata);
                return sanitized;
            }

            if (metadata is System.Collections.IEnumerable enumerable && !(metadata is string))
            {
                var list = new List<object?>();
                foreach (var item in enumerable)
                {
                    list.Add(SanitizeMetadataInternal(item, visited));
                }
                visited.Remove(metadata);
                return list;
            }

            // For other objects, try to serialize and deserialize as dictionary
            try
            {
                var json = JsonSerializer.Serialize(metadata);
                var element = JsonSerializer.Deserialize<JsonElement>(json);
                visited.Remove(metadata);
                return SanitizeJsonElement(element, visited);
            }
            catch
            {
                visited.Remove(metadata);
                return new { error = "Failed to sanitize metadata", type = metadata.GetType().Name };
            }
        }
        catch (Exception)
        {
            visited.Remove(metadata);
            return new { error = "Failed to sanitize metadata", type = metadata.GetType().Name };
        }
    }

    private object? SanitizeJsonElement(JsonElement element, HashSet<object> visited)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object?>();
                var sensitiveFields = new[] { "password", "token", "accessToken", "refreshToken", "authorization" };

                foreach (var prop in element.EnumerateObject())
                {
                    if (sensitiveFields.Contains(prop.Name, StringComparer.OrdinalIgnoreCase))
                    {
                        dict[prop.Name] = "[REDACTED]";
                    }
                    else
                    {
                        dict[prop.Name] = SanitizeJsonElement(prop.Value, visited);
                    }
                }
                return dict;

            case JsonValueKind.Array:
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(SanitizeJsonElement(item, visited));
                }
                return list;

            case JsonValueKind.String:
                return element.GetString();

            case JsonValueKind.Number:
                if (element.TryGetInt32(out var intVal))
                    return intVal;
                if (element.TryGetInt64(out var longVal))
                    return longVal;
                return element.GetDouble();

            case JsonValueKind.True:
                return true;

            case JsonValueKind.False:
                return false;

            case JsonValueKind.Null:
                return null;

            default:
                return element.ToString();
        }
    }
}

