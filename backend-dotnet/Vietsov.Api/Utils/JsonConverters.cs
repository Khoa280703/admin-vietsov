using System.Text.Json;
using System.Text.Json.Serialization;
using Vietsov.Api.Models;

namespace Vietsov.Api.Utils;

public class ArticleStatusJsonConverter : JsonConverter<ArticleStatus>
{
    public override ArticleStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
        {
            return ArticleStatus.Draft;
        }

        // Convert from snake_case to PascalCase
        return value.ToLowerInvariant() switch
        {
            "draft" => ArticleStatus.Draft,
            "submitted" => ArticleStatus.Submitted,
            "under_review" => ArticleStatus.UnderReview,
            "approved" => ArticleStatus.Approved,
            "rejected" => ArticleStatus.Rejected,
            "published" => ArticleStatus.Published,
            _ => ArticleStatus.Draft
        };
    }

    public override void Write(Utf8JsonWriter writer, ArticleStatus value, JsonSerializerOptions options)
    {
        // Convert from PascalCase to snake_case
        var stringValue = value switch
        {
            ArticleStatus.Draft => "draft",
            ArticleStatus.Submitted => "submitted",
            ArticleStatus.UnderReview => "under_review",
            ArticleStatus.Approved => "approved",
            ArticleStatus.Rejected => "rejected",
            ArticleStatus.Published => "published",
            _ => "draft"
        };
        writer.WriteStringValue(stringValue);
    }
}

