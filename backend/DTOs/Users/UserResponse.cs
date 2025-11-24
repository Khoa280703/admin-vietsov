using Vietsov.Api.DTOs.Roles;

namespace Vietsov.Api.DTOs.Users;

public class UserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
    public RoleResponse? Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

