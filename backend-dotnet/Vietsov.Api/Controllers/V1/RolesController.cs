using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.DTOs.Roles;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Validators;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ILogService _logService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        RoleManager<ApplicationRole> roleManager,
        ILogService logService,
        ILogger<RolesController> logger)
    {
        _roleManager = roleManager;
        _logService = logService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        try
        {
            var roles = await _roleManager.Roles
                .OrderByDescending(r => r.Id)
                .ToListAsync();

            var response = roles.Select(r => new RoleResponse
            {
                Id = r.Id,
                Name = r.Name ?? string.Empty,
                Description = r.Description,
                Permissions = r.Permissions,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            }).ToList();

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing roles");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            var response = new RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        try
        {
            var validator = new CreateRoleRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var existingRole = await _roleManager.FindByNameAsync(request.Name);
            if (existingRole != null)
            {
                return BadRequest(new { error = "Role name already exists" });
            }

            var role = new ApplicationRole
            {
                Name = request.Name,
                Description = request.Description,
                Permissions = request.Permissions != null ? JsonSerializer.Serialize(request.Permissions) : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _roleManager.CreateAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "create_role",
                Module = "roles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 201,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User created role: {role.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { roleId = role.Id, roleName = role.Name }
            });

            var response = new RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };

            return StatusCode(201, new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var validator = new UpdateRoleRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            if (!string.IsNullOrEmpty(request.Name) && request.Name != role.Name)
            {
                var existingRole = await _roleManager.FindByNameAsync(request.Name);
                if (existingRole != null)
                {
                    return BadRequest(new { error = "Role name already exists" });
                }
                role.Name = request.Name;
            }

            if (request.Description != null) role.Description = request.Description;
            if (request.Permissions != null) role.Permissions = JsonSerializer.Serialize(request.Permissions);

            role.UpdatedAt = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "update_role",
                Module = "roles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User updated role: {role.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { roleId = role.Id }
            });

            var response = new RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            var roleName = role.Name;
            var result = await _roleManager.DeleteAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "delete_role",
                Module = "roles",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User deleted role: {roleName}",
                Level = Models.LogLevel.Info,
                Metadata = new { roleId = id }
            });

            return Ok(new { message = "Role deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}/permissions")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdatePermissions(int id, [FromBody] UpdatePermissionsRequest request)
    {
        try
        {
            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            role.Permissions = JsonSerializer.Serialize(request.Permissions);
            role.UpdatedAt = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            var response = new RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role permissions");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }

    private string? GetClientIp()
    {
        return Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
               Request.Headers["X-Real-IP"].FirstOrDefault() ??
               HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}

public class UpdatePermissionsRequest
{
    public Dictionary<string, List<string>> Permissions { get; set; } = new();
}

