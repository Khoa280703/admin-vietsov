using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vietsov.Api.Models;

public class ArticleTag
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ArticleId { get; set; }

    [ForeignKey("ArticleId")]
    public virtual Article Article { get; set; } = null!;

    [Required]
    public int TagId { get; set; }

    [ForeignKey("TagId")]
    public virtual Tag Tag { get; set; } = null!;
}

