# Vietsov Article Editor

Hệ thống quản lý và soạn thảo bài viết với TipTap Editor.

## Cấu trúc dự án

```
.
├── frontend/          # Frontend application (React + Vite + TipTap)
│   ├── src/          # Source code
│   ├── public/       # Public assets
│   ├── package.json  # Frontend dependencies
│   └── ...
├── docker-compose.yml # SQL Server Docker setup
└── DOCKER_SETUP.md   # Docker setup instructions
```

## Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup (SQL Server)

Xem [DOCKER_SETUP.md](./DOCKER_SETUP.md) để setup SQL Server với Docker.

```bash
docker compose up -d
```

## Build

```bash
cd frontend
npm run build
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Editor**: TipTap
- **UI**: Shadcn UI + Tailwind CSS
- **i18n**: react-i18next (English, Vietnamese, Russian)
- **Database**: SQL Server (Docker)

## Features

- Rich text editor với TipTap
- Preview mode với layout giống hệ thống tin tức
- Auto-save drafts (localStorage)
- Multi-language support
- Admin layout với sidebar và header
- Publish articles to API
