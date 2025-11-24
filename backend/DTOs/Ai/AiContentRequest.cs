namespace Vietsov.Api.DTOs.Ai;

public class AiContentRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string ContentJson { get; set; } = string.Empty;
    public List<AiChatMessage>? History { get; set; }
}

