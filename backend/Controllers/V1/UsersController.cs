using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.DTOs.Users;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Validators;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly ILogService _logService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ApplicationDbContext context,
        ILogService logService,
        ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logService = logService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            var skip = (page - 1) * limit;

            var users = await _userManager.Users
                .OrderByDescending(u => u.Id)
                .Skip(skip)
                .Take(limit)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    Username = u.UserName ?? string.Empty,
                    Email = u.Email ?? string.Empty,
                    FullName = u.FullName,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .ToListAsync();

            var total = await _userManager.Users.CountAsync();

            // Get roles for each user
            foreach (var user in users)
            {
                var appUser = await _userManager.FindByIdAsync(user.Id.ToString());
                if (appUser != null)
                {
                    var roles = await _userManager.GetRolesAsync(appUser);
                    var roleName = roles.FirstOrDefault();
                    if (!string.IsNullOrEmpty(roleName))
                    {
                        var role = await _roleManager.FindByNameAsync(roleName);
                        if (role != null)
                        {
                            user.Role = new DTOs.Roles.RoleResponse
                            {
                                Id = role.Id,
                                Name = role.Name ?? string.Empty,
                                Description = role.Description,
                                Permissions = role.Permissions,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            user.RoleId = role.Id;
                        }
                    }
                }
            }

            return Ok(new ListUsersResponse
            {
                Data = users,
                Pagination = new PaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing users");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            // User can only see themselves, admin can see anyone
            var isAdmin = User.IsInRole("admin");
            if (!isAdmin && currentUserId.Value != id)
            {
                return Forbid();
            }

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault();
            DTOs.Roles.RoleResponse? roleResponse = null;
            if (!string.IsNullOrEmpty(roleName))
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    roleResponse = new DTOs.Roles.RoleResponse
                    {
                        Id = role.Id,
                        Name = role.Name ?? string.Empty,
                        Description = role.Description,
                        Permissions = role.Permissions,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                }
            }

            var response = new UserResponse
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Role = roleResponse,
                RoleId = roleResponse?.Id ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        try
        {
            var validator = new CreateUserRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            // Check if user exists
            var existingUser = await _userManager.FindByNameAsync(request.Username) ??
                              await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { error = "Username or email already exists" });
            }

            // Check if role exists
            var role = await _roleManager.FindByIdAsync(request.RoleId.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            // Create user
            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            // Assign role
            await _userManager.AddToRoleAsync(user, role.Name ?? string.Empty);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "create_user",
                Module = "users",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 201,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User created new user: {user.UserName}",
                Level = Models.LogLevel.Info,
                Metadata = new { createdUserId = user.Id, createdUsername = user.UserName }
            });

            var roleResponse = new DTOs.Roles.RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var response = new UserResponse
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Role = roleResponse,
                RoleId = role.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return StatusCode(201, new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var validator = new UpdateUserRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { error = "Unauthorized" });
            }

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Check permissions: user can only update themselves, admin can update anyone
            var isAdmin = User.IsInRole("admin");
            if (!isAdmin && currentUserId.Value != id)
            {
                return Forbid();
            }

            if (!string.IsNullOrEmpty(request.Username)) user.UserName = request.Username;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
            if (request.IsActive.HasValue && isAdmin) user.IsActive = request.IsActive.Value;

            // Update role if admin and roleId provided
            if (request.RoleId.HasValue && isAdmin)
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId.Value.ToString());
                if (role == null)
                {
                    return NotFound(new { error = "Role not found" });
                }

                // Remove existing roles
                var existingRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, existingRoles);

                // Add new role
                await _userManager.AddToRoleAsync(user, role.Name ?? string.Empty);
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", updateResult.Errors.Select(e => e.Description)) });
            }

            // Log
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "update_user",
                Module = "users",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User updated user: {user.UserName}",
                Level = Models.LogLevel.Info,
                Metadata = new { updatedUserId = user.Id }
            });

            // Get updated user with role
            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault();
            DTOs.Roles.RoleResponse? roleResponse = null;
            if (!string.IsNullOrEmpty(roleName))
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    roleResponse = new DTOs.Roles.RoleResponse
                    {
                        Id = role.Id,
                        Name = role.Name ?? string.Empty,
                        Description = role.Description,
                        Permissions = role.Permissions,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                }
            }

            var response = new UserResponse
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Role = roleResponse,
                RoleId = roleResponse?.Id ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Soft delete: set isActive to false
            var deletedUsername = user.UserName;
            user.IsActive = false;
            await _userManager.UpdateAsync(user);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "delete_user",
                Module = "users",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User deleted user: {deletedUsername}",
                Level = Models.LogLevel.Info,
                Metadata = new { deletedUserId = id }
            });

            return Ok(new { message = "User deactivated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}/role")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AssignRole(int id, [FromBody] AssignRoleRequest request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var role = await _roleManager.FindByIdAsync(request.RoleId.ToString());
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }

            // Remove existing roles
            var existingRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, existingRoles);

            // Add new role
            await _userManager.AddToRoleAsync(user, role.Name ?? string.Empty);

            // Get updated user with role
            var roleResponse = new DTOs.Roles.RoleResponse
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                Permissions = role.Permissions,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var response = new UserResponse
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Role = roleResponse,
                RoleId = role.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role");
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

public class AssignRoleRequest
{
    public int RoleId { get; set; }
}

