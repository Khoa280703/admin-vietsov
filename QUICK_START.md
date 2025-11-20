# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

## First Steps

### 1. Create Your First Article

1. The editor opens with a new draft automatically
2. Start typing in the editor area
3. Your work is auto-saved every 30 seconds

### 2. Format Your Content

**Use the toolbar for:**
- **B** = Bold
- *I* = Italic
- <u>U</u> = Underline
- H1-H6 = Headings
- Lists (bullet, numbered, tasks)
- Tables, images, links, videos
- Colors and alignment

**Keyboard shortcuts:**
- `Ctrl/Cmd + B` = Bold
- `Ctrl/Cmd + I` = Italic
- `Ctrl/Cmd + Z` = Undo
- `Ctrl/Cmd + Y` = Redo

### 3. Add Metadata

**In the right sidebar:**
- Set your article title
- Add tags and categories
- Upload a featured image
- Set SEO information (slug, meta description)
- View statistics (word count, reading time)

### 4. Manage Drafts

**Click the menu icon (☰) to:**
- Create new drafts
- Load existing drafts
- Delete or duplicate drafts
- Export articles (JSON, Markdown, HTML)

### 5. Preview Your Article

Click **Preview** button to see how your article will look when published.

### 6. Save Your Work

- **Auto-save**: Happens every 30 seconds automatically
- **Manual save**: Click the **Save** button anytime

## Tips

- **Dark Mode**: Click the moon/sun icon in the top right
- **Fullscreen**: Maximize editing space by hiding the metadata panel
- **Tables**: Click inside a table to see table operations
- **Images**: Max 5MB, automatically compressed
- **Links**: Select text, click link icon, enter URL

## Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Production files will be in the `dist/` directory.

## Troubleshooting

### Editor not loading?
- Clear browser cache
- Check console for errors
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Auto-save not working?
- Check browser's localStorage (should be enabled)
- Look for console logs showing auto-save activity

### Images not uploading?
- Ensure file is under 5MB
- Only image files are supported (JPG, PNG, GIF, WebP)

## Features Overview

### Text Formatting
Bold, Italic, Underline, Strikethrough, Code, Headings (1-6), Lists, Blockquotes

### Rich Content
Tables, Images, Links, Code Blocks, YouTube Videos, Task Lists

### Colors
12 text colors, 12 highlight colors

### Organization
Tags, Categories, Featured Image, Status (Draft/Published), Scheduled Publishing

### Export
JSON (full data), Markdown (plain text), HTML (standalone)

### UI/UX
Dark Mode, Preview Mode, Responsive Design, Auto-save, Keyboard Shortcuts

## Next Steps

- Explore the [full documentation](./README.md)
- Check [all features](./FEATURES.md)
- Learn [keyboard shortcuts](./KEYBOARD_SHORTCUTS.md)
- Read [project summary](./PROJECT_SUMMARY.md)

## Support

For issues or questions, check the documentation files or open an issue on the project repository.

---

Happy Writing! ✍️

