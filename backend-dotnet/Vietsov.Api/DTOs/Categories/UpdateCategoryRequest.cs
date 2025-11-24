using Vietsov.Api.Models;

namespace Vietsov.Api.DTOs.Categories;

public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public CategoryType? Type { get; set; }
    public int? ParentId { get; set; }
    public string? Description { get; set; }
    public int? Order { get; set; }
    public bool? IsActive { get; set; }
}

