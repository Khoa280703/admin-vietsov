using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Vietsov.Api.Models;

namespace Vietsov.Api.Utils;

/// <summary>
/// Generic JSON converter for enums that converts between PascalCase (backend) and snake_case (frontend).
/// This converter automatically handles all enum types without needing separate converters for each enum.
/// </summary>
public class SnakeCaseEnumJsonConverter<T> : JsonConverter<T> where T : struct, Enum
{
    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return GetDefaultValue();
        }

        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
        {
            return GetDefaultValue();
        }

        // Convert from snake_case to PascalCase
        var pascalCase = SnakeCaseToPascalCase(value);
        
        // Try to parse the enum
        if (Enum.TryParse<T>(pascalCase, ignoreCase: true, out var result))
        {
            return result;
        }

        // If direct parse fails, try to find by matching snake_case values
        return FindEnumBySnakeCase(value) ?? GetDefaultValue();
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        // Convert from PascalCase to snake_case
        var snakeCase = PascalCaseToSnakeCase(value.ToString() ?? string.Empty);
        writer.WriteStringValue(snakeCase);
    }

    private T GetDefaultValue()
    {
        // Return the first enum value as default
        var values = Enum.GetValues<T>();
        return values.Length > 0 ? values[0] : default;
    }

    private T? FindEnumBySnakeCase(string snakeCaseValue)
    {
        var normalizedInput = snakeCaseValue.ToLowerInvariant();
        var enumValues = Enum.GetValues<T>();

        foreach (var enumValue in enumValues)
        {
            var enumName = enumValue.ToString() ?? string.Empty;
            var snakeCaseName = PascalCaseToSnakeCase(enumName).ToLowerInvariant();
            
            if (snakeCaseName == normalizedInput)
            {
                return enumValue;
            }
        }

        return null;
    }

    private static string PascalCaseToSnakeCase(string pascalCase)
    {
        if (string.IsNullOrEmpty(pascalCase))
            return string.Empty;

        // Insert underscore before uppercase letters (except the first one)
        // Then convert to lowercase
        var result = Regex.Replace(pascalCase, @"([a-z])([A-Z])", "$1_$2");
        return result.ToLowerInvariant();
    }

    private static string SnakeCaseToPascalCase(string snakeCase)
    {
        if (string.IsNullOrEmpty(snakeCase))
            return string.Empty;

        // Split by underscore, capitalize first letter of each word, then join
        var parts = snakeCase.Split('_', StringSplitOptions.RemoveEmptyEntries);
        var pascalParts = parts.Select(part =>
        {
            if (string.IsNullOrEmpty(part))
                return string.Empty;
            return char.ToUpperInvariant(part[0]) + (part.Length > 1 ? part.Substring(1).ToLowerInvariant() : string.Empty);
        });

        return string.Join(string.Empty, pascalParts);
    }
}

/// <summary>
/// Generic JSON converter for nullable enums that converts between PascalCase (backend) and snake_case (frontend).
/// </summary>
public class NullableSnakeCaseEnumJsonConverter<T> : JsonConverter<T?> where T : struct, Enum
{

    public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }

        // Convert from snake_case to PascalCase
        var pascalCase = SnakeCaseToPascalCase(value);
        
        // Try to parse the enum
        if (Enum.TryParse<T>(pascalCase, ignoreCase: true, out var result))
        {
            return result;
        }

        // If direct parse fails, try to find by matching snake_case values
        return FindEnumBySnakeCase(value);
    }

    public override void Write(Utf8JsonWriter writer, T? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }

        // Convert from PascalCase to snake_case
        var snakeCase = PascalCaseToSnakeCase(value.Value.ToString() ?? string.Empty);
        writer.WriteStringValue(snakeCase);
    }

    private T? FindEnumBySnakeCase(string snakeCaseValue)
    {
        var normalizedInput = snakeCaseValue.ToLowerInvariant();
        var enumValues = Enum.GetValues<T>();

        foreach (var enumValue in enumValues)
        {
            var enumName = enumValue.ToString() ?? string.Empty;
            var snakeCaseName = PascalCaseToSnakeCase(enumName).ToLowerInvariant();
            
            if (snakeCaseName == normalizedInput)
            {
                return enumValue;
            }
        }

        return null;
    }

    private static string PascalCaseToSnakeCase(string pascalCase)
    {
        if (string.IsNullOrEmpty(pascalCase))
            return string.Empty;

        // Insert underscore before uppercase letters (except the first one)
        // Then convert to lowercase
        var result = Regex.Replace(pascalCase, @"([a-z])([A-Z])", "$1_$2");
        return result.ToLowerInvariant();
    }

    private static string SnakeCaseToPascalCase(string snakeCase)
    {
        if (string.IsNullOrEmpty(snakeCase))
            return string.Empty;

        // Split by underscore, capitalize first letter of each word, then join
        var parts = snakeCase.Split('_', StringSplitOptions.RemoveEmptyEntries);
        var pascalParts = parts.Select(part =>
        {
            if (string.IsNullOrEmpty(part))
                return string.Empty;
            return char.ToUpperInvariant(part[0]) + (part.Length > 1 ? part.Substring(1).ToLowerInvariant() : string.Empty);
        });

        return string.Join(string.Empty, pascalParts);
    }
}

