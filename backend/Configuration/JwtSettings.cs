namespace Vietsov.Api.Configuration;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string ExpiresIn { get; set; } = "24h";
    public string RefreshExpiresIn { get; set; } = "7d";
}

