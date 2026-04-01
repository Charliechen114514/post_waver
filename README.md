# post_waver

PostWeaver is a Markdown-centric content distribution system that weaves a single piece of writing into a multi-platform publishing flow.

## 🎯 What is post_waver?

post_waver is a **content management and distribution tool** that helps you:

- 📝 Write content once in Markdown
- 🚀 Distribute to multiple platforms (掘金, 微信公众号, etc.)
- 🔄 Sync with your Hexo blog automatically
- 🎨 Maintain consistent formatting across platforms

**Designed for**: Technical bloggers who want to maximize their content reach.

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver

# Install dependencies
pnpm install
```

### Initialize Your Blog

post_waver requires a Hexo blog to sync content. You have two options:

**Option 1: Use existing Hexo blog**
```bash
# Create symlink or copy your blog
ln -s /path/to/your/hexo/blog ./blog
```

**Option 2: Initialize new Hexo blog**
```bash
# Install Hexo globally
pnpm add -g hexo-cli

# Initialize blog in current directory
hexo init blog
cd blog
pnpm install
```

> **Note**: The `blog/` directory is in `.gitignore` - each user manages their own blog.

### First Run

```bash
# Write a test article
echo "# Hello World" > content/posts/test.md

# Scan and index content
pnpm scan

# Sync to blog (if configured)
pnpm sync:blog
```

---

## 📁 Project Structure

```
post_waver/
├── packages/
│   ├── core/         # Core parsing logic
│   ├── linker/       # Content relationship linking
│   ├── transformer/  # Platform-specific transformers
│   ├── adapter/      # Platform API adapters
│   ├── engine/       # Unified publishing engine
│   └── web-ui/       # Web interface
├── content/          # Your Markdown articles
├── scripts/          # Utility scripts
└── blog/             # Your Hexo blog (not tracked by git)
```

---

## 🛠️ Available Commands

```bash
# Development
pnpm dev              # Start web-ui dev server
pnpm build            # Build all packages
pnpm test             # Run tests

# Content Management
pnpm scan             # Scan and index content
pnpm sync:blog        # Sync content to Hexo blog

# Quality
pnpm lint             # Lint code
pnpm lint:fix         # Fix linting issues
pnpm typecheck        # Type check TypeScript
```

---

## 📚 Documentation

- **Roadmap**: [milestones/README.md](milestones/README.md)
- **Platform Guides**: [docs/platforms/](docs/platforms/)
- **Technical Decisions**: [03-tech-considerations.md](03-tech-considerations.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

**License**: MIT
