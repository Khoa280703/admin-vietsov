using System.Text;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
// Native OpenAPI - no need for Microsoft.OpenApi.Models
using Serilog;
using Vietsov.Api.Configuration;
using Vietsov.Api.Data;
using Vietsov.Api.Middleware;
using Vietsov.Api.Models;
using Vietsov.Api.Services;
using Vietsov.Api.Utils;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Serilog.Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for ArticleStatus enum
        options.JsonSerializerOptions.Converters.Add(new ArticleStatusJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableArticleStatusJsonConverter());
        // Use camelCase for property names
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Configure Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Configure Data Protection (fixes XML encryptor warning)
var dataProtectionKeysPath = Path.Combine(builder.Environment.ContentRootPath, "DataProtection-Keys");
if (!Directory.Exists(dataProtectionKeysPath))
{
    Directory.CreateDirectory(dataProtectionKeysPath);
}

var dataProtectionBuilder = builder.Services.AddDataProtection()
    .SetApplicationName("Vietsov.Api")
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// In development, we can suppress the XML encryptor warning
// In production, you should configure proper key encryption
if (!builder.Environment.IsDevelopment())
{
    // For production, configure key encryption here if needed
    // dataProtectionBuilder.ProtectKeysWithCertificate(...);
}

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    // User settings
    options.User.RequireUniqueEmail = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});

// Register services
builder.Services.Configure<GeminiSettings>(builder.Configuration.GetSection("Gemini"));

builder.Services.AddHttpClient<IAiContentService, AiContentService>(client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IArticleService, ArticleService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IUploadService, UploadService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ILogService, LogService>();

// Register FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Configure API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure Native OpenAPI (.NET 10)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline
// Map OpenAPI endpoint (Native .NET 10 OpenAPI)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// Add global exception handler
app.UseMiddleware<GlobalExceptionHandler>();

app.UseAuthentication();
app.UseAuthorization();

// Add request logging middleware (before MapControllers)
app.UseMiddleware<RequestLoggingMiddleware>();

// Serve static files for uploads (must be before MapControllers)
app.UseStaticFiles();

// Serve uploaded files from wwwroot/uploads
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "ok", message = "Server is running" }))
    .WithName("HealthCheck");

// Seed database (skip if database connection fails)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var seedLogger = services.GetRequiredService<ILogger<SeedData>>();

        // Try to apply pending migrations and seed data
        try
        {
            // Apply pending migrations (will skip if already applied)
            await context.Database.MigrateAsync();
            // Seed data only if database is accessible
            await SeedData.SeedAsync(context, userManager, roleManager, configuration, seedLogger);
        }
        catch (Exception dbEx)
        {
            seedLogger.LogWarning(dbEx, "Database migration or seeding failed. This is OK if database is not yet configured. Continuing startup...");
        }
    }
}
catch (Exception ex)
{
    var seedErrorLogger = app.Services.GetRequiredService<ILogger<Program>>();
    seedErrorLogger.LogWarning(ex, "An error occurred while seeding the database. Continuing startup...");
}

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("===========================================");
logger.LogInformation("Vietsov API is starting...");
logger.LogInformation("Environment: {Environment}", app.Environment.EnvironmentName);
logger.LogInformation("Swagger UI: http://localhost:5000/swagger");
logger.LogInformation("Health Check: http://localhost:5000/health");
logger.LogInformation("===========================================");

// Write to console immediately (not just to logger)
Console.WriteLine("===========================================");
Console.WriteLine("Vietsov API is running!");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine("Swagger UI: http://localhost:5000/swagger");
Console.WriteLine("Health Check: http://localhost:5000/health");
Console.WriteLine("===========================================");
Console.WriteLine("Press Ctrl+C to stop the server.");

app.Run();
