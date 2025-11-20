# Article Editor with TipTap

A feature-rich, modern article editor built with React, TypeScript, TipTap, shadcn/ui, and Ant Design. Perfect for content management systems, blogging platforms, and editorial workflows.

## Features

### Rich Text Editing

- **Text Formatting**: Bold, Italic, Underline, Strikethrough, Inline Code
- **Headings**: H1 through H6
- **Lists**: Bullet lists, Numbered lists, Task lists
- **Text Alignment**: Left, Center, Right, Justify
- **Colors**: Text color and highlight customization
- **Blockquotes**: For citing sources and highlighting quotes

### Advanced Content

- **Tables**: Fully featured tables with add/delete rows and columns
- **Code Blocks**: Syntax-highlighted code blocks with lowlight
- **Images**: Upload and embed images with compression (base64 storage)
- **Links**: Add and manage hyperlinks
- **YouTube Videos**: Embed YouTube videos directly
- **Horizontal Rules**: Visual separators

### Article Management

- **Draft System**: Auto-save every 30 seconds
- **Multiple Drafts**: Create and manage multiple article drafts
- **Draft Operations**: Load, duplicate, delete drafts
- **Export Options**: Export as JSON, Markdown, or HTML

### Metadata & SEO

- **Title & Subtitle**: Article headline and subheading
- **Excerpt**: Brief article description
- **Author Information**: Track article authors
- **Tags**: Categorize with multiple tags
- **Category Selection**: Organize by category
- **Featured Image**: Upload cover image
- **Publication Status**: Draft or Published
- **Scheduled Publishing**: Set future publish dates
- **SEO Fields**: Meta description and URL slug
- **Auto Slug Generation**: Generate SEO-friendly URLs

### User Experience

- **Preview Mode**: See how your article will look
- **Dark Mode**: Eye-friendly dark theme
- **Auto-save**: Never lose your work
- **Statistics**: Real-time word count, character count, reading time
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Speed up your workflow
- **Bubble Menu**: Quick formatting on text selection
- **Fullscreen Mode**: Distraction-free writing

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd test_post

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

### Getting Started

1. **Create a New Draft**: Click "New Draft" in the draft panel
2. **Write Your Article**: Start typing in the editor
3. **Format Text**: Use the toolbar for formatting options
4. **Add Metadata**: Fill in title, tags, category in the sidebar
5. **Preview**: Click "Preview" to see the final result
6. **Save**: Click "Save" or wait for auto-save

### Keyboard Shortcuts

#### Text Formatting

- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Shift + X` - Strikethrough
- `Ctrl/Cmd + E` - Code

#### Headings

- `Ctrl/Cmd + Alt + 1-6` - Heading 1-6

#### Lists

- `Ctrl/Cmd + Shift + 8` - Bullet list
- `Ctrl/Cmd + Shift + 9` - Numbered list

#### History

- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` / `Ctrl/Cmd + Shift + Z` - Redo

### Working with Images

1. Click the image icon in the toolbar
2. Select an image file (max 5MB)
3. Image will be automatically compressed and embedded
4. Click on the image to resize or delete

### Working with Tables

1. Click the table icon to insert a 3x3 table
2. Click inside the table to see table operations
3. Add/delete rows and columns as needed
4. Delete the entire table when done

### Export Options

Export your articles in multiple formats:

- **JSON**: Full article data including metadata
- **Markdown**: Plain text markdown format
- **HTML**: Standalone HTML file

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TipTap** - Headless editor framework
- **shadcn/ui** - UI component library
- **Ant Design** - Additional components (Select, DatePicker, etc.)
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **Lowlight** - Code syntax highlighting
- **Day.js** - Date manipulation

## Project Structure

```
src/
├── components/
│   ├── ArticleEditor/
│   │   ├── ArticleEditorMain.tsx    # Main editor container
│   │   ├── MetadataSidebar.tsx      # Article metadata panel
│   │   └── PreviewMode.tsx          # Preview component
│   ├── DraftManager/
│   │   └── DraftList.tsx            # Draft management
│   ├── Editor/
│   │   ├── TipTapEditor.tsx         # Core editor component
│   │   └── Toolbar.tsx              # Editor toolbar
│   └── ui/                          # shadcn/ui components
├── contexts/
│   └── ThemeContext.tsx             # Dark mode context
├── hooks/
│   └── useAutoSave.ts               # Auto-save hook
├── styles/
│   ├── editor.css                   # Editor styles
│   ├── toolbar.css                  # Toolbar styles
│   └── responsive.css               # Responsive design
├── types/
│   └── article.ts                   # TypeScript types
├── utils/
│   ├── imageHandler.ts              # Image compression
│   ├── readingTime.ts               # Statistics calculation
│   ├── storage.ts                   # LocalStorage manager
│   └── validation.ts                # Input validation
├── App.tsx                          # Main app component
└── main.tsx                         # Entry point
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Local Storage

The editor uses browser localStorage to save drafts. Data is stored locally and never sent to a server.

Storage keys:

- `article_drafts` - Array of article drafts
- `drafts_metadata` - Draft metadata for quick access
- `theme` - User's theme preference (light/dark)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions or issues, please open an issue on GitHub.

## Credits

Built with love using modern web technologies. Special thanks to the teams behind:

- TipTap Editor
- shadcn/ui
- Ant Design
- React team
