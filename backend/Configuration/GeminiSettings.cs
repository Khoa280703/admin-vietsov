namespace Vietsov.Api.Configuration;

public class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-2.5-flash-lite";
    public double Temperature { get; set; } = 0.4;
    public int MaxOutputTokens { get; set; } = 2048;
}

