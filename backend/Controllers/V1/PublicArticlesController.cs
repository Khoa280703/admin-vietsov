using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.DTOs.Articles;
using Vietsov.Api.DTOs.Categories;
using Vietsov.Api.DTOs.Tags;
using Vietsov.Api.Models;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/public/articles")]
public class PublicArticlesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PublicArticlesController> _logger;

    public PublicArticlesController(
        ApplicationDbContext context,
        ILogger<PublicArticlesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{slugId}")]
    public async Task<IActionResult> GetBySlugId(string slugId)
    {
        try
        {
            // Parse slug-id format: split by last hyphen
            // Example: "tin-tuc-lu-lut-moi-nhat-13123123123123" -> slug: "tin-tuc-lu-lut-moi-nhat", id: "13123123123123"
            var lastHyphenIndex = slugId.LastIndexOf('-');
            if (lastHyphenIndex == -1 || lastHyphenIndex == slugId.Length - 1)
            {
                return BadRequest(new { error = "Invalid slug-id format. Expected format: slug-id" });
            }

            var slug = slugId.Substring(0, lastHyphenIndex);
            var idString = slugId.Substring(lastHyphenIndex + 1);

            // Try to parse ID
            if (!int.TryParse(idString, out var id))
            {
                return BadRequest(new { error = "Invalid article ID in slug-id format" });
            }

            // Fetch article with relations, only if published
            var article = await _context.Articles
                .Include(a => a.ArticleCategories)
                    .ThenInclude(ac => ac.Category)
                .Include(a => a.ArticleTags)
                    .ThenInclude(at => at.Tag)
                .FirstOrDefaultAsync(a => a.Id == id && a.Slug == slug && a.Status == ArticleStatus.Published);

            if (article == null)
            {
                return NotFound(new { error = "Article not found or not published" });
            }

            // Increment view count
            article.Views++;
            await _context.SaveChangesAsync();

            var response = MapToArticleResponse(article);
            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public article by slug-id: {SlugId}", slugId);
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
            Categories = article.ArticleCategories.Select(ac => new CategoryResponse
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
            Tags = article.ArticleTags.Select(at => new TagResponse
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
}

