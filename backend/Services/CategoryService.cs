using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.Models;
using Vietsov.Api.Utils;

namespace Vietsov.Api.Services;

public interface ICategoryService
{
    Task<List<Category>> GetTreeAsync(CategoryType? type = null);
    Task<Category> GetChildrenAsync(int id);
    Task<Category> CreateCategoryAsync(CreateCategoryData data);
    Task<Category> UpdateCategoryAsync(int id, UpdateCategoryData data);
    Task DeleteCategoryAsync(int id);
    Task<Category> MoveCategoryAsync(int id, int? newParentId);
}

public class CreateCategoryData
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public CategoryType Type { get; set; } = CategoryType.Other;
    public int? ParentId { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; } = 0;
}

public class UpdateCategoryData
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public CategoryType? Type { get; set; }
    public int? ParentId { get; set; }
    public string? Description { get; set; }
    public int? Order { get; set; }
    public bool? IsActive { get; set; }
}

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(ApplicationDbContext context, ILogger<CategoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Category>> GetTreeAsync(CategoryType? type = null)
    {
        try
        {
            // Get all categories with relations
            var query = _context.Categories
                .Include(c => c.Parent)
                .AsQueryable();

            if (type.HasValue)
            {
                query = query.Where(c => c.Type == type.Value);
            }

            var allCategories = await query
                .OrderBy(c => c.Order)
                .ThenBy(c => c.Name)
                .ToListAsync();

            // Build tree structure manually
            var categoryMap = new Dictionary<int, CategoryWithChildren>();
            var roots = new List<Category>();

            // First pass: create map with empty children arrays
            foreach (var cat in allCategories)
            {
                categoryMap[cat.Id] = new CategoryWithChildren
                {
                    Category = cat,
                    Children = new List<Category>()
                };
            }

            // Second pass: build tree structure
            foreach (var cat in allCategories)
            {
                var categoryWithChildren = categoryMap[cat.Id];
                if (cat.ParentId.HasValue && categoryMap.ContainsKey(cat.ParentId.Value))
                {
                    var parent = categoryMap[cat.ParentId.Value];
                    parent.Children.Add(categoryWithChildren.Category);
                }
                else
                {
                    roots.Add(categoryWithChildren.Category);
                }
            }

            return roots;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CategoryService.GetTree");
            throw;
        }
    }

    public async Task<Category> GetChildrenAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new InvalidOperationException("Category not found");
        }

        return category;
    }

    public async Task<Category> CreateCategoryAsync(CreateCategoryData data)
    {
        var slug = data.Slug ?? SlugHelper.GenerateSlug(data.Name);

        // Check if slug exists
        var existingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
        if (existingCategory != null)
        {
            throw new InvalidOperationException("Category slug already exists");
        }

        // Validate parent if provided
        if (data.ParentId.HasValue)
        {
            var parent = await _context.Categories.FindAsync(data.ParentId.Value);
            if (parent == null)
            {
                throw new InvalidOperationException("Parent category not found");
            }
        }

        // Create category using EF Core
        var category = new Category
        {
            Name = data.Name,
            Slug = slug,
            Type = data.Type,
            Description = data.Description,
            ParentId = data.ParentId,
            Order = data.Order,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        // Fetch the saved category with relations
        var savedCategory = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == category.Id);

        return savedCategory ?? category;
    }

    public async Task<Category> UpdateCategoryAsync(int id, UpdateCategoryData data)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            throw new InvalidOperationException("Category not found");
        }

        if (!string.IsNullOrEmpty(data.Name)) category.Name = data.Name;
        if (!string.IsNullOrEmpty(data.Slug))
        {
            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == data.Slug);
            if (existingCategory != null && existingCategory.Id != category.Id)
            {
                throw new InvalidOperationException("Category slug already exists");
            }
            category.Slug = data.Slug;
        }
        if (data.Type.HasValue) category.Type = data.Type.Value;
        if (data.Description != null) category.Description = data.Description;
        if (data.Order.HasValue) category.Order = data.Order.Value;
        if (data.IsActive.HasValue) category.IsActive = data.IsActive.Value;

        if (data.ParentId.HasValue)
        {
            if (data.ParentId.Value == category.Id)
            {
                throw new InvalidOperationException("Category cannot be its own parent");
            }

            var parent = await _context.Categories.FindAsync(data.ParentId.Value);
            if (parent == null)
            {
                throw new InvalidOperationException("Parent category not found");
            }

            category.ParentId = data.ParentId.Value;
        }
        else if (data.ParentId == null && category.ParentId.HasValue)
        {
            // Remove parent (make root)
            category.ParentId = null;
        }

        category.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updatedCategory = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == category.Id);

        return updatedCategory ?? category;
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new InvalidOperationException("Category not found");
        }

        // Check if category has children
        if (category.Children.Any())
        {
            throw new InvalidOperationException("Cannot delete category with children. Please delete or move children first.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    public async Task<Category> MoveCategoryAsync(int id, int? newParentId)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            throw new InvalidOperationException("Category not found");
        }

        if (newParentId.HasValue)
        {
            var newParent = await _context.Categories.FindAsync(newParentId.Value);
            if (newParent == null)
            {
                throw new InvalidOperationException("Parent category not found");
            }
            category.ParentId = newParentId;
        }
        else
        {
            category.ParentId = null;
        }

        category.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id) ?? category;
    }

    private class CategoryWithChildren
    {
        public Category Category { get; set; } = null!;
        public List<Category> Children { get; set; } = new();
    }
}

