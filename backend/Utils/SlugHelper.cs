using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Vietsov.Api.Utils;

public static class SlugHelper
{
    /// <summary>
    /// Generate a URL-friendly slug from text, handling Vietnamese diacritics
    /// </summary>
    public static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        // Convert to lowercase
        var slug = text.ToLowerInvariant();

        // Normalize to NFD (decomposed form) to separate base characters from diacritics
        slug = slug.Normalize(NormalizationForm.FormD);

        // Remove diacritics (Unicode range \u0300-\u036f)
        slug = Regex.Replace(slug, @"[\u0300-\u036f]", string.Empty);

        // Replace non-alphanumeric characters with hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9]+", "-");

        // Remove leading and trailing hyphens
        slug = slug.Trim('-');

        return slug;
    }
}

