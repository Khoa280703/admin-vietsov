using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vietsov.Api.DTOs.Categories;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Validators;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ILogService _logService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        ICategoryService categoryService,
        ILogService logService,
        ILogger<CategoriesController> logger)
    {
        _categoryService = categoryService;
        _logService = logService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] CategoryType? type = null)
    {
        try
        {
            var categories = await _categoryService.GetTreeAsync(type);
            var response = categories.Select(c => MapToCategoryResponse(c)).ToList();
            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing categories");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("types")]
    public IActionResult GetTypes()
    {
        var types = Enum.GetValues(typeof(CategoryType))
            .Cast<CategoryType>()
            .Select(t => new { value = (int)t, name = t.ToString() })
            .ToList();
        return Ok(new { data = types });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var category = await _categoryService.GetChildrenAsync(id);
            var response = MapToCategoryResponse(category);
            return Ok(new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        try
        {
            var validator = new CreateCategoryRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var createData = new Services.CreateCategoryData
            {
                Name = request.Name,
                Slug = request.Slug,
                Type = request.Type,
                ParentId = request.ParentId,
                Description = request.Description,
                Order = request.Order
            };

            var category = await _categoryService.CreateCategoryAsync(createData);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "create_category",
                Module = "categories",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 201,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User created category: {category.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { categoryId = category.Id, categoryName = category.Name }
            });

            var response = MapToCategoryResponse(category);
            return StatusCode(201, new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        try
        {
            var validator = new UpdateCategoryRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var updateData = new Services.UpdateCategoryData
            {
                Name = request.Name,
                Slug = request.Slug,
                Type = request.Type,
                ParentId = request.ParentId,
                Description = request.Description,
                Order = request.Order,
                IsActive = request.IsActive
            };

            var category = await _categoryService.UpdateCategoryAsync(id, updateData);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "update_category",
                Module = "categories",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User updated category: {category.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { categoryId = category.Id }
            });

            var response = MapToCategoryResponse(category);
            return Ok(new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _categoryService.DeleteCategoryAsync(id);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "delete_category",
                Module = "categories",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User deleted category ID: {id}",
                Level = Models.LogLevel.Info,
                Metadata = new { categoryId = id }
            });

            return Ok(new { message = "Category deleted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private CategoryResponse MapToCategoryResponse(Category category)
    {
        return MapToCategoryResponse(category, new HashSet<int>());
    }

    private CategoryResponse MapToCategoryResponse(Category category, HashSet<int> visited)
    {
        // Prevent circular reference by tracking visited categories
        if (visited.Contains(category.Id))
        {
            // Return a minimal response to break the cycle
            return new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Type = category.Type,
                ParentId = category.ParentId,
                IsActive = category.IsActive,
                Order = category.Order,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt,
                Children = new List<CategoryResponse>()
            };
        }

        visited.Add(category.Id);

        var response = new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Type = category.Type,
            Description = category.Description,
            ParentId = category.ParentId,
            IsActive = category.IsActive,
            Order = category.Order,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };

        // Map parent (only basic info, no children or parent to avoid circular reference)
        if (category.Parent != null && !visited.Contains(category.Parent.Id))
        {
            response.Parent = new CategoryResponse
            {
                Id = category.Parent.Id,
                Name = category.Parent.Name,
                Slug = category.Parent.Slug,
                Type = category.Parent.Type,
                Description = category.Parent.Description,
                ParentId = category.Parent.ParentId,
                IsActive = category.Parent.IsActive,
                Order = category.Parent.Order,
                CreatedAt = category.Parent.CreatedAt,
                UpdatedAt = category.Parent.UpdatedAt,
                Children = new List<CategoryResponse>() // Empty to avoid recursion
            };
        }

        // Map children recursively (only if not already visited)
        if (category.Children != null && category.Children.Any())
        {
            response.Children = category.Children
                .Where(c => !visited.Contains(c.Id))
                .Select(c => MapToCategoryResponse(c, visited))
                .ToList();
        }
        else
        {
            response.Children = new List<CategoryResponse>();
        }

        visited.Remove(category.Id); // Remove after processing to allow same category in different branches
        return response;
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

