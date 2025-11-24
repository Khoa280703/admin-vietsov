using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.DTOs.Logs;
using Vietsov.Api.DTOs.Users;
using Vietsov.Api.Models;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/logs")]
[Authorize(Roles = "admin")]
public class LogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LogsController> _logger;

    public LogsController(
        ApplicationDbContext context,
        ILogger<LogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] LogFiltersRequest filters)
    {
        try
        {
            var page = filters.Page > 0 ? filters.Page : 1;
            var limit = filters.Limit > 0 ? filters.Limit : 50;
            var skip = (page - 1) * limit;

            var query = _context.Logs
                .Include(l => l.User)
                .AsQueryable();

            // Apply filters
            if (filters.UserId.HasValue)
            {
                query = query.Where(l => l.UserId == filters.UserId.Value);
            }

            if (!string.IsNullOrEmpty(filters.Action))
            {
                query = query.Where(l => l.Action == filters.Action);
            }

            if (filters.Level.HasValue)
            {
                query = query.Where(l => l.Level == filters.Level.Value);
            }

            if (!string.IsNullOrEmpty(filters.Module))
            {
                query = query.Where(l => l.Module == filters.Module);
            }

            if (!string.IsNullOrEmpty(filters.Endpoint))
            {
                query = query.Where(l => l.Endpoint.Contains(filters.Endpoint));
            }

            if (filters.StatusCode.HasValue)
            {
                query = query.Where(l => l.StatusCode == filters.StatusCode.Value);
            }

            if (!string.IsNullOrEmpty(filters.IpAddress))
            {
                query = query.Where(l => l.IpAddress != null && l.IpAddress.Contains(filters.IpAddress));
            }

            if (!string.IsNullOrEmpty(filters.SearchText))
            {
                query = query.Where(l =>
                    l.Message.Contains(filters.SearchText) ||
                    l.Action.Contains(filters.SearchText) ||
                    l.Module.Contains(filters.SearchText));
            }

            if (filters.StartDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt >= filters.StartDate.Value);
            }

            if (filters.EndDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt <= filters.EndDate.Value);
            }

            var total = await query.CountAsync();
            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip(skip)
                .Take(limit)
                .ToListAsync();

            var logResponses = logs.Select(l => MapToLogResponse(l)).ToList();

            return Ok(new
            {
                data = logResponses,
                pagination = new PaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing logs");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var log = await _context.Logs
                .Include(l => l.User)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (log == null)
            {
                return NotFound(new { error = "Log not found" });
            }

            var response = MapToLogResponse(log);
            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting log by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "json",
        [FromQuery] int? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] Models.LogLevel? level = null,
        [FromQuery] string? module = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var query = _context.Logs
                .Include(l => l.User)
                .AsQueryable();

            // Apply filters
            if (userId.HasValue) query = query.Where(l => l.UserId == userId.Value);
            if (!string.IsNullOrEmpty(action)) query = query.Where(l => l.Action == action);
            if (level.HasValue) query = query.Where(l => l.Level == level.Value);
            if (!string.IsNullOrEmpty(module)) query = query.Where(l => l.Module == module);
            if (startDate.HasValue) query = query.Where(l => l.CreatedAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(l => l.CreatedAt <= endDate.Value);

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            if (format.ToLowerInvariant() == "csv")
            {
                var csv = GenerateCsv(logs);
                var fileName = $"logs-{DateTime.UtcNow:yyyy-MM-dd}.csv";
                return File(Encoding.UTF8.GetBytes(csv), "text/csv", fileName);
            }
            else
            {
                var logResponses = logs.Select(l => MapToLogResponse(l)).ToList();
                var json = JsonSerializer.Serialize(logResponses, new JsonSerializerOptions { WriteIndented = true });
                var fileName = $"logs-{DateTime.UtcNow:yyyy-MM-dd}.json";
                return File(Encoding.UTF8.GetBytes(json), "application/json", fileName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting logs");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            // Logs by level
            var logsByLevel = await _context.Logs
                .GroupBy(l => l.Level)
                .Select(g => new { Level = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Logs by module
            var logsByModule = await _context.Logs
                .GroupBy(l => l.Module)
                .Select(g => new { Module = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(10)
                .ToListAsync();

            // Logs by day (last 7 days)
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7).Date;
            var logsByDay = await _context.Logs
                .Where(l => l.CreatedAt >= sevenDaysAgo)
                .GroupBy(l => l.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var response = new LogStatisticsResponse
            {
                Overview = new Dictionary<string, int>
                {
                    { "total", await _context.Logs.CountAsync() },
                    { "info", await _context.Logs.CountAsync(l => l.Level == Models.LogLevel.Info) },
                    { "warn", await _context.Logs.CountAsync(l => l.Level == Models.LogLevel.Warn) },
                    { "error", await _context.Logs.CountAsync(l => l.Level == Models.LogLevel.Error) }
                },
                LogsByLevel = logsByLevel.Select(l => new LogsByLevel { Level = l.Level, Count = l.Count }).ToList(),
                LogsByModule = logsByModule.Select(m => new LogsByModule { Module = m.Module, Count = m.Count }).ToList(),
                LogsByDay = logsByDay.Select(d => new LogsByDay { Date = d.Date, Count = d.Count }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting log statistics");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private LogResponse MapToLogResponse(Log log)
    {
        JsonElement? metadata = null;
        if (!string.IsNullOrEmpty(log.Metadata))
        {
            try
            {
                metadata = JsonSerializer.Deserialize<JsonElement>(log.Metadata);
            }
            catch
            {
                // If parsing fails, leave as null
            }
        }

        return new LogResponse
        {
            Id = log.Id,
            UserId = log.UserId,
            User = log.User != null ? new DTOs.Users.UserResponse
            {
                Id = log.User.Id,
                Username = log.User.UserName ?? string.Empty,
                Email = log.User.Email ?? string.Empty,
                FullName = log.User.FullName,
                IsActive = log.User.IsActive,
                RoleId = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            } : null,
            Action = log.Action,
            Module = log.Module,
            Endpoint = log.Endpoint,
            Method = log.Method,
            StatusCode = log.StatusCode,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
            Message = log.Message,
            Level = log.Level,
            Metadata = metadata,
            CreatedAt = log.CreatedAt
        };
    }

    private string GenerateCsv(List<Log> logs)
    {
        var headers = new[] { "ID", "Timestamp", "User", "Action", "Module", "Endpoint", "Method", "Status Code", "Level", "IP Address", "Message" };
        var rows = logs.Select(log => new[]
        {
            log.Id.ToString(),
            log.CreatedAt.ToString("O"),
            log.User != null ? $"{log.User.UserName} ({log.User.FullName})" : "System",
            log.Action,
            log.Module,
            log.Endpoint,
            log.Method,
            log.StatusCode.ToString(),
            log.Level.ToString(),
            log.IpAddress ?? "",
            log.Message.Replace(",", ";")
        });

        var csv = new StringBuilder();
        csv.AppendLine(string.Join(",", headers));
        foreach (var row in rows)
        {
            csv.AppendLine(string.Join(",", row));
        }

        return csv.ToString();
    }
}

