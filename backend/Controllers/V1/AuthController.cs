using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.DTOs.Auth;
using Vietsov.Api.Models;
using Vietsov.Api.Services;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IJwtService _jwtService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        IJwtService jwtService,
        ApplicationDbContext context,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { error = "Username and password are required" });
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.UserName == request.Username || u.Email == request.Username);

        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("Failed login attempt for username/email: {Username}", request.Username);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            _logger.LogWarning("Failed login attempt for user: {Username} (invalid password)", user.UserName);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        // Get user's role
        var userRoles = await _userManager.GetRolesAsync(user);
        var roleName = userRoles.FirstOrDefault() ?? "user";
        var role = await _roleManager.FindByNameAsync(roleName) ?? 
                   await _roleManager.Roles.FirstOrDefaultAsync(r => r.Name == roleName);

        if (role == null)
        {
            return StatusCode(500, new { error = "User role not found" });
        }

        var accessToken = _jwtService.GenerateAccessToken(user, role);
        var refreshToken = _jwtService.GenerateRefreshToken(user, role);

        _logger.LogInformation("User {Username} logged in successfully", user.UserName);

        var response = new LoginResponse
        {
            User = new UserDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Role = new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name ?? string.Empty,
                    Description = role.Description
                }
            },
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new { error = "Refresh token is required" });
        }

        var principal = _jwtService.ValidateToken(request.RefreshToken);
        if (principal == null)
        {
            return Unauthorized(new { error = "Invalid refresh token" });
        }

        // Check if it's a refresh token
        var isRefreshToken = principal.Claims.Any(c => c.Type == "refresh" && c.Value == "true");
        if (!isRefreshToken)
        {
            return Unauthorized(new { error = "Invalid refresh token" });
        }

        var userIdClaim = principal.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Invalid refresh token" });
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || !user.IsActive)
        {
            return Unauthorized(new { error = "User not found or inactive" });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        var roleName = userRoles.FirstOrDefault() ?? "user";
        var role = await _roleManager.FindByNameAsync(roleName) ?? 
                   await _roleManager.Roles.FirstOrDefaultAsync(r => r.Name == roleName);

        if (role == null)
        {
            return StatusCode(500, new { error = "User role not found" });
        }

        var accessToken = _jwtService.GenerateAccessToken(user, role);

        return Ok(new RefreshTokenResponse { AccessToken = accessToken });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Unauthorized" });
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        var roleName = userRoles.FirstOrDefault() ?? "user";
        var role = await _roleManager.FindByNameAsync(roleName) ?? 
                   await _roleManager.Roles.FirstOrDefaultAsync(r => r.Name == roleName);

        var response = new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Role = role != null ? new RoleDto
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description
            } : null
        };

        return Ok(new { user = response });
    }
}

