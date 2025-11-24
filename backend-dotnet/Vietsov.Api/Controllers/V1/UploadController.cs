using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vietsov.Api.Services;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IUploadService _uploadService;
    private readonly ILogger<UploadController> _logger;

    public UploadController(
        IUploadService uploadService,
        ILogger<UploadController> logger)
    {
        _uploadService = uploadService;
        _logger = logger;
    }

    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(IFormFile image)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded" });
            }

            var fileName = await _uploadService.UploadImageAsync(
                image.OpenReadStream(),
                image.FileName,
                image.ContentType
            );

            var url = _uploadService.GetFileUrl(fileName);

            return Ok(new
            {
                url,
                filename = fileName,
                originalName = image.FileName,
                size = image.Length,
                mimetype = image.ContentType
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

