using System.Text.Json;
using System.Text.Json.Serialization;
using Vietsov.Api.Models;
using Vietsov.Api.Utils;

namespace Vietsov.Api.DTOs.Articles;

public class UpdateArticleRequest
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Excerpt { get; set; }
    public JsonElement? Content { get; set; }
    public string? ContentHtml { get; set; }
    public string? AuthorName { get; set; }
    public string? FeaturedImage { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    [JsonConverter(typeof(NullableArticleStatusJsonConverter))]
    public ArticleStatus? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsBreakingNews { get; set; }
    public bool? AllowComments { get; set; }
    public string? Visibility { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public List<int>? CategoryIds { get; set; }
    public List<int>? TagIds { get; set; }
}

