namespace Vietsov.Api.DTOs.Roles;

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Dictionary<string, List<string>>? Permissions { get; set; }
}

