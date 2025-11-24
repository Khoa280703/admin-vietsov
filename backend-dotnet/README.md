# Vietsov API - .NET 8.0 Backend

## Migration Status

### ✅ Completed

- Project setup với .NET 8.0
- Entity Framework Core với SQL Server
- ASP.NET Core Identity + JWT Authentication
- Serilog logging configuration
- API Versioning setup
- CORS configuration
- Swagger/OpenAPI setup
- Models: ApplicationUser, ApplicationRole, Article, Category, Tag, Log, ArticleCategory, ArticleTag
- DbContext với relationships và indexes
- JWT Service
- AuthController (login, refresh, me)
- Initial migration created

### 🔄 In Progress / TODO

- Services: ArticleService, CategoryService, TagService, UploadService, DashboardService, LogService
- Controllers: UsersController, RolesController, ArticlesController, CategoriesController, TagsController, UploadController, DashboardController, LogsController
- Middleware: RequestLoggingMiddleware, GlobalExceptionHandler
- Validators: FluentValidation validators cho các DTOs
- Seed Data: Admin user và roles
- Testing: Test tất cả endpoints

## Setup Instructions

1. Update connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=test_post;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;Encrypt=False;"
  }
}
```

2. Update JWT secret in `appsettings.json`:

```json
{
  "Jwt": {
    "Secret": "your-super-secret-key-change-this-in-production-minimum-32-characters"
  }
}
```

3. Run migrations:

```bash
cd backend-dotnet/Vietsov.Api
dotnet ef database update
```

4. Run the application:

```bash
dotnet run
```

5. Access Swagger UI:

- http://localhost:5000/swagger (or https://localhost:5001/swagger)

**Note**:

- Default port is 5000 (HTTP) and 5001 (HTTPS) to avoid conflict with Node.js backend on port 3000
- If you see a warning about "No XML encryptor configured" in development, this is normal and can be ignored. In production, you should configure proper key encryption.

## Project Structure

```
Vietsov.Api/
├── Configuration/     # Configuration classes (JwtSettings, etc.)
├── Controllers/      # API Controllers
│   └── V1/          # Version 1 controllers
├── Data/            # DbContext
├── DTOs/            # Data Transfer Objects
│   ├── Auth/
│   ├── Users/
│   ├── Articles/
│   ├── Categories/
│   ├── Tags/
│   └── Logs/
├── Middleware/       # Custom middleware
├── Migrations/      # EF Core migrations
├── Models/          # Entity models
├── Services/        # Business logic services
├── Validators/      # FluentValidation validators
├── Program.cs       # Application entry point
└── appsettings.json # Configuration file
```

## Next Steps

1. Implement remaining services
2. Implement remaining controllers
3. Add middleware for request logging and error handling
4. Add FluentValidation validators
5. Create seed data script
6. Test all endpoints
7. Update frontend API base URL if needed

## Notes

- Project uses .NET 8.0 (not 9.0) because SDK 9.0 is not available
- All packages are compatible with .NET 8.0
- API versioning is configured for `/api/v1/...`
- JWT authentication is configured with access and refresh tokens
- Serilog is configured for structured logging to console and file
