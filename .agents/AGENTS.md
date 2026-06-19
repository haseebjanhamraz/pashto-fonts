# Pashto Fonts Project Rules

These rules govern the development of the Pashto Fonts application. All agent sessions working on this project must adhere to them.

## Tech Stack Guidelines
- **CSS Strategy**: Strictly use Vanilla CSS with centralized theme properties. Do NOT install or use Tailwind CSS, Bootstrap, or any other utility class framework. Keep style sheets organized using CSS Modules where possible for component styling, and a central `theme.css` for custom properties (design tokens).
- **Frontend**: Next.js 14+ (App Router), TypeScript, TanStack Query (React Query) for state fetching, Zustand for lightweight global state (like preview parameters).
- **Backend**: Express.js with TypeScript and Prisma ORM.
- **Worker**: Node.js worker using BullMQ for task management. Shell out to Python scripts utilizing the `fontTools` package for font metadata and glyph coverage checks.
- **Storage**: S3-compatible storage. Use MinIO for local development and Cloudflare R2 for production.
- **Database**: PostgreSQL.

## Domain and Deployment
- Dev Environment: Local Docker Compose services.
- Test/Initial Deployment: `pashtofonts.kpcybers.com` on Ubuntu LTS Docker.
- Production: `pashtofonts.com`

## Core Project Rules
1. **No License Management**: All fonts uploaded are open source. Do not implement complex license checks, download blocks, or licensing authorization routes. Anyone can download and embed any font.
2. **Real-time RTL Previewing**: Font previews must support RTL layout properly. Use:
   ```css
   direction: rtl;
   unicode-bidi: plaintext;
   text-align: right;
   ```
3. **Lazy Font Loading**: Do not load all font files simultaneously on the homepage/grid. Use Intersection Observer to load WOFF2 font files only when their preview cards enter the viewport.
