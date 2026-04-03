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

post_waver requires a Hexo blog to sync content. The `blog/` directory is **not tracked by git** - each user manages their own blog configuration.

You have several options:

**Option 1: Use existing Hexo blog (Recommended)**
```bash
# Create symlink to your existing blog
ln -s /path/to/your/hexo/blog ./blog
```

**Option 2: Clone your private blog repository**
```bash
# If you have your blog in a private repo
git clone git@github.com:username/my-private-blog.git blog
```

**Option 3: Initialize new Hexo blog**
```bash
# Install Hexo CLI
pnpm add -g hexo-cli

# Initialize blog
hexo init blog
cd blog
pnpm install
```

**Optional: Set up version control for your blog**
```bash
cd blog
git init
git remote add origin <your-private-repo-url>

# After syncing content with post_waver
cd ..
pnpm sync:blog  # Uses scripts/update-blog.sh to commit & push
```

> **Important**: The `blog/` directory is in `.gitignore` because it contains your personal blog configuration and should not be shared with the post_waver repository.

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

## ⚡ Quick Build & Run

### 📦 Build the Project

```bash
# First time setup - install dependencies
pnpm install

# Generate Prisma Client (required for database operations)
pnpm prisma generate

# Build all packages
pnpm build
```

**Build Process**:
- Compiles TypeScript → JavaScript
- Creates `dist/` directories in each package
- Copies static assets (themes, templates)
- Takes ~30-60 seconds on first run

### 🚀 Start Development Servers

**Full startup (build + start):**
```bash
pnpm dev
```

**Quick startup (skip build if already compiled):**
```bash
pnpm start
```

**Individual services:**
```bash
pnpm dev:web    # Start only Web UI (port 5173)
pnpm dev:api    # Start API server + Web UI (port 3001 + 5173)
```

### 📋 Service URLs

After starting, you can access:

- **Web UI**: http://localhost:5173/post_waver/
- **API Server**: http://localhost:3001/api/
- **API Health Check**: http://localhost:3001/api/health

### 🔄 Development Workflow

**Morning routine:**
```bash
pnpm start    # Quick start, uses already compiled code
```

**After code changes:**
```bash
pnpm build    # Recompile modified packages
pnpm start    # Restart services
```

**Full clean rebuild:**
```bash
pnpm clean        # Remove all dist/ directories
pnpm install      # Reinstall dependencies
pnpm prisma generate  # Regenerate Prisma Client
pnpm build        # Rebuild all packages
pnpm start        # Start services
```

### ⚠️ Common Issues

**Module not found errors:**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules scripts/node_modules
pnpm install
```

**Prisma errors:**
```bash
# Solution: Regenerate Prisma Client
pnpm prisma generate
```

**Port already in use:**
```bash
# Solution: Stop existing processes
lsof -ti :3001 | xargs kill -9    # Clear API port
lsof -ti :5173 | xargs kill -9    # Clear Web UI port
```

**Build failures:**
```bash
# Solution: Clean build
pnpm clean
pnpm build
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

### 🚀 Quick Start Commands

```bash
pnpm dev              # Build all + Start API & Web UI
pnpm start            # Start API & Web UI (skip build)
pnpm dev:web          # Start Web UI only
pnpm dev:api          # Start API server + Web UI
```

### 🔧 Build Commands

```bash
pnpm build            # Build all packages
pnpm clean            # Remove all dist/ directories
pnpm typecheck        # Type check without building
```

### 📝 Content Management

```bash
pnpm scan             # Scan and index content
pnpm scan:drafts      # Scan including drafts
pnpm inject:links     # Inject related article links
pnpm sync:blog        # Sync content to Hexo blog
```

### 🧪 Quality & Testing

```bash
pnpm lint             # Lint code
pnpm lint:fix         # Fix linting issues
pnpm test             # Run tests
```

### 🗄️ Database Commands

```bash
pnpm db:init          # Initialize database (generate Prisma Client)
pnpm db:studio        # Open Prisma Studio (database GUI)
pnpm post:status      # Check post status in database
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
