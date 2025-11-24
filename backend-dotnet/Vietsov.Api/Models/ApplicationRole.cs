using Microsoft.AspNetCore.Identity;

namespace Vietsov.Api.Models;

public class ApplicationRole : IdentityRole<int>
{
    public string? Description { get; set; }
    public string? Permissions { get; set; } // JSON string: {module: [actions]}
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

