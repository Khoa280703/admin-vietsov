using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Vietsov.Api.Models;
using Vietsov.Api.Utils;

namespace Vietsov.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Article> Articles { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<Log> Logs { get; set; }
    public DbSet<ArticleCategory> ArticleCategories { get; set; }
    public DbSet<ArticleTag> ArticleTags { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Article
        builder.Entity<Article>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            
            // Configure Status to be stored as string in database (snake_case)
            entity.Property(e => e.Status)
                .HasConversion(new ArticleStatusValueConverter())
                .HasMaxLength(50);
        });

        // Configure Category
        builder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ParentId);
            entity.HasIndex(e => e.Type);
            entity.HasOne(e => e.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Tag
        builder.Entity<Tag>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // Configure ArticleCategory (many-to-many)
        builder.Entity<ArticleCategory>(entity =>
        {
            entity.HasIndex(e => new { e.ArticleId, e.CategoryId }).IsUnique();
            entity.HasOne(e => e.Article)
                .WithMany(a => a.ArticleCategories)
                .HasForeignKey(e => e.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                .WithMany(c => c.ArticleCategories)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure ArticleTag (many-to-many)
        builder.Entity<ArticleTag>(entity =>
        {
            entity.HasIndex(e => new { e.ArticleId, e.TagId }).IsUnique();
            entity.HasOne(e => e.Article)
                .WithMany(a => a.ArticleTags)
                .HasForeignKey(e => e.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Tag)
                .WithMany(t => t.ArticleTags)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Log
        builder.Entity<Log>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.Level);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Module);
            entity.HasIndex(e => e.StatusCode);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Logs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure Identity tables
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
        });

        builder.Entity<ApplicationRole>(entity =>
        {
            entity.ToTable("Roles");
        });

        builder.Entity<IdentityUserRole<int>>(entity =>
        {
            entity.ToTable("UserRoles");
        });

        builder.Entity<IdentityUserClaim<int>>(entity =>
        {
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<int>>(entity =>
        {
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityUserToken<int>>(entity =>
        {
            entity.ToTable("UserTokens");
        });

        builder.Entity<IdentityRoleClaim<int>>(entity =>
        {
            entity.ToTable("RoleClaims");
        });
    }
}

