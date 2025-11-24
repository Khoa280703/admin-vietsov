using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Vietsov.Api.Models;

namespace Vietsov.Api.Utils;

public class ArticleStatusValueConverter : ValueConverter<ArticleStatus, string>
{
    public ArticleStatusValueConverter() : base(
        // Convert enum to string (for database storage)
        v => ConvertEnumToString(v),
        // Convert string to enum (from database)
        v => ConvertStringToEnum(v)
    )
    {
    }

    private static string ConvertEnumToString(ArticleStatus status)
    {
        return status switch
        {
            ArticleStatus.Draft => "draft",
            ArticleStatus.Submitted => "submitted",
            ArticleStatus.UnderReview => "under_review",
            ArticleStatus.Approved => "approved",
            ArticleStatus.Rejected => "rejected",
            ArticleStatus.Published => "published",
            _ => "draft"
        };
    }

    private static ArticleStatus ConvertStringToEnum(string value)
    {
        if (string.IsNullOrEmpty(value))
            return ArticleStatus.Draft;

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
}

