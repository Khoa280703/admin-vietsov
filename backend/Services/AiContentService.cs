using System.Text;
using System.Text.Json;
using System.Linq;
using Microsoft.Extensions.Options;
using Vietsov.Api.Configuration;
using Vietsov.Api.DTOs.Ai;

namespace Vietsov.Api.Services;

public class AiContentService : IAiContentService
{
    private const string Instructions = """
You are an AI editor assisting journalists with articles represented in TipTap JSON (ProseMirror) format.
Always respond with a strict JSON object using the schema:
{
  "contentJson": "<valid TipTap JSON string>",
  "summary": "<short description of the changes (<=50 words)>"
}
Do not wrap the JSON in markdown fences or add extra commentary outside the JSON.
Preserve valid TipTap structure (type/doc/content structure, marks, attrs).
""";

    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly JsonSerializerOptions _serializerOptions = new(JsonSerializerDefaults.Web);

    public AiContentService(HttpClient httpClient, IOptions<GeminiSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<AiContentResponse> GenerateContentAsync(
        AiContentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        if (string.IsNullOrWhiteSpace(request.ContentJson))
        {
            throw new ArgumentException("ContentJson is required", nameof(request.ContentJson));
        }

        var endpoint = $"v1beta/models/{_settings.Model}:generateContent?key={_settings.ApiKey}";
        var payload = new
        {
            contents = BuildContents(request),
            generationConfig = new
            {
                temperature = _settings.Temperature,
                maxOutputTokens = _settings.MaxOutputTokens,
            }
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload, _serializerOptions),
                Encoding.UTF8,
                "application/json")
        };

        var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Gemini API request failed ({response.StatusCode}): {body}");
        }

        return ParseResponse(body);
    }

    private object[] BuildContents(AiContentRequest request)
    {
        var contents = new List<object>
        {
            new
            {
                role = "user",
                parts = new[]
                {
                    new { text = Instructions }
                }
            }
        };

        if (request.History is { Count: > 0 })
        {
            contents.AddRange(request.History.Select(message => new
            {
                role = NormalizeRole(message.Role),
                parts = new[]
                {
                    new { text = message.Content }
                }
            }));
        }

        var builder = new StringBuilder();
        builder.AppendLine("Current article JSON (TipTap):");
        builder.AppendLine(request.ContentJson);
        builder.AppendLine();
        builder.AppendLine("User request:");
        builder.AppendLine(request.Prompt);

        contents.Add(new
        {
            role = "user",
            parts = new[]
            {
                new { text = builder.ToString() }
            }
        });

        return contents.ToArray();
    }

    private static string NormalizeRole(string? role)
    {
        return role switch
        {
            "model" => "model",
            "assistant" => "model",
            _ => "user"
        };
    }

    private AiContentResponse ParseResponse(string body)
    {
        var document = JsonDocument.Parse(body);
        if (!document.RootElement.TryGetProperty("candidates", out var candidatesElement))
        {
            return new AiContentResponse { RawText = string.Empty };
        }

        var firstCandidate = candidatesElement.EnumerateArray().FirstOrDefault();
        if (firstCandidate.ValueKind == JsonValueKind.Undefined ||
            !firstCandidate.TryGetProperty("content", out var contentElement) ||
            !contentElement.TryGetProperty("parts", out var partsElement))
        {
            return new AiContentResponse { RawText = string.Empty };
        }

        var text = partsElement
            .EnumerateArray()
            .Select(part => part.TryGetProperty("text", out var textElement) ? textElement.GetString() ?? string.Empty : string.Empty)
            .FirstOrDefault(string.Empty);

        var response = new AiContentResponse
        {
            RawText = text
        };

        var jsonPayload = TryExtractJson(text);
        if (!string.IsNullOrWhiteSpace(jsonPayload))
        {
            try
            {
                var payloadDoc = JsonDocument.Parse(jsonPayload);
                if (payloadDoc.RootElement.TryGetProperty("contentJson", out var contentJsonElement))
                {
                    response.UpdatedContentJson = contentJsonElement.GetString();
                }

                if (payloadDoc.RootElement.TryGetProperty("summary", out var summaryElement))
                {
                    response.Summary = summaryElement.GetString();
                }
            }
            catch (JsonException)
            {
                // Swallow parse errors; frontend will handle raw text
            }
        }

        return response;
    }

    private static string? TryExtractJson(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var trimmed = text.Trim();
        if (trimmed.StartsWith("```"))
        {
            var startFence = trimmed.IndexOf("```", StringComparison.Ordinal);
            var endFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (endFence > startFence)
            {
                trimmed = trimmed[(startFence + 3)..endFence].Trim();
            }
        }

        var startIndex = trimmed.IndexOf('{');
        var endIndex = trimmed.LastIndexOf('}');

        if (startIndex >= 0 && endIndex > startIndex)
        {
            return trimmed[startIndex..(endIndex + 1)];
        }

        return null;
    }
}

