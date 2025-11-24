using System.Text.Json;

namespace Vietsov.Api.DTOs.Articles;

public class CreateArticleRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public JsonElement? Content { get; set; }
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

