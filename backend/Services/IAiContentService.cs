using Vietsov.Api.DTOs.Ai;

namespace Vietsov.Api.Services;

public interface IAiContentService
{
    Task<AiContentResponse> GenerateContentAsync(AiContentRequest request, CancellationToken cancellationToken = default);
}

