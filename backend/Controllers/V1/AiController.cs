using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vietsov.Api.DTOs.Ai;
using Vietsov.Api.Services;

namespace Vietsov.Api.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/ai")]
public class AiController : ControllerBase
{
    private readonly IAiContentService _aiContentService;

    public AiController(IAiContentService aiContentService)
    {
        _aiContentService = aiContentService;
    }

    [HttpPost("content")]
    [Authorize]
    public async Task<IActionResult> GenerateContent([FromBody] AiContentRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            return BadRequest(new { error = "Prompt is required." });
        }

        if (string.IsNullOrWhiteSpace(request.ContentJson))
        {
            return BadRequest(new { error = "contentJson is required." });
        }

        var response = await _aiContentService.GenerateContentAsync(request, cancellationToken);
        return Ok(response);
    }
}

