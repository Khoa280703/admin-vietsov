using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vietsov.Api.DTOs.Tags;
using Vietsov.Api.DTOs.Users;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Validators;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tags")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;
    private readonly ILogService _logService;
    private readonly ILogger<TagsController> _logger;

    public TagsController(
        ITagService tagService,
        ILogService logService,
        ILogger<TagsController> logger)
    {
        _tagService = tagService;
        _logService = logService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? search = null)
    {
        try
        {
            var (tags, total) = await _tagService.ListTagsAsync(page, limit, search);
            var response = tags.Select(t => new TagResponse
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Description = t.Description,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToList();

            return Ok(new
            {
                data = response,
                pagination = new PaginationInfo
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
            _logger.LogError(ex, "Error listing tags");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return NotFound(new { error = "Tag not found" });
            }

            var response = new TagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                Slug = tag.Slug,
                Description = tag.Description,
                CreatedAt = tag.CreatedAt,
                UpdatedAt = tag.UpdatedAt
            };

            return Ok(new { data = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tag by ID");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateTagRequest request)
    {
        try
        {
            var validator = new CreateTagRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var createData = new Services.CreateTagData
            {
                Name = request.Name,
                Slug = request.Slug,
                Description = request.Description
            };

            var tag = await _tagService.CreateTagAsync(createData);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "create_tag",
                Module = "tags",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 201,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User created tag: {tag.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { tagId = tag.Id, tagName = tag.Name }
            });

            var response = new TagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                Slug = tag.Slug,
                Description = tag.Description,
                CreatedAt = tag.CreatedAt,
                UpdatedAt = tag.UpdatedAt
            };

            return StatusCode(201, new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tag");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTagRequest request)
    {
        try
        {
            var validator = new UpdateTagRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
            }

            var updateData = new Services.UpdateTagData
            {
                Name = request.Name,
                Slug = request.Slug,
                Description = request.Description
            };

            var tag = await _tagService.UpdateTagAsync(id, updateData);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "update_tag",
                Module = "tags",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User updated tag: {tag.Name}",
                Level = Models.LogLevel.Info,
                Metadata = new { tagId = tag.Id }
            });

            var response = new TagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                Slug = tag.Slug,
                Description = tag.Description,
                CreatedAt = tag.CreatedAt,
                UpdatedAt = tag.UpdatedAt
            };

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
            _logger.LogError(ex, "Error updating tag");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _tagService.DeleteTagAsync(id);

            // Log
            var currentUserId = GetCurrentUserId();
            await _logService.WriteLogAsync(new LogData
            {
                UserId = currentUserId,
                Action = "delete_tag",
                Module = "tags",
                Endpoint = Request.Path,
                Method = Request.Method,
                StatusCode = 200,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Message = $"User deleted tag ID: {id}",
                Level = Models.LogLevel.Info,
                Metadata = new { tagId = id }
            });

            return Ok(new { message = "Tag deleted successfully" });
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
            _logger.LogError(ex, "Error deleting tag");
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

