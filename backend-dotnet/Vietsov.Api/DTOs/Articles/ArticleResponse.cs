using Vietsov.Api.DTOs.Categories;
using Vietsov.Api.DTOs.Tags;
using Vietsov.Api.DTOs.Users;
using Vietsov.Api.Models;

namespace Vietsov.Api.DTOs.Articles;

public class ArticleResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    public ArticleStatus Status { get; set; }
    public int AuthorId { get; set; }
    public UserResponse? Author { get; set; }
    public string? FeaturedImage { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsBreakingNews { get; set; }
    public bool AllowComments { get; set; }
    public string Visibility { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public int WordCount { get; set; }
    public int CharacterCount { get; set; }
    public int ReadingTime { get; set; }
    public int Views { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CategoryResponse> Categories { get; set; } = new();
    public List<TagResponse> Tags { get; set; } = new();
}

