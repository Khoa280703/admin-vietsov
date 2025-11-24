using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Models;

namespace Vietsov.Api.Data;

public class SeedData
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration,
        ILogger logger)
    {
        try
        {
            logger.LogInformation("Starting database seeding...");

            // Create Roles
            logger.LogInformation("Creating roles...");
            var adminRole = await roleManager.FindByNameAsync("admin");
            if (adminRole == null)
            {
                adminRole = new ApplicationRole
                {
                    Name = "admin",
                    Description = "Administrator with full access",
                    Permissions = JsonSerializer.Serialize(new Dictionary<string, List<string>>
                    {
                        { "articles", new List<string> { "create", "read", "update", "delete", "approve", "reject", "publish" } },
                        { "users", new List<string> { "create", "read", "update", "delete" } },
                        { "categories", new List<string> { "create", "read", "update", "delete" } },
                        { "tags", new List<string> { "create", "read", "update", "delete" } }
                    }),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await roleManager.CreateAsync(adminRole);
                logger.LogInformation("Admin role created");
            }

            var userRole = await roleManager.FindByNameAsync("user");
            if (userRole == null)
            {
                userRole = new ApplicationRole
                {
                    Name = "user",
                    Description = "Regular user with limited access",
                    Permissions = JsonSerializer.Serialize(new Dictionary<string, List<string>>
                    {
                        { "articles", new List<string> { "create", "read", "update", "submit" } }
                    }),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await roleManager.CreateAsync(userRole);
                logger.LogInformation("User role created");
            }

            // Create Admin User
            logger.LogInformation("Creating admin user...");
            var adminUsername = configuration["AdminUser:Username"] ?? configuration["Admin:Username"] ?? "admin";
            var adminPassword = configuration["AdminUser:Password"] ?? configuration["Admin:Password"] ?? "Admin123";
            var adminEmail = configuration["AdminUser:Email"] ?? configuration["Admin:Email"] ?? "admin@vietsov.com";

            var adminUser = await userManager.FindByNameAsync(adminUsername);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminUsername,
                    Email = adminEmail,
                    FullName = "Administrator",
                    IsActive = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "admin");
                    logger.LogInformation($"Admin user created: {adminUsername} / {adminPassword}");
                }
                else
                {
                    logger.LogError("Failed to create admin user: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            // Create Sample Categories
            logger.LogInformation("Creating sample categories...");
            var categories = new[]
            {
                new { Name = "Tin tức", Slug = "tin-tuc", Type = CategoryType.NewsType },
                new { Name = "Sự kiện", Slug = "su-kien", Type = CategoryType.Event },
                new { Name = "Thông báo", Slug = "thong-bao", Type = CategoryType.NewsType }
            };

            foreach (var catData in categories)
            {
                var existingCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == catData.Slug);
                if (existingCategory == null)
                {
                    // Insert category using raw SQL
                    var categoryIdParam = new SqlParameter("@categoryId", System.Data.SqlDbType.Int)
                    {
                        Direction = System.Data.ParameterDirection.Output
                    };

                    await context.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO Categories (Name, Slug, Type, IsActive, [Order], CreatedAt, UpdatedAt)
                          OUTPUT INSERTED.Id
                          VALUES (@name, @slug, @type, 1, 0, GETDATE(), GETDATE())",
                        new SqlParameter("@name", catData.Name),
                        new SqlParameter("@slug", catData.Slug),
                        new SqlParameter("@type", (int)catData.Type)
                    );

                    // Get the inserted category ID
                    var insertedCategory = await context.Categories
                        .OrderByDescending(c => c.Id)
                        .FirstOrDefaultAsync(c => c.Slug == catData.Slug);

                    if (insertedCategory != null)
                    {
                        logger.LogInformation($"Category created: {catData.Name}");
                    }
                }
            }

            // Create Sample Tags
            logger.LogInformation("Creating sample tags...");
            var tags = new[]
            {
                new { Name = "Việt Nam", Slug = "viet-nam" },
                new { Name = "Nga", Slug = "nga" },
                new { Name = "Hợp tác", Slug = "hop-tac" },
                new { Name = "Kinh tế", Slug = "kinh-te" }
            };

            foreach (var tagData in tags)
            {
                var existingTag = await context.Tags.FirstOrDefaultAsync(t => t.Slug == tagData.Slug);
                if (existingTag == null)
                {
                    var tag = new Tag
                    {
                        Name = tagData.Name,
                        Slug = tagData.Slug,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    context.Tags.Add(tag);
                    await context.SaveChangesAsync();
                    logger.LogInformation($"Tag created: {tagData.Name}");
                }
            }

            logger.LogInformation("Seeding completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database");
            throw;
        }
    }
}

