using Vietsov.Api.Models;

namespace Vietsov.Api.DTOs.Categories;

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public CategoryType Type { get; set; } = CategoryType.Other;
    public int? ParentId { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; } = 0;
}

