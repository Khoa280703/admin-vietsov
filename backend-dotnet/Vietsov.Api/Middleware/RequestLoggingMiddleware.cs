using System.Text.RegularExpressions;
using System.Security.Claims;
using Vietsov.Api.Models;
using Vietsov.Api.Services;

namespace Vietsov.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip health check and static files
        var path = context.Request.Path.Value ?? "";
        if (path == "/health" ||
            path.StartsWith("/uploads/") ||
            path.StartsWith("/api/v1/logs") ||
            path.StartsWith("/swagger"))
        {
            await _next(context);
            return;
        }

        var startTime = DateTime.UtcNow;

        // Capture response
        context.Response.OnCompleted(() =>
        {
            try
            {
                var duration = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                var statusCode = context.Response.StatusCode;

                // Get user ID from claims
                int? userId = null;
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
                {
                    userId = parsedUserId;
                }

                var logData = new LogData
                {
                    UserId = userId,
                    Action = ExtractAction(context.Request.Method, path),
                    Module = ExtractModule(path),
                    Endpoint = path,
                    Method = context.Request.Method,
                    StatusCode = statusCode,
                    IpAddress = GetClientIp(context),
                    UserAgent = context.Request.Headers["User-Agent"].ToString(),
                    Message = $"{context.Request.Method} {path} - {statusCode} ({duration}ms)",
                    Level = GetLogLevel(statusCode),
                    Metadata = new
                    {
                        duration,
                        query = context.Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString())
                        // Note: Body is not available in OnCompleted callback
                    }
                };

                // Write log asynchronously (don't block)
                // Create a scope to resolve scoped services
                _ = Task.Run(async () =>
                {
                    try
                    {
                        // Create a scope to resolve ILogService (scoped service)
                        using var scope = context.RequestServices.CreateScope();
                        var logService = scope.ServiceProvider.GetRequiredService<ILogService>();
                        await logService.WriteLogAsync(logData).ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to write log");
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RequestLoggingMiddleware");
            }
            return Task.CompletedTask;
        });

        await _next(context);
    }

    private string ExtractModule(string endpoint)
    {
        // Extract module from /api/v1/{module}
        var match = Regex.Match(endpoint, @"/api/v\d+/([^/]+)");
        if (match.Success && match.Groups.Count > 1)
        {
            return match.Groups[1].Value;
        }
        return "unknown";
    }

    private string ExtractAction(string method, string endpoint)
    {
        var parts = endpoint.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var resource = parts.Length > 0 ? parts[^1] : "unknown";

        var actionMap = new Dictionary<string, string>
        {
            { "GET", "view" },
            { "POST", "create" },
            { "PUT", "update" },
            { "PATCH", "update" },
            { "DELETE", "delete" }
        };

        var baseAction = actionMap.GetValueOrDefault(method, method.ToLowerInvariant());

        // Special cases
        if (endpoint.Contains("/login")) return "login";
        if (endpoint.Contains("/logout")) return "logout";
        if (endpoint.Contains("/refresh")) return "refresh_token";
        if (endpoint.Contains("/submit")) return "submit";
        if (endpoint.Contains("/approve")) return "approve";
        if (endpoint.Contains("/reject")) return "reject";
        if (endpoint.Contains("/publish")) return "publish";

        return $"{baseAction}_{resource}";
    }

    private Models.LogLevel GetLogLevel(int statusCode)
    {
        if (statusCode >= 500) return Models.LogLevel.Error;
        if (statusCode >= 400) return Models.LogLevel.Warn;
        return Models.LogLevel.Info;
    }

    private string? GetClientIp(HttpContext context)
    {
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
        {
            return forwarded.Split(',')[0].Trim();
        }

        return context.Request.Headers["X-Real-IP"].FirstOrDefault() ??
               context.Connection.RemoteIpAddress?.ToString();
    }
}

