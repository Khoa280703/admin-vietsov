namespace Vietsov.Api.DTOs.Users;

public class UpdateUserRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public int? RoleId { get; set; }
    public bool? IsActive { get; set; }
}

