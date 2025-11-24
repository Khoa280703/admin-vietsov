namespace Vietsov.Api.DTOs.Roles;

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, List<string>>? Permissions { get; set; }
}

