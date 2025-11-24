# Vietsov Backend API

Backend API cho hệ thống quản lý bài viết Vietsov, được xây dựng với Node.js, Express, TypeORM và SQL Server.

## Cấu trúc dự án

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── entities/        # TypeORM entities
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, error handling
│   ├── routes/          # API routes (v1)
│   ├── utils/           # Helpers
│   ├── migrations/      # Database migrations
│   ├── database/        # Seed scripts
│   └── index.ts         # Entry point
├── uploads/             # File upload directory
└── package.json
```

## Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:
- Database connection
- JWT secret
- Upload directory
- Admin credentials

### 3. Chạy migrations

```bash
npm run migration:run
```

### 4. Seed database

```bash
npm run seed
```

### 5. Chạy server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### Users
- `GET /api/v1/users` - Danh sách users (admin only)
- `GET /api/v1/users/:id` - Chi tiết user
- `POST /api/v1/users` - Tạo user (admin only)
- `PUT /api/v1/users/:id` - Cập nhật user
- `DELETE /api/v1/users/:id` - Xóa user (admin only)
- `PUT /api/v1/users/:id/role` - Gán role (admin only)

### Roles
- `GET /api/v1/roles` - Danh sách roles
- `GET /api/v1/roles/:id` - Chi tiết role
- `POST /api/v1/roles` - Tạo role (admin only)
- `PUT /api/v1/roles/:id` - Cập nhật role (admin only)
- `PUT /api/v1/roles/:id/permissions` - Cập nhật permissions (admin only)

### Categories
- `GET /api/v1/categories` - Danh sách categories (tree structure)
- `GET /api/v1/categories/:id` - Chi tiết category
- `GET /api/v1/categories/types` - Danh sách category types
- `POST /api/v1/categories` - Tạo category (admin only)
- `PUT /api/v1/categories/:id` - Cập nhật category (admin only)
- `DELETE /api/v1/categories/:id` - Xóa category (admin only)

### Tags
- `GET /api/v1/tags` - Danh sách tags
- `GET /api/v1/tags/:id` - Chi tiết tag
- `POST /api/v1/tags` - Tạo tag (admin only)
- `PUT /api/v1/tags/:id` - Cập nhật tag (admin only)
- `DELETE /api/v1/tags/:id` - Xóa tag (admin only)

### Articles
- `GET /api/v1/articles` - Danh sách articles
- `GET /api/v1/articles/my-articles` - Bài viết của tôi (user only)
- `GET /api/v1/articles/:id` - Chi tiết article
- `POST /api/v1/articles` - Tạo article (draft)
- `PUT /api/v1/articles/:id` - Cập nhật article
- `DELETE /api/v1/articles/:id` - Xóa article
- `POST /api/v1/articles/:id/submit` - Submit for review (user only)
- `POST /api/v1/articles/:id/approve` - Approve article (admin only)
- `POST /api/v1/articles/:id/reject` - Reject article (admin only)
- `POST /api/v1/articles/:id/publish` - Publish article

### Upload
- `POST /api/v1/upload/image` - Upload image (authenticated)

## Article Workflow

1. **Draft** → User tạo bài viết
2. **Submitted** → User submit để duyệt
3. **Under Review** → Admin đang xem xét
4. **Approved** → Admin duyệt bài
5. **Rejected** → Admin từ chối (có thể kèm notes)
6. **Published** → Bài viết đã xuất bản

## Authentication

API sử dụng JWT authentication. Gửi token trong header:

```
Authorization: Bearer <access_token>
```

## Database Schema

- **users** - Người dùng
- **roles** - Vai trò (admin, user)
- **categories** - Chuyên mục (tree structure)
- **tags** - Thẻ
- **articles** - Bài viết
- **article_categories** - Junction table (many-to-many)
- **article_tags** - Junction table (many-to-many)

## Environment Variables

Xem `.env.example` để biết các biến môi trường cần thiết.

