using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vietsov.Api.Models;

public enum LogLevel
{
    Info,
    Warn,
    Error
}

public class Log
{
    [Key]
    public int Id { get; set; }

    public int? UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Module { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string Method { get; set; } = string.Empty;

    [Required]
    public int StatusCode { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [Column(TypeName = "text")]
    public string? UserAgent { get; set; }

    [Required]
    [Column(TypeName = "text")]
    public string Message { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public LogLevel Level { get; set; } = LogLevel.Info;

    [Column(TypeName = "text")]
    public string? Metadata { get; set; } // JSON string

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

