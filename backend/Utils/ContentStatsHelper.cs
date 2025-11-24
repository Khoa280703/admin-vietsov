using System.Text;
using System.Text.Json;

namespace Vietsov.Api.Utils;

public static class ContentStatsHelper
{
    /// <summary>
    /// Calculate word count, character count, and reading time from TipTap JSONContent
    /// </summary>
    public static (int WordCount, int CharacterCount, int ReadingTime) CalculateStats(string contentJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(contentJson))
                return (0, 0, 0);

            // Parse JSON content
            JsonDocument? doc = null;
            try
            {
                doc = JsonDocument.Parse(contentJson);
            }
            catch
            {
                return (0, 0, 0);
            }

            var text = ExtractText(doc.RootElement);

            var wordCount = text.Trim()
                .Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Length;

            var characterCount = text.Length;
            var readingTime = (int)Math.Ceiling(wordCount / 200.0); // Average reading speed: 200 words/min

            return (wordCount, characterCount, readingTime);
        }
        catch
        {
            return (0, 0, 0);
        }
    }

    private static string ExtractText(JsonElement node)
    {
        var text = new StringBuilder();

        if (node.ValueKind == JsonValueKind.Object)
        {
            // If it's a text node
            if (node.TryGetProperty("type", out var typeElement) && 
                typeElement.GetString() == "text" &&
                node.TryGetProperty("text", out var textElement))
            {
                text.Append(textElement.GetString()).Append(" ");
            }

            // Recursively extract from content array
            if (node.TryGetProperty("content", out var contentElement) && 
                contentElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in contentElement.EnumerateArray())
                {
                    text.Append(ExtractText(child));
                }
            }
        }
        else if (node.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in node.EnumerateArray())
            {
                text.Append(ExtractText(child));
            }
        }

        return text.ToString();
    }
}

