using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.DTOs.Articles;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Validators;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/articles")]
[Authorize]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _articleService;
    private readonly ILogService _logService;
    private readonly ILogger<ArticlesController> _logger;
    private readonly Data.ApplicationDbContext _context;

    public ArticlesController(
        IArticleService articleService,
        ILogService logService,
        ILogger<ArticlesController> logger,
        Data.ApplicationDbContext context)
    {
        _articleService = articleService;
        _logService = logService;
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? status = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? tagId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var isAdmin = User.IsInRole("admin");
            var skip = (page - 1) * limit;

            var query = _context.Articles
                .Include(a => a.ArticleCategories)
                    .ThenInclude(ac => ac.Category)
                .Include(a => a.ArticleTags)
                    .ThenInclude(at => at.Tag)
                .AsQueryable();

            // Note: AuthorId removed, all users can see all articles
            // Admin-only filtering can be added if needed

            // Convert string status to enum
            if (!string.IsNullOrEmpty(status))
            {
                var statusEnum = status.ToLowerInvariant() switch
                {
                    "draft" => ArticleStatus.Draft,
                    "submitted" => ArticleStatus.Submitted,
                    "under_review" => ArticleStatus.UnderReview,
                    "approved" => ArticleStatus.Approved,
                    "rejected" => ArticleStatus.Rejected,
                    "published" => ArticleStatus.Published,
                    _ => (ArticleStatus?)null
                };

                if (statusEnum.HasValue)
                {
                    query = query.Where(a => a.Status == statusEnum.Value);
                }
            }

            if (categoryId.HasValue)
            {
                query = query.Where(a => a.ArticleCategories.Any(ac => ac.CategoryId == categoryId.Value));
            }

            if (tagId.HasValue)
            {
                query = query.Where(a => a.ArticleTags.Any(at => at.TagId == tagId.Value));
            }

            var total = await query.CountAsync();
            var articles = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(limit)
                .ToListAsync();

            var articleResponses = articles.Select(a => MapToArticleResponse(a)).ToList();

            return Ok(new ListArticlesResponse
            {
                Data = articleResponses,
                Pagination = new DTOs.Users.PaginationInfo
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
            _logger.LogError(ex, "Error listing articles");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("my-articles")]
    public async Task<IActionResult> MyArticles([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var (articles, total) = await _articleService.GetMyArticlesAsync(currentUserId.Value, page, limit);

            var articleResponses = articles.Select(a => MapToArticleResponse(a)).ToList();

            return Ok(new ListArticlesResponse
            {
                Data = articleResponses,
                Pagination = new DTOs.Users.PaginationInfo
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
            _logger.LogError(ex, "Error getting my articles");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var isAdmin = User.IsInRole("admin");
            var article = await _articleService.GetArticleWithRelationsAsync(id);

            // Note: AuthorId removed, all authenticated users can view articles

            var response = MapToArticleResponse(article);
            return Ok(new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting article by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateArticleRequest request)
    {
        try
        {
            var validator = new CreateArticleRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var createData = new Services.CreateArticleData
            {
                Title = request.Title,
                Subtitle = request.Subtitle,
                Slug = request.Slug,
                Excerpt = request.Excerpt,
                Content = request.Content.HasValue ? request.Content.Value : null,
                ContentHtml = request.ContentHtml,
                AuthorName = request.AuthorName,
                FeaturedImage = request.FeaturedImage,
                SeoTitle = request.SeoTitle,
                SeoDescription = request.SeoDescription,
                SeoKeywords = request.SeoKeywords,
                IsFeatured = request.IsFeatured,
                IsBreakingNews = request.IsBreakingNews,
                AllowComments = request.AllowComments,
                Visibility = request.Visibility,
                ScheduledAt = request.ScheduledAt,
                CategoryIds = request.CategoryIds,
                TagIds = request.TagIds
            };

            var article = await _articleService.CreateArticleAsync(currentUserId.Value, createData);

            // Log
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "create_article",
                Module = "articles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 201,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User created article: {article.Title}",
                Level = Models.LogLevel.Info,
                Metadata = new { articleId = article.Id, articleTitle = article.Title }
            });

            var response = MapToArticleResponse(article);
            return StatusCode(201, new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateArticleRequest request)
    {
        try
        {
            var validator = new UpdateArticleRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var isAdmin = User.IsInRole("admin");

            var updateData = new Services.UpdateArticleData
            {
                Title = request.Title,
                Subtitle = request.Subtitle,
                Excerpt = request.Excerpt,
                Content = request.Content.HasValue ? request.Content.Value : null,
                ContentHtml = request.ContentHtml,
                AuthorName = request.AuthorName,
                FeaturedImage = request.FeaturedImage,
                SeoTitle = request.SeoTitle,
                SeoDescription = request.SeoDescription,
                SeoKeywords = request.SeoKeywords,
                Status = request.Status,
                IsFeatured = request.IsFeatured,
                IsBreakingNews = request.IsBreakingNews,
                AllowComments = request.AllowComments,
                Visibility = request.Visibility,
                ScheduledAt = request.ScheduledAt,
                CategoryIds = request.CategoryIds,
                TagIds = request.TagIds
            };

            var article = await _articleService.UpdateArticleAsync(id, currentUserId.Value, updateData, isAdmin);

            // Log
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "update_article",
                Module = "articles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User updated article: {article.Title}",
                Level = Models.LogLevel.Info,
                Metadata = new { articleId = article.Id }
            });

            var response = MapToArticleResponse(article);
            return Ok(new { data = response });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var isAdmin = User.IsInRole("admin");
            var article = await _context.Articles.FindAsync(id);
            if (article == null)
            {
                return NotFound(new { error = "Article not found" });
            }

            // Note: AuthorId removed, only admin can delete articles
            if (!isAdmin)
            {
                return Forbid();
            }

            await _articleService.DeleteArticleAsync(id);

            // Log
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "delete_article",
                Module = "articles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User deleted article ID: {id}",
                Level = Models.LogLevel.Info,
                Metadata = new { articleId = id }
            });

            return Ok(new { message = "Article deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var article = await _articleService.SubmitArticleAsync(id, currentUserId.Value);
            var response = MapToArticleResponse(article);

            return Ok(new { data = response, message = "Article submitted for review" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Approve(int id, [FromBody] ReviewArticleRequest? request)
    {
        try
        {
            var validator = new ReviewArticleRequestValidator();
            if (request != null)
            {
                var validationResult = await validator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
                }
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var article = await _articleService.ApproveArticleAsync(id, currentUserId.Value, request?.Notes);
            var response = MapToArticleResponse(article);

            return Ok(new { data = response, message = "Article approved" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Reject(int id, [FromBody] ReviewArticleRequest? request)
    {
        try
        {
            var validator = new ReviewArticleRequestValidator();
            if (request != null)
            {
                var validationResult = await validator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
                }
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var article = await _articleService.RejectArticleAsync(id, currentUserId.Value, request?.Notes);
            var response = MapToArticleResponse(article);

            return Ok(new { data = response, message = "Article rejected" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var isAdmin = User.IsInRole("admin");
            var article = await _articleService.PublishArticleAsync(id, currentUserId.Value, isAdmin);
            var response = MapToArticleResponse(article);

            return Ok(new { data = response, message = "Article published" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing article");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private ArticleResponse MapToArticleResponse(Article article)
    {
        return new ArticleResponse
        {
            Id = article.Id,
            Title = article.Title,
            Subtitle = article.Subtitle,
            Slug = article.Slug,
            Excerpt = article.Excerpt,
            ContentJson = article.ContentJson,
            ContentHtml = article.ContentHtml,
            Status = article.Status,
            AuthorName = article.AuthorName,
            FeaturedImage = article.FeaturedImage,
            SeoTitle = article.SeoTitle,
            SeoDescription = article.SeoDescription,
            SeoKeywords = article.SeoKeywords,
            IsFeatured = article.IsFeatured,
            IsBreakingNews = article.IsBreakingNews,
            AllowComments = article.AllowComments,
            Visibility = article.Visibility,
            ScheduledAt = article.ScheduledAt,
            PublishedAt = article.PublishedAt,
            ReviewNotes = article.ReviewNotes,
            WordCount = article.WordCount,
            CharacterCount = article.CharacterCount,
            ReadingTime = article.ReadingTime,
            Views = article.Views,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
            Categories = article.ArticleCategories.Select(ac => new DTOs.Categories.CategoryResponse
            {
                Id = ac.Category.Id,
                Name = ac.Category.Name,
                Slug = ac.Category.Slug,
                Type = ac.Category.Type,
                Description = ac.Category.Description,
                ParentId = ac.Category.ParentId,
                IsActive = ac.Category.IsActive,
                Order = ac.Category.Order,
                CreatedAt = ac.Category.CreatedAt,
                UpdatedAt = ac.Category.UpdatedAt
            }).ToList(),
            Tags = article.ArticleTags.Select(at => new DTOs.Tags.TagResponse
            {
                Id = at.Tag.Id,
                Name = at.Tag.Name,
                Slug = at.Tag.Slug,
                Description = at.Tag.Description,
                CreatedAt = at.Tag.CreatedAt,
                UpdatedAt = at.Tag.UpdatedAt
            }).ToList()
        };
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }

    private string? GetClientIp()
    {
        return Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
               Request.Headers["X-Real-IP"].FirstOrDefault() ??
               HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}

