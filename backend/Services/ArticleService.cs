using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.Models;
using Vietsov.Api.Utils;

namespace Vietsov.Api.Services;

public interface IArticleService
{
    Task<Article> CreateArticleAsync(int userId, CreateArticleData data);
    Task<Article> UpdateArticleAsync(int articleId, int userId, UpdateArticleData data, bool isAdmin);
    Task DeleteArticleAsync(int articleId);
    Task<Article> GetArticleWithRelationsAsync(int articleId);
    Task<Article> SubmitArticleAsync(int articleId, int userId);
    Task<Article> ApproveArticleAsync(int articleId, int adminId, string? notes);
    Task<Article> RejectArticleAsync(int articleId, int adminId, string? notes);
    Task<Article> PublishArticleAsync(int articleId, int userId, bool isAdmin);
    Task<(List<Article> Articles, int Total)> GetMyArticlesAsync(int userId, int page, int limit);
}

public class CreateArticleData
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public object? Content { get; set; }
    public string? ContentHtml { get; set; }
    public string? AuthorName { get; set; }
    public string? FeaturedImage { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsBreakingNews { get; set; }
    public bool AllowComments { get; set; } = true;
    public string Visibility { get; set; } = "web,mobile";
    public DateTime? ScheduledAt { get; set; }
    public List<int>? CategoryIds { get; set; }
    public List<int>? TagIds { get; set; }
}

public class UpdateArticleData
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Excerpt { get; set; }
    public object? Content { get; set; }
    public string? ContentHtml { get; set; }
    public string? AuthorName { get; set; }
    public string? FeaturedImage { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public ArticleStatus? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsBreakingNews { get; set; }
    public bool? AllowComments { get; set; }
    public string? Visibility { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public List<int>? CategoryIds { get; set; }
    public List<int>? TagIds { get; set; }
}

public class ArticleService : IArticleService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ArticleService> _logger;

    public ArticleService(ApplicationDbContext context, ILogger<ArticleService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Article> CreateArticleAsync(int userId, CreateArticleData data)
    {
        var slug = data.Slug ?? SlugHelper.GenerateSlug(data.Title);

        // Check if slug exists
        var existingArticle = await _context.Articles.FirstOrDefaultAsync(a => a.Slug == slug);
        if (existingArticle != null)
        {
            throw new InvalidOperationException("Article with this slug already exists");
        }

        var contentJson = data.Content switch
        {
            string str => str,
            null => """{"type":"doc","content":[]}""",
            _ => System.Text.Json.JsonSerializer.Serialize(data.Content)
        };

        var (wordCount, characterCount, readingTime) = ContentStatsHelper.CalculateStats(contentJson);

        var article = new Article
        {
            Title = data.Title,
            Subtitle = data.Subtitle,
            Slug = slug,
            Excerpt = data.Excerpt,
            ContentJson = contentJson,
            ContentHtml = data.ContentHtml,
            Status = ArticleStatus.Draft,
            AuthorName = data.AuthorName,
            FeaturedImage = data.FeaturedImage,
            SeoTitle = data.SeoTitle ?? data.Title,
            SeoDescription = data.SeoDescription ?? data.Excerpt,
            SeoKeywords = data.SeoKeywords,
            IsFeatured = data.IsFeatured,
            IsBreakingNews = data.IsBreakingNews,
            AllowComments = data.AllowComments,
            Visibility = data.Visibility,
            ScheduledAt = data.ScheduledAt,
            WordCount = wordCount,
            CharacterCount = characterCount,
            ReadingTime = readingTime,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Handle categories
        if (data.CategoryIds != null && data.CategoryIds.Count > 0)
        {
            foreach (var categoryId in data.CategoryIds)
            {
                var category = await _context.Categories.FindAsync(categoryId);
                if (category != null)
                {
                    var articleCategory = new ArticleCategory
                    {
                        ArticleId = article.Id,
                        CategoryId = category.Id
                    };
                    _context.ArticleCategories.Add(articleCategory);
                }
            }
            await _context.SaveChangesAsync();
        }

        // Handle tags
        if (data.TagIds != null && data.TagIds.Count > 0)
        {
            foreach (var tagId in data.TagIds)
            {
                var tag = await _context.Tags.FindAsync(tagId);
                if (tag != null)
                {
                    var articleTag = new ArticleTag
                    {
                        ArticleId = article.Id,
                        TagId = tag.Id
                    };
                    _context.ArticleTags.Add(articleTag);
                }
            }
            await _context.SaveChangesAsync();
        }

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task<Article> UpdateArticleAsync(int articleId, int userId, UpdateArticleData data, bool isAdmin)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        // Permission check: user can only update draft/submitted articles
        if (!isAdmin)
        {
            if (article.Status != ArticleStatus.Draft && article.Status != ArticleStatus.Submitted)
            {
                throw new UnauthorizedAccessException("You can only update draft or submitted articles");
            }
        }

        if (!string.IsNullOrEmpty(data.Title)) article.Title = data.Title;
        if (data.Subtitle != null) article.Subtitle = data.Subtitle;
        if (data.Excerpt != null) article.Excerpt = data.Excerpt;
        if (data.Content != null)
        {
            var contentJson = data.Content switch
            {
                string str => str,
                _ => System.Text.Json.JsonSerializer.Serialize(data.Content)
            };
            article.ContentJson = contentJson;
            var (wordCount, characterCount, readingTime) = ContentStatsHelper.CalculateStats(contentJson);
            article.WordCount = wordCount;
            article.CharacterCount = characterCount;
            article.ReadingTime = readingTime;
        }
        if (data.ContentHtml != null) article.ContentHtml = data.ContentHtml;
        if (data.AuthorName != null) article.AuthorName = data.AuthorName;
        if (data.FeaturedImage != null) article.FeaturedImage = data.FeaturedImage;
        if (data.SeoTitle != null) article.SeoTitle = data.SeoTitle;
        if (data.SeoDescription != null) article.SeoDescription = data.SeoDescription;
        if (data.SeoKeywords != null) article.SeoKeywords = data.SeoKeywords;
        // Update status if provided
        // Admin can change status to any value, regular users can only change to draft/submitted
        if (data.Status.HasValue)
        {
            if (isAdmin)
            {
                // Admin can set any status
                article.Status = data.Status.Value;
            }
            else
            {
                // Regular users can only set to draft or submitted
                if (data.Status.Value == ArticleStatus.Draft || data.Status.Value == ArticleStatus.Submitted)
                {
                    article.Status = data.Status.Value;
                }
            }
        }
        if (data.IsFeatured.HasValue) article.IsFeatured = data.IsFeatured.Value;
        if (data.IsBreakingNews.HasValue) article.IsBreakingNews = data.IsBreakingNews.Value;
        if (data.AllowComments.HasValue) article.AllowComments = data.AllowComments.Value;
        if (data.Visibility != null) article.Visibility = data.Visibility;
        if (data.ScheduledAt != null) article.ScheduledAt = data.ScheduledAt;

        // Update slug if title changed
        if (!string.IsNullOrEmpty(data.Title) && data.Title != article.Title)
        {
            var newSlug = SlugHelper.GenerateSlug(data.Title);
            var existingArticle = await _context.Articles.FirstOrDefaultAsync(a => a.Slug == newSlug);
            if (existingArticle == null || existingArticle.Id == article.Id)
            {
                article.Slug = newSlug;
            }
        }

        article.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Update categories if provided
        if (data.CategoryIds != null)
        {
            var existingCategories = await _context.ArticleCategories
                .Where(ac => ac.ArticleId == article.Id)
                .ToListAsync();
            _context.ArticleCategories.RemoveRange(existingCategories);

            if (data.CategoryIds.Count > 0)
            {
                foreach (var categoryId in data.CategoryIds)
                {
                    var category = await _context.Categories.FindAsync(categoryId);
                    if (category != null)
                    {
                        var articleCategory = new ArticleCategory
                        {
                            ArticleId = article.Id,
                            CategoryId = category.Id
                        };
                        _context.ArticleCategories.Add(articleCategory);
                    }
                }
            }
            await _context.SaveChangesAsync();
        }

        // Update tags if provided
        if (data.TagIds != null)
        {
            var existingTags = await _context.ArticleTags
                .Where(at => at.ArticleId == article.Id)
                .ToListAsync();
            _context.ArticleTags.RemoveRange(existingTags);

            if (data.TagIds.Count > 0)
            {
                foreach (var tagId in data.TagIds)
                {
                    var tag = await _context.Tags.FindAsync(tagId);
                    if (tag != null)
                    {
                        var articleTag = new ArticleTag
                        {
                            ArticleId = article.Id,
                            TagId = tag.Id
                        };
                        _context.ArticleTags.Add(articleTag);
                    }
                }
            }
            await _context.SaveChangesAsync();
        }

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task DeleteArticleAsync(int articleId)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        // Remove related records
        var articleCategories = await _context.ArticleCategories
            .Where(ac => ac.ArticleId == articleId)
            .ToListAsync();
        _context.ArticleCategories.RemoveRange(articleCategories);

        var articleTags = await _context.ArticleTags
            .Where(at => at.ArticleId == articleId)
            .ToListAsync();
        _context.ArticleTags.RemoveRange(articleTags);

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();
    }

    public async Task<Article> GetArticleWithRelationsAsync(int articleId)
    {
        var article = await _context.Articles
            .Include(a => a.ArticleCategories)
                .ThenInclude(ac => ac.Category)
            .Include(a => a.ArticleTags)
                .ThenInclude(at => at.Tag)
            .FirstOrDefaultAsync(a => a.Id == articleId);

        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        return article;
    }

    public async Task<Article> SubmitArticleAsync(int articleId, int userId)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        if (article.Status != ArticleStatus.Draft)
        {
            throw new InvalidOperationException("Only draft articles can be submitted");
        }

        article.Status = ArticleStatus.Submitted;
        article.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task<Article> ApproveArticleAsync(int articleId, int adminId, string? notes)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        if (article.Status != ArticleStatus.Submitted && article.Status != ArticleStatus.UnderReview)
        {
            throw new InvalidOperationException("Article is not in a reviewable state");
        }

        article.Status = ArticleStatus.Approved;
        if (!string.IsNullOrEmpty(notes))
        {
            article.ReviewNotes = notes;
        }
        article.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task<Article> RejectArticleAsync(int articleId, int adminId, string? notes)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        if (article.Status != ArticleStatus.Submitted && article.Status != ArticleStatus.UnderReview)
        {
            throw new InvalidOperationException("Article is not in a reviewable state");
        }

        article.Status = ArticleStatus.Rejected;
        if (!string.IsNullOrEmpty(notes))
        {
            article.ReviewNotes = notes;
        }
        article.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task<Article> PublishArticleAsync(int articleId, int userId, bool isAdmin)
    {
        var article = await _context.Articles.FindAsync(articleId);
        if (article == null)
        {
            throw new InvalidOperationException("Article not found");
        }

        // Admin can publish any article, user can only publish approved articles
        if (!isAdmin)
        {
            if (article.Status != ArticleStatus.Approved)
            {
                throw new InvalidOperationException("Only approved articles can be published");
            }
        }

        article.Status = ArticleStatus.Published;
        article.PublishedAt = DateTime.UtcNow;
        article.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetArticleWithRelationsAsync(article.Id);
    }

    public async Task<(List<Article> Articles, int Total)> GetMyArticlesAsync(int userId, int page, int limit)
    {
        // Note: Since AuthorId is removed, return all articles for now
        // In the future, you might want to track author via Logs or separate table
        var query = _context.Articles
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync();
        var articles = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (articles, total);
    }
}

