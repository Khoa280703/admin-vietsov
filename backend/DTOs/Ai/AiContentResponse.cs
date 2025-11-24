namespace Vietsov.Api.DTOs.Ai;

public class AiContentResponse
{
    public string RawText { get; set; } = string.Empty;
    public string? UpdatedContentJson { get; set; }
    public string? Summary { get; set; }
}

