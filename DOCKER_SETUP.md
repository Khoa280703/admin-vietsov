# Docker SQL Server Setup

## Quick Start

### 1. Start SQL Server
```bash
docker compose up -d
```

### 2. Check Status
```bash
docker ps
```

### 3. View Logs
```bash
docker compose logs sqlserver
```

## Connection Information

### DBeaver Connection Settings:
- **Host:** `localhost` hoặc `127.0.0.1`
- **Port:** `1433`
- **Database:** `master` (hoặc để trống)
- **Authentication:** SQL Server Authentication
- **Username:** `sa`
- **Password:** `YourStrong@Passw0rd` (mặc định, có thể đổi trong `.env.docker`)

### Test Connection từ Terminal:
```bash
docker exec vietsov-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd -Q "SELECT @@VERSION"
```

## Useful Commands

### Start/Stop
```bash
# Start
docker compose up -d

# Stop
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v
```

### Access SQL Server CLI
```bash
docker exec -it vietsov-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd
```

### Create Database
Trong DBeaver hoặc SQL CLI, chạy:
```sql
CREATE DATABASE test_post;
GO

USE test_post;
GO
```

## Change Password

Edit `.env.docker` file và đổi `MSSQL_SA_PASSWORD`, sau đó restart:
```bash
docker compose down
docker compose up -d
```

## Troubleshooting

### Container not starting
```bash
# Check logs
docker compose logs sqlserver

# Check if port 1433 is already in use
lsof -i :1433
```

### Reset everything
```bash
docker compose down -v
docker compose up -d
```

### Check container health
```bash
docker ps --filter "name=vietsov-sqlserver"
```
