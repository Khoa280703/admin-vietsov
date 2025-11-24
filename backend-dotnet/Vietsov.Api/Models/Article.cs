using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vietsov.Api.Models;

public enum ArticleStatus
{
    Draft,
    Submitted,
    UnderReview,
    Approved,
    Rejected,
    Published
}

public class Article
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Subtitle { get; set; }

    [Required]
    [MaxLength(500)]
    public string Slug { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string? Excerpt { get; set; }

    [Required]
    [Column(TypeName = "text")]
    public string ContentJson { get; set; } = string.Empty; // TipTap JSONContent as string

    [Column(TypeName = "text")]
    public string? ContentHtml { get; set; } // Computed HTML from JSON

    [Required]
    public ArticleStatus Status { get; set; } = ArticleStatus.Draft;

    [Required]
    public int AuthorId { get; set; }

    [ForeignKey("AuthorId")]
    public virtual ApplicationUser Author { get; set; } = null!;

    [MaxLength(500)]
    public string? FeaturedImage { get; set; }

    [MaxLength(500)]
    public string? SeoTitle { get; set; }

    [Column(TypeName = "text")]
    public string? SeoDescription { get; set; }

    [Column(TypeName = "text")]
    public string? SeoKeywords { get; set; }

    public bool IsFeatured { get; set; } = false;

    public bool IsBreakingNews { get; set; } = false;

    public bool AllowComments { get; set; } = true;

    [MaxLength(100)]
    public string Visibility { get; set; } = "web,mobile";

    public DateTime? ScheduledAt { get; set; }

    public DateTime? PublishedAt { get; set; }

    [Column(TypeName = "text")]
    public string? ReviewNotes { get; set; }

    public int WordCount { get; set; } = 0;

    public int CharacterCount { get; set; } = 0;

    public int ReadingTime { get; set; } = 0;

    public int Views { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ArticleCategory> ArticleCategories { get; set; } = new List<ArticleCategory>();
    public virtual ICollection<ArticleTag> ArticleTags { get; set; } = new List<ArticleTag>();
}

