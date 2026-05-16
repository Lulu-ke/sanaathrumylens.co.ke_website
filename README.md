# Sanaa Through My Lens

> Arts & Culture Opinion Blog — Highlighting stories around the art scene in Kenya and East Africa

**Sanaa** means *Art* in Swahili. Sanaa Through My Lens is an arts and culture opinion blog that highlights stories around the art scene — music, film, book reviews & commentary, events, and infortainment. We feature mainly events around Kenya, East Africa, and the world.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite dev / MySQL production)
- **Auth**: NextAuth.js v4 (Credentials + Google OAuth + 2FA)
- **Editor**: Tiptap WYSIWYG
- **Fonts**: Playfair Display (headlines) + Inter (body)
- **Icons**: Lucide React

## Features

### Public Blog
- Modern newspaper-style layout
- Trending ticker, hero featured posts, category tabs
- Events calendar with city/category filters
- Full-text search
- Newsletter subscription ("This Week in East African Arts")
- Dark/light mode
- SEO optimized (meta tags, Open Graph, JSON-LD)
- Social sharing (Twitter, Facebook, WhatsApp)
- Responsive mobile-first design

### CMS Dashboard
- **6 Role-Based Access Levels**: Super Admin, Admin, Editor, Author, Moderator, Reader
- Role-aware sidebar navigation
- Post management with editorial workflow (Draft → Pending Review → Approved → Published)
- Tiptap WYSIWYG editor with image upload & YouTube embed
- Scheduled publishing
- Revision history
- Comment moderation
- Events management
- Categories & tags with color coding
- Media library with drag-drop upload
- User management (Super Admin only)
- Ad/sponsored content management
- Site settings
- 2FA (Email OTP)
- Profile management

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A MySQL database (for production) or SQLite (included for dev)

### Installation

```bash
# Clone the repo
git clone https://github.com/Lulu-ke/sanaathrumylens.co.ke_website.git
cd sanaathrumylens.co.ke_website

# Install dependencies
bun install

# Copy environment config
cp .env.example .env
# Edit .env with your database and auth credentials

# Set up database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sanaathrumylens.co.ke | Admin@2024! |
| Editor | editor@sanaathrumylens.co.ke | Editor@2024! |
| Author | author@sanaathrumylens.co.ke | Author@2024! |
| Moderator | moderator@sanaathrumylens.co.ke | Moderator@2024! |

> ⚠️ Change these passwords immediately after first login in production!

## Project Structure

```
src/
├── app/
│   ├── (blog)/           # Public blog pages
│   │   ├── page.tsx      # Homepage
│   │   ├── post/[slug]/  # Article pages
│   │   ├── category/     # Category pages
│   │   ├── tag/          # Tag pages
│   │   ├── author/       # Author profiles
│   │   ├── events/       # Events listing & detail
│   │   ├── search/       # Search page
│   │   ├── newsletter/   # Newsletter signup
│   │   └── about/        # About page
│   ├── auth/             # Sign-in pages
│   ├── dashboard/        # CMS dashboard
│   │   ├── posts/        # Post management
│   │   ├── comments/     # Comment moderation
│   │   ├── events/       # Event management
│   │   ├── categories/   # Category management
│   │   ├── tags/         # Tag management
│   │   ├── media/        # Media library
│   │   ├── users/        # User management
│   │   ├── ads/          # Ad management
│   │   ├── settings/     # Site settings
│   │   └── profile/      # Profile settings
│   └── api/              # API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── blog/             # Blog-specific components
│   ├── layout/           # Header, Footer
│   └── editor/           # Tiptap editor
├── lib/                  # Utilities, auth, db
└── types/                # TypeScript types
```

## Production Deployment

1. Set `DATABASE_URL` to your MySQL connection string in `.env`
2. Change Prisma provider to `"mysql"` in `prisma/schema.prisma`
3. Add MySQL column types (`@db.MediumText`, `@db.LongText`) to the schema
4. Run `bun run db:push` against MySQL
5. Configure Google OAuth credentials
6. Set up SMTP for email OTP and newsletters
7. Set up your media CDN (e.g., `cdn.sanaathrumylens.co.ke`)

## License

Private — All rights reserved.
