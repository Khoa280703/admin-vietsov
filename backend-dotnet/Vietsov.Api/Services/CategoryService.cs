using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
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

        // Insert category using raw SQL (to handle closure table)
        var categoryIdParam = new SqlParameter("@categoryId", System.Data.SqlDbType.Int)
        {
            Direction = System.Data.ParameterDirection.Output
        };

        await _context.Database.ExecuteSqlRawAsync(
            @"INSERT INTO Categories (Name, Slug, Type, Description, IsActive, [Order], ParentId, CreatedAt, UpdatedAt)
              OUTPUT INSERTED.Id
              VALUES (@name, @slug, @type, @description, @isActive, @order, @parentId, GETDATE(), GETDATE())",
            new SqlParameter("@name", data.Name),
            new SqlParameter("@slug", slug),
            new SqlParameter("@type", (int)data.Type),
            new SqlParameter("@description", (object?)data.Description ?? DBNull.Value),
            new SqlParameter("@isActive", true),
            new SqlParameter("@order", data.Order),
            new SqlParameter("@parentId", (object?)data.ParentId ?? DBNull.Value)
        );

        // Get the inserted category ID
        var insertedCategory = await _context.Categories
            .OrderByDescending(c => c.Id)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (insertedCategory == null)
        {
            throw new InvalidOperationException("Failed to retrieve created category");
        }

        var categoryId = insertedCategory.Id;

        // Manually populate closure table
        // Insert self-reference
        await _context.Database.ExecuteSqlRawAsync(
            @"INSERT INTO categories_closure (id_ancestor, id_descendant) VALUES (@id, @id)",
            new SqlParameter("@id", categoryId)
        );

        // If has parent, insert all ancestor-descendant relationships
        if (data.ParentId.HasValue)
        {
            await _context.Database.ExecuteSqlRawAsync(
                @"INSERT INTO categories_closure (id_ancestor, id_descendant)
                  SELECT cc.id_ancestor, @categoryId
                  FROM categories_closure cc
                  WHERE cc.id_descendant = @parentId",
                new SqlParameter("@categoryId", categoryId),
                new SqlParameter("@parentId", data.ParentId.Value)
            );
        }

        // Fetch the saved category with relations
        var savedCategory = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == categoryId);

        if (savedCategory == null)
        {
            throw new InvalidOperationException("Failed to retrieve created category");
        }

        return savedCategory;
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

            // Update closure table if parent changed
            if (category.ParentId != data.ParentId.Value)
            {
                // Remove old relationships
                await _context.Database.ExecuteSqlRawAsync(
                    @"DELETE FROM categories_closure
                      WHERE id_descendant IN (
                          SELECT id_descendant FROM categories_closure WHERE id_ancestor = @id
                      )
                      AND id_ancestor IN (
                          SELECT id_ancestor FROM categories_closure WHERE id_descendant = @id AND id_ancestor != @id
                      )",
                    new SqlParameter("@id", category.Id)
                );

                // Add new relationships
                await _context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO categories_closure (id_ancestor, id_descendant)
                      SELECT supertree.id_ancestor, subtree.id_descendant
                      FROM categories_closure AS supertree
                      CROSS JOIN categories_closure AS subtree
                      WHERE supertree.id_descendant = @newParentId
                      AND subtree.id_ancestor = @id",
                    new SqlParameter("@newParentId", data.ParentId.Value),
                    new SqlParameter("@id", category.Id)
                );
            }

            category.ParentId = data.ParentId.Value;
        }
        else if (data.ParentId == null && category.ParentId.HasValue)
        {
            // Remove parent (make root)
            await _context.Database.ExecuteSqlRawAsync(
                @"DELETE FROM categories_closure
                  WHERE id_descendant IN (
                      SELECT id_descendant FROM categories_closure WHERE id_ancestor = @id
                  )
                  AND id_ancestor IN (
                      SELECT id_ancestor FROM categories_closure WHERE id_descendant = @id AND id_ancestor != @id
                  )",
                new SqlParameter("@id", category.Id)
            );
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

        // Delete from closure table
        await _context.Database.ExecuteSqlRawAsync(
            @"DELETE FROM categories_closure WHERE id_ancestor = @id OR id_descendant = @id",
            new SqlParameter("@id", id)
        );

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

