using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Data;
using Vietsov.Api.Models;
using Vietsov.Api.Utils;

namespace Vietsov.Api.Services;

public interface ITagService
{
    Task<(List<Tag> Tags, int Total)> ListTagsAsync(int page, int limit, string? search = null);
    Task<Tag?> GetTagByIdAsync(int id);
    Task<Tag> CreateTagAsync(CreateTagData data);
    Task<Tag> UpdateTagAsync(int id, UpdateTagData data);
    Task DeleteTagAsync(int id);
}

public class CreateTagData
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
}

public class UpdateTagData
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
}

public class TagService : ITagService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TagService> _logger;

    public TagService(ApplicationDbContext context, ILogger<TagService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(List<Tag> Tags, int Total)> ListTagsAsync(int page, int limit, string? search = null)
    {
        var query = _context.Tags.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(t => t.Name.Contains(search) || t.Slug.Contains(search));
        }

        var total = await query.CountAsync();
        var tags = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (tags, total);
    }

    public async Task<Tag?> GetTagByIdAsync(int id)
    {
        return await _context.Tags.FindAsync(id);
    }

    public async Task<Tag> CreateTagAsync(CreateTagData data)
    {
        var slug = data.Slug ?? SlugHelper.GenerateSlug(data.Name);

        // Check if tag exists
        var existingTag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Name == data.Name || t.Slug == slug);

        if (existingTag != null)
        {
            throw new InvalidOperationException("Tag name or slug already exists");
        }

        var tag = new Tag
        {
            Name = data.Name,
            Slug = slug,
            Description = data.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        return tag;
    }

    public async Task<Tag> UpdateTagAsync(int id, UpdateTagData data)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag == null)
        {
            throw new InvalidOperationException("Tag not found");
        }

        if (!string.IsNullOrEmpty(data.Name)) tag.Name = data.Name;
        if (!string.IsNullOrEmpty(data.Slug))
        {
            var existingTag = await _context.Tags.FirstOrDefaultAsync(t => t.Slug == data.Slug);
            if (existingTag != null && existingTag.Id != tag.Id)
            {
                throw new InvalidOperationException("Tag slug already exists");
            }
            tag.Slug = data.Slug;
        }
        if (data.Description != null) tag.Description = data.Description;

        tag.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return tag;
    }

    public async Task DeleteTagAsync(int id)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag == null)
        {
            throw new InvalidOperationException("Tag not found");
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
    }
}

