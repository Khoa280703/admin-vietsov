using Vietsov.Api.Models;

namespace Vietsov.Api.DTOs.Categories;

public class CategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public CategoryResponse? Parent { get; set; }
    public List<CategoryResponse> Children { get; set; } = new();
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

