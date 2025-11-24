using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.Models;

namespace Vietsov.Api.Services;

public interface IDashboardService
{
    Task<DashboardStatistics> GetStatisticsAsync(int? userId, bool isAdmin);
}

public class DashboardStatistics
{
    public OverviewStats Overview { get; set; } = new();
    public Dictionary<string, int> StatusCounts { get; set; } = new();
    public List<ArticleSummary> TopArticles { get; set; } = new();
    public List<ArticleSummary> RecentArticles { get; set; } = new();
    public List<ArticleByMonth> ArticlesByMonth { get; set; } = new();
    public SystemStats? SystemStats { get; set; }
}

public class OverviewStats
{
    public int TotalArticles { get; set; }
    public int PublishedCount { get; set; }
    public int TotalViews { get; set; }
    public int ThisMonthCount { get; set; }
    public int ThisWeekCount { get; set; }
}

public class ArticleSummary
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Views { get; set; }
    public ArticleStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public AuthorSummary? Author { get; set; }
}

public class AuthorSummary
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class ArticleByMonth
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
}

public class SystemStats
{
    public int TotalUsers { get; set; }
    public int TotalCategories { get; set; }
    public int TotalTags { get; set; }
}

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(ApplicationDbContext context, ILogger<DashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardStatistics> GetStatisticsAsync(int? userId, bool isAdmin)
    {
        var query = _context.Articles.AsQueryable();

        // Note: AuthorId removed, all users can see all articles
        // Filtering by user can be implemented via Logs if needed

        // Total articles
        var totalArticles = await query.CountAsync();

        // Articles by status
        var articlesByStatus = await query
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusCounts = new Dictionary<string, int>
        {
            { "draft", 0 },
            { "submitted", 0 },
            { "under_review", 0 },
            { "approved", 0 },
            { "rejected", 0 },
            { "published", 0 }
        };

        foreach (var item in articlesByStatus)
        {
            statusCounts[item.Status.ToString().ToLowerInvariant()] = item.Count;
        }

        // Total views
        var totalViews = await query.SumAsync(a => (int?)a.Views) ?? 0;

        // Published articles count
        var publishedCount = await query.CountAsync(a => a.Status == ArticleStatus.Published);

        // Articles created this month
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var thisMonthCount = await query.CountAsync(a => a.CreatedAt >= startOfMonth);

        // Articles created this week
        var startOfWeek = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
        startOfWeek = new DateTime(startOfWeek.Year, startOfWeek.Month, startOfWeek.Day, 0, 0, 0, DateTimeKind.Utc);
        var thisWeekCount = await query.CountAsync(a => a.CreatedAt >= startOfWeek);

        // Top articles by views
        var topArticles = await query
            .OrderByDescending(a => a.Views)
            .Take(5)
            .Select(a => new ArticleSummary
            {
                Id = a.Id,
                Title = a.Title,
                Views = a.Views,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                Author = null // AuthorId removed
            })
            .ToListAsync();

        // Recent articles
        var recentArticles = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .Select(a => new ArticleSummary
            {
                Id = a.Id,
                Title = a.Title,
                Views = a.Views,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                Author = null // AuthorId removed
            })
            .ToListAsync();

        // Articles by month (last 6 months)
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        sixMonthsAgo = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1);

        var articlesByMonth = await query
            .Where(a => a.CreatedAt >= sixMonthsAgo)
            .GroupBy(a => new { Year = a.CreatedAt.Year, Month = a.CreatedAt.Month })
            .Select(g => new ArticleByMonth
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderBy(a => a.Year)
            .ThenBy(a => a.Month)
            .ToListAsync();

        // System stats (admin only)
        SystemStats? systemStats = null;
        if (isAdmin)
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalCategories = await _context.Categories.CountAsync();
            var totalTags = await _context.Tags.CountAsync();

            systemStats = new SystemStats
            {
                TotalUsers = totalUsers,
                TotalCategories = totalCategories,
                TotalTags = totalTags
            };
        }

        return new DashboardStatistics
        {
            Overview = new OverviewStats
            {
                TotalArticles = totalArticles,
                PublishedCount = publishedCount,
                TotalViews = totalViews,
                ThisMonthCount = thisMonthCount,
                ThisWeekCount = thisWeekCount
            },
            StatusCounts = statusCounts,
            TopArticles = topArticles,
            RecentArticles = recentArticles,
            ArticlesByMonth = articlesByMonth,
            SystemStats = systemStats
        };
    }
}

