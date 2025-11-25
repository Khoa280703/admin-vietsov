using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Vietsov.Api.Models;

namespace Vietsov.Api.Utils;

/// <summary>
/// Extension methods for automatically registering enum converters for JSON serialization and EF Core.
/// </summary>
public static class EnumConverterExtensions
{
    /// <summary>
    /// Automatically registers JSON converters for all enum types in the Vietsov.Api.Models namespace.
    /// This eliminates the need to manually register converters for each enum type.
    /// </summary>
    public static void RegisterAllEnumConverters(this JsonSerializerOptions options)
    {
        var enumTypes = GetEnumTypesFromModelsNamespace();

        foreach (var enumType in enumTypes)
        {
            // Register non-nullable converter
            var converterType = typeof(SnakeCaseEnumJsonConverter<>).MakeGenericType(enumType);
            var converter = Activator.CreateInstance(converterType);
            if (converter != null)
            {
                options.Converters.Add((JsonConverter)converter);
            }

            // Register nullable converter
            var nullableConverterType = typeof(NullableSnakeCaseEnumJsonConverter<>).MakeGenericType(enumType);
            var nullableConverter = Activator.CreateInstance(nullableConverterType);
            if (nullableConverter != null)
            {
                options.Converters.Add((JsonConverter)nullableConverter);
            }
        }
    }

    /// <summary>
    /// Automatically applies ValueConverters to all enum properties in the DbContext.
    /// This eliminates the need to manually configure HasConversion for each enum property.
    /// </summary>
    public static void ApplyEnumValueConverters(this ModelBuilder modelBuilder)
    {
        var enumTypes = GetEnumTypesFromModelsNamespace();

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var propertyType = property.ClrType;

                // Check if property is an enum type from Models namespace
                if (propertyType.IsEnum && enumTypes.Contains(propertyType))
                {
                    // Apply generic ValueConverter
                    var converterType = typeof(SnakeCaseEnumValueConverter<>).MakeGenericType(propertyType);
                    var converter = Activator.CreateInstance(converterType);
                    if (converter != null)
                    {
                        property.SetValueConverter((ValueConverter)converter);
                        
                        // Set max length for string storage (optional, but recommended)
                        if (property.GetMaxLength() == null)
                        {
                            property.SetMaxLength(50);
                        }
                    }
                }
                // Check if property is nullable enum
                else if (propertyType.IsGenericType && 
                         propertyType.GetGenericTypeDefinition() == typeof(Nullable<>) &&
                         propertyType.GetGenericArguments()[0].IsEnum)
                {
                    var underlyingEnumType = propertyType.GetGenericArguments()[0];
                    if (enumTypes.Contains(underlyingEnumType))
                    {
                        var converterType = typeof(SnakeCaseEnumValueConverter<>).MakeGenericType(underlyingEnumType);
                        var converter = Activator.CreateInstance(converterType);
                        if (converter != null)
                        {
                            property.SetValueConverter((ValueConverter)converter);
                            
                            // Set max length for string storage
                            if (property.GetMaxLength() == null)
                            {
                                property.SetMaxLength(50);
                            }
                        }
                    }
                }
            }
        }
    }

    /// <summary>
    /// Gets all enum types from the Vietsov.Api.Models namespace.
    /// </summary>
    private static List<Type> GetEnumTypesFromModelsNamespace()
    {
        var modelsAssembly = typeof(ArticleStatus).Assembly;
        var enumTypes = modelsAssembly
            .GetTypes()
            .Where(t => t.IsEnum && t.Namespace == "Vietsov.Api.Models")
            .ToList();

        return enumTypes;
    }
}

