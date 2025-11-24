# Vietsov API - .NET 8.0 Backend

## Overview

ASP.NET Core 8.0 backend API với Entity Framework Core, ASP.NET Core Identity, JWT Authentication, và full CRUD operations cho Articles, Categories, Tags, Users, Roles, và Logs.

## Setup Instructions

1. Update connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=test_post;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;Encrypt=False;"
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

- Default port is 5000 (HTTP) and 5001 (HTTPS)
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

## Features

- ✅ Full CRUD operations for Articles, Categories, Tags, Users, Roles
- ✅ Article workflow (Draft → Submitted → Under Review → Approved/Rejected → Published)
- ✅ JWT Authentication with refresh tokens
- ✅ Role-based authorization (Admin, User)
- ✅ Request logging middleware
- ✅ Global exception handling
- ✅ FluentValidation for all DTOs
- ✅ Database seeding with admin user and roles
- ✅ File upload service
- ✅ Dashboard statistics
- ✅ Logs management

## Notes

- Project uses .NET 8.0 (not 9.0) because SDK 9.0 is not available
- All packages are compatible with .NET 8.0
- API versioning is configured for `/api/v1/...`
- JWT authentication is configured with access and refresh tokens
- Serilog is configured for structured logging to console and file
