namespace Vietsov.Api.DTOs.Roles;

public class RoleResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Permissions { get; set; } // JSON string
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

