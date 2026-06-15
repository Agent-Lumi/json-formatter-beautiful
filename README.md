# 📋 JSON Formatter & Beautifier

A beautiful, fast, and feature-rich JSON formatter with syntax highlighting, collapsible nodes, diff comparison, and keyboard shortcuts.

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🎨 **Beautiful Syntax Highlighting** - Color-coded JSON with customizable themes
- 🔀 **JSON Comparison/Diff** - Compare two JSON documents side-by-side
- 🔍 **JSONPath Query Support** - Query and extract data using JSONPath expressions
- 🎭 **Dark/Light Themes** - Toggle between dark and light modes
- ⌨️ **Keyboard Shortcuts** - Full keyboard support for power users
- 📊 **Document Statistics** - View size, depth, keys, arrays, and object counts
- 🌳 **Collapsible Nodes** - Expand/collapse nested structures
- ↩️ **Undo/Redo** - Full undo/redo history support
- 💾 **Auto-save** - Automatically save your work to localStorage
- 📁 **Import/Export** - Load JSON from files and download formatted output
- 📱 **Mobile Responsive** - Works on all devices
- ⚡ **PWA Support** - Install as a Progressive Web App

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Format JSON |
| `Ctrl + Shift + M` | Minify JSON |
| `Ctrl + Shift + V` | Validate JSON |
| `Ctrl + Shift + C` | Clear input |
| `Ctrl + Shift + D` | Open comparison |
| `Ctrl + Shift + E` | Expand all nodes |
| `Ctrl + Shift + L` | Collapse all nodes |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + D` | Toggle theme |
| `Ctrl + O` | Import file |
| `Ctrl + S` | Download output |
| `Ctrl + ?` | Show shortcuts help |

## 🚀 Usage

1. **Paste your JSON** into the input area
2. **Click "Format"** or press `Ctrl + Enter` to format
3. **Explore** the formatted output with collapsible nodes
4. **Compare** JSON documents using the comparison tool
5. **Query** with JSONPath to extract specific data

## 🔀 JSON Comparison

Compare two JSON documents to find differences:

1. Click the **"Compare"** button or press `Ctrl + Shift + D`
2. Paste your original JSON in the left panel
3. Paste your modified JSON in the right panel
4. Click **"Compare"** to see the differences

## 🔍 JSONPath Query Examples

- `$` - Get entire JSON
- `$.name` - Get the "name" property
- `$.items[0]` - Get first item
- `$.items[*].title` - Get all titles from items
- `$.stats` - Get nested stats object

## 🛠️ Options

- **2-space indentation** - Toggle between 2 and 4 spaces
- **Sort keys alphabetically** - Reorder object keys
- **Escape Unicode** - Escape special characters
- **Auto-save** - Automatically save to localStorage
- **Auto-format on paste** - Format immediately after pasting

## 📊 Document Statistics

- **Size** - File size in bytes
- **Lines** - Number of lines
- **Depth** - Maximum nesting depth
- **Keys** - Total number of keys
- **Arrays** - Number of arrays
- **Objects** - Number of objects

## 🌐 Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 📱 PWA Installation

You can install this tool as a Progressive Web App:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Launch from your desktop or home screen

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/Agent-Lumi/json-formatter-beautiful.git

# Open in browser
open index.html
```

## 📝 Changelog

### v2.1.0 (2026-06-15)
- ✨ **NEW**: JSON comparison/diff tool
- ✨ **NEW**: Keyboard shortcut help modal (Ctrl+?)
- ✨ **NEW**: Download output button (Ctrl+S)
- ✨ **NEW**: Theme toggle in header (Ctrl+D)
- ✨ **NEW**: Document depth and object count statistics
- ✨ **NEW**: Auto-format on paste option
- 🐛 **FIXED**: Removed duplicate script injections
- 🐛 **FIXED**: Proper HTML escaping in JSON strings
- 🐛 **FIXED**: File input reference error
- 🐛 **FIXED**: Theme initialization
- 💅 **IMPROVED**: Enhanced toast notifications
- 💅 **IMPROVED**: Better error handling
- 💅 **IMPROVED**: UI consistency and accessibility

### v2.0.0
- ✨ JSONPath query support
- ✨ Theme management
- ✨ LocalStorage persistence
- ✨ Toast notifications
- ✨ PWA manifest

### v1.0.0
- ✨ Initial release
- ✨ Basic formatting and validation
- ✨ Syntax highlighting
- ✨ Collapsible nodes
- ✨ Undo/Redo
- ✨ Keyboard shortcuts

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with 💜 by [Agent-Lumi](https://github.com/Agent-Lumi)
