# Pashto Fonts Web Application — AI Build Reference & Project Plan

**Project name:** Pashto Fonts  
**Product type:** Google Fonts-inspired RTL font discovery, preview, download, and web-font hosting platform  
**Primary language/script:** Pashto and other Arabic-script RTL languages  
**Target users:** Pashto/Urdu/Arabic website owners, designers, developers, publishers, video editors, social media creators, WordPress users, and typography enthusiasts.

---

## 1. Master Prompt for AI Builder

Use this prompt when asking an AI coding agent to build the application.

```text
You are a senior full-stack web application engineer with 10+ years of industrial experience building scalable SaaS platforms, developer tools, content platforms, and high-performance frontend applications.

Build a production-grade web application called "Pashto Fonts".

The app should be inspired by Google Fonts, but focused only on Pashto and RTL Arabic-script fonts. Users should be able to browse hundreds of fonts, type Pashto text, preview that text in real time across all fonts, open individual font detail pages, download fonts, and copy CSS embed code to use fonts on their own websites.

The application must be robust, scalable, cleanly architected, and built in phases. Do not create a toy prototype. Build it like a real production application.

Core requirements:
1. Public homepage.
2. Public fonts browsing page.
3. Real-time global Pashto text preview.
4. Font cards with lazy-loaded font previews.
5. Font detail page.
6. Search and filters.
7. Font download support.
8. Google Fonts-like CSS embed endpoint.
9. Admin panel for font upload and management.
10. Font processing pipeline that converts TTF/OTF to WOFF2.
11. Pashto glyph support detection.
12. Database-backed font metadata.
13. Object storage-backed font files.
14. Production deployment support with Docker.
15. Clean documentation.

Recommended stack:
- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express or NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Storage: Cloudflare R2 or S3-compatible storage
- Cache/queue: Redis + BullMQ
- Worker: Node.js worker plus Python fontTools where needed
- Deployment: Docker Compose behind Nginx or Cloudflare

Important:
- The public browsing page must not load hundreds of font files at once.
- Use lazy loading and Intersection Observer.
- Only load a font file when the corresponding preview card is visible.
- Use WOFF2 for web previews.
- Each font must have metadata: name, slug, category, supported languages, weights, license, designer, source, file URLs, download count, and status.
- Do not publish or expose fonts unless license status allows redistribution.
- Admin should be able to mark fonts as draft, published, private, or license-blocked.
- Pashto support detection must check Arabic script coverage plus Pashto-specific characters.
- The CSS endpoint should behave similarly to Google Fonts:
  /css2?family=Font+Name
  /css2?family=Font+Name:wght@400;700&display=swap

Build the project incrementally. For each phase:
- Explain what will be built.
- Create clean files.
- Keep code maintainable.
- Add validation.
- Add error handling.
- Add tests where practical.
- Provide instructions to run locally.
```

---

## 2. Product Vision

Pashto Fonts should become the central online platform for discovering, previewing, downloading, and embedding Pashto and RTL fonts.

The experience should feel similar to Google Fonts:

1. User opens the site.
2. User types Pashto text in a preview input.
3. All visible font cards update instantly.
4. User filters by category, language, weight, style, license, and popularity.
5. User opens a font detail page.
6. User previews font sizes, weights, and styles.
7. User downloads the font or copies CSS embed code.
8. Developers can load hosted fonts through a CSS URL.

---

## 3. Core MVP Scope

The first version should focus on the most valuable workflow.

### MVP Features

- Homepage
- Fonts listing page
- Real-time preview input
- Font cards
- Font detail page
- Font download
- CSS embed endpoint
- Admin login
- Admin font upload
- Font metadata extraction
- TTF/OTF to WOFF2 conversion
- Pashto glyph support detection
- PostgreSQL database
- Object storage for font files
- Docker-based local development

### Do Not Build in MVP

Avoid overbuilding these in the first version:

- Marketplace
- Paid plans
- User accounts
- Favorites
- Collections
- WordPress plugin
- Public font submission portal
- Advanced analytics dashboard
- PNG/social media export tool

These can come after the MVP is stable.

---

## 4. Recommended System Architecture

```text
Browser
  |
  |--- Next.js Web App
  |       |
  |       |--- Public pages
  |       |--- Admin UI
  |       |--- Real-time preview UI
  |
  |--- API Server
          |
          |--- PostgreSQL
          |--- Redis
          |--- Object Storage: Cloudflare R2 / S3
          |--- Background Worker
                  |
                  |--- Font metadata extraction
                  |--- WOFF2 conversion
                  |--- Pashto glyph checking
                  |--- ZIP package generation
```

### Production Deployment

```text
Cloudflare
  |
Nginx Reverse Proxy
  |
Docker Compose
  |--- web
  |--- api
  |--- worker
  |--- postgres
  |--- redis
```

---

## 5. Recommended Repository Structure

Use a monorepo.

```text
pashto-fonts/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── types/
│   │
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── fonts/
│   │   │   │   ├── font-files/
│   │   │   │   ├── categories/
│   │   │   │   ├── css/
│   │   │   │   ├── downloads/
│   │   │   │   ├── uploads/
│   │   │   │   └── analytics/
│   │   │   ├── middleware/
│   │   │   ├── config/
│   │   │   ├── utils/
│   │   │   └── main.ts
│   │   └── prisma/
│   │
│   └── worker/
│       ├── src/
│       │   ├── jobs/
│       │   ├── processors/
│       │   ├── services/
│       │   └── main.ts
│       └── scripts/
│           ├── extract-font-metadata.py
│           └── detect-glyphs.py
│
├── packages/
│   ├── shared/
│   └── types/
│
├── docker-compose.yml
├── .env.example
├── README.md
└── docs/
    ├── api.md
    ├── deployment.md
    ├── font-processing.md
    └── license-policy.md
```

---

## 6. Tech Stack

### Frontend

Use:

```text
Next.js
React
TypeScript
Tailwind CSS
TanStack Query
Zustand
React Hook Form
Zod
```

Frontend responsibilities:

- Public UI
- Admin UI
- Font preview controls
- Font listing
- Font detail page
- CSS embed code viewer
- Download interactions
- Search/filter UI
- Lazy font loading

### Backend

Use:

```text
Node.js
TypeScript
Express.js or NestJS
Prisma
PostgreSQL
Redis
BullMQ
Zod
Multer
```

Backend responsibilities:

- REST API
- Authentication
- Font metadata API
- Upload endpoint
- CSS generation endpoint
- Download endpoint
- Analytics tracking
- Worker queue management

### Storage

Use:

```text
Cloudflare R2
```

Alternative:

```text
AWS S3
DigitalOcean Spaces
MinIO for local development
```

### Font Processing

Use:

```text
fontTools
woff2_compress
ttf2woff2
fontkit
opentype.js
HarfBuzz where needed
```

---

## 7. Main User Roles

### Public User

Can:

- Browse fonts
- Search fonts
- Preview fonts using custom Pashto text
- Open font pages
- Download fonts
- Copy CSS embed code

### Admin

Can:

- Log in
- Upload font files
- Edit font metadata
- Assign categories
- Mark supported languages
- Set license status
- Publish/unpublish fonts
- Regenerate WOFF2 files
- View basic analytics
- Delete or archive fonts

---

## 8. Public Pages

### `/`

Homepage.

Sections:

- Hero
- Search/preview input
- Featured fonts
- Popular fonts
- New fonts
- Categories
- Developer embed CTA
- License/safety message

Hero copy:

```text
Beautiful Pashto and RTL fonts for websites, design, and publishing.
```

### `/fonts`

Main font browsing page.

Must include:

- Global preview input
- Font size slider
- Weight selector
- Category filter
- Language filter
- License filter
- Search by font name
- Sort by latest, popular, downloads, name
- Font card grid/list

### `/fonts/[slug]`

Font detail page.

Must include:

- Font name
- Designer
- License
- Supported languages
- Weights/styles
- Large custom preview
- Size controls
- Download buttons
- CSS embed code
- `@import` code
- Usage CSS
- Glyph support summary
- Similar fonts

### `/categories`

List all font categories.

### `/categories/[slug]`

Fonts under selected category.

### `/api-docs`

Developer documentation for CSS embed API and REST API.

### `/license`

Explain license policy and font redistribution rules.

---

## 9. Admin Pages

### `/admin/login`

Admin login page.

### `/admin/dashboard`

Admin overview:

- Total fonts
- Published fonts
- Draft fonts
- License-blocked fonts
- Total downloads
- Most downloaded fonts

### `/admin/fonts`

Table of fonts.

Columns:

- Name
- Category
- Status
- License
- Weights
- Pashto support
- Downloads
- Created date
- Actions

### `/admin/fonts/upload`

Upload one or multiple fonts.

Upload flow:

1. Select TTF/OTF files.
2. Upload to API.
3. API stores original file temporarily.
4. Worker processes file.
5. Admin reviews metadata.
6. Admin publishes font.

### `/admin/fonts/[id]/edit`

Edit:

- Name
- Slug
- Category
- Description
- Designer
- Publisher
- License
- License URL
- Source URL
- Supported languages
- Status
- Featured flag

---

## 10. Database Schema

Use PostgreSQL with Prisma.

### Prisma Schema Draft

```prisma
model Admin {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         AdminRole @default(ADMIN)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  EDITOR
}

model Font {
  id              String      @id @default(cuid())
  name            String
  slug            String      @unique
  description     String?
  designer        String?
  publisher       String?
  sourceUrl       String?
  license         String?
  licenseUrl      String?
  licenseStatus   LicenseStatus @default(UNKNOWN)
  categoryId      String?
  category        Category?   @relation(fields: [categoryId], references: [id])
  status          FontStatus  @default(DRAFT)
  isFeatured      Boolean     @default(false)
  isVariable      Boolean     @default(false)

  supportsPashto  Boolean     @default(false)
  supportsUrdu    Boolean     @default(false)
  supportsArabic  Boolean     @default(false)
  supportsPersian Boolean     @default(false)

  viewCount       Int         @default(0)
  downloadCount   Int         @default(0)
  embedLoadCount  Int         @default(0)

  files           FontFile[]
  tags            FontTag[]
  analytics       FontAnalytics[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([name])
  @@index([slug])
  @@index([status])
  @@index([categoryId])
}

model FontFile {
  id               String   @id @default(cuid())
  fontId           String
  font             Font     @relation(fields: [fontId], references: [id], onDelete: Cascade)

  weight           Int
  style            FontStyle @default(NORMAL)
  format           FontFormat
  fileUrl          String
  storageKey       String
  fileSize         Int?
  originalFilename String?
  checksum         String?
  isWebFont        Boolean  @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([fontId])
  @@index([weight])
  @@index([format])
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  fonts       Font[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FontTag {
  id        String   @id @default(cuid())
  fontId    String
  font      Font     @relation(fields: [fontId], references: [id], onDelete: Cascade)
  tag       String
  createdAt DateTime @default(now())

  @@index([fontId])
  @@index([tag])
}

model FontAnalytics {
  id        String   @id @default(cuid())
  fontId    String
  font      Font     @relation(fields: [fontId], references: [id], onDelete: Cascade)
  eventType AnalyticsEvent
  ipHash    String?
  userAgent String?
  referrer  String?
  createdAt DateTime @default(now())

  @@index([fontId])
  @@index([eventType])
  @@index([createdAt])
}

enum FontStatus {
  DRAFT
  PROCESSING
  PUBLISHED
  PRIVATE
  ARCHIVED
  ERROR
}

enum LicenseStatus {
  UNKNOWN
  ALLOWED
  PERSONAL_ONLY
  COMMERCIAL
  BLOCKED
}

enum FontStyle {
  NORMAL
  ITALIC
  OBLIQUE
}

enum FontFormat {
  TTF
  OTF
  WOFF
  WOFF2
}

enum AnalyticsEvent {
  VIEW
  DOWNLOAD
  COPY_CSS
  EMBED_LOAD
}
```

---

## 11. Pashto Glyph Detection

The app must not assume every Arabic font supports Pashto.

Pashto-specific characters include:

```text
پ ټ ځ څ ډ ړ ژ ږ ښ ګ ڼ ئ ې ۍ
```

Recommended detection logic:

```text
If the font contains Arabic base letters plus most Pashto-specific letters,
mark supportsPashto = true.
```

Minimum Pashto glyph set:

```text
پ ټ ډ ړ ژ ږ ښ ګ ڼ ې ۍ
```

Better extended check:

```text
ا ب پ ت ټ ث ج ځ چ څ ح خ د ډ ذ ر ړ ز ژ ږ س ش ښ ص ض ط ظ ع غ ف ق ک ګ ل م ن ڼ و ه ء ی ې ۍ ئ
```

### Worker Task

When processing a font:

1. Open font file.
2. Read Unicode cmap table.
3. Check required Unicode codepoints.
4. Store support booleans:
   - supportsPashto
   - supportsUrdu
   - supportsArabic
   - supportsPersian

---

## 12. Font Processing Pipeline

### Upload Flow

```text
Admin uploads TTF/OTF
  |
API validates file
  |
API stores original file temporarily
  |
API creates Font record with status PROCESSING
  |
API adds job to BullMQ
  |
Worker extracts metadata
  |
Worker converts to WOFF2
  |
Worker uploads original + WOFF2 to R2/S3
  |
Worker updates database
  |
Font becomes DRAFT or PUBLISHED depending on admin settings
```

### Processing Steps

For each uploaded file:

1. Validate MIME/type/extension.
2. Validate maximum file size.
3. Generate checksum.
4. Extract internal font names.
5. Detect family name.
6. Detect subfamily/style.
7. Detect weight.
8. Detect variable font data.
9. Detect glyph coverage.
10. Detect Pashto support.
11. Convert to WOFF2.
12. Upload original file.
13. Upload WOFF2 file.
14. Generate downloadable ZIP package.
15. Save metadata.
16. Set status to DRAFT for review.

### Error Handling

If processing fails:

- Set font status to `ERROR`.
- Store error message in logs.
- Show failed job in admin panel.
- Allow retry.

---

## 13. Public API Routes

### Fonts

```http
GET /api/fonts
GET /api/fonts/:slug
GET /api/fonts?search=qalam
GET /api/fonts?category=naskh
GET /api/fonts?language=pashto
GET /api/fonts?sort=popular
GET /api/fonts?limit=24&page=1
```

Response example:

```json
{
  "data": [
    {
      "id": "font_123",
      "name": "BBC Reith Qalam",
      "slug": "bbc-reith-qalam",
      "category": "Naskh",
      "supportsPashto": true,
      "supportsUrdu": true,
      "weights": [400, 700],
      "previewCssUrl": "/css2?family=BBC+Reith+Qalam:wght@400",
      "downloadCount": 1200
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 320,
    "totalPages": 14
  }
}
```

### Categories

```http
GET /api/categories
GET /api/categories/:slug
```

### Downloads

```http
GET /api/fonts/:slug/download
GET /api/fonts/:slug/download?format=woff2
GET /api/fonts/:slug/download?format=zip
```

### Analytics

```http
POST /api/analytics/view
POST /api/analytics/download
POST /api/analytics/copy-css
```

---

## 14. CSS Embed API

The app should provide a CSS endpoint similar to Google Fonts.

### Supported URLs

```http
GET /css2?family=Font+Name
GET /css2?family=Font+Name:wght@400
GET /css2?family=Font+Name:wght@400;700
GET /css2?family=Font+Name:wght@400;700&display=swap
```

### Example Output

```css
@font-face {
  font-family: "BBC Reith Qalam";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("https://cdn.pashtofonts.com/fonts/bbc-reith-qalam/regular.woff2") format("woff2");
}

@font-face {
  font-family: "BBC Reith Qalam";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("https://cdn.pashtofonts.com/fonts/bbc-reith-qalam/bold.woff2") format("woff2");
}
```

### Required Headers

```http
Content-Type: text/css; charset=utf-8
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

### Important CSS API Rules

- Only published fonts should be returned.
- License-blocked fonts must not be returned.
- If a requested weight is unavailable, either return the nearest weight or return a clear CSS comment.
- Cache generated CSS in Redis.
- Track embed loads carefully and avoid writing analytics on every request directly to PostgreSQL.

---

## 15. Frontend Font Loading Strategy

Hundreds of fonts can destroy performance if loaded incorrectly.

### Do This

- Load font metadata first.
- Display first page of 20–30 fonts.
- Use infinite scroll or pagination.
- Use Intersection Observer.
- Load a font's WOFF2 only when card enters viewport.
- Load only regular weight first.
- Load additional weights only on detail page or when selected.
- Use `font-display: swap`.
- Cache font files with CDN.

### Do Not Do This

- Do not load 300 font files on initial page load.
- Do not generate one giant CSS file containing all fonts.
- Do not use TTF/OTF for browser preview.
- Do not allow unpublished or unsafe license fonts in public CSS API.

---

## 16. Font Preview UI Requirements

### Global Controls

The fonts page should have:

- Preview text input
- Font size slider
- Font weight dropdown
- Line height control
- Text alignment control
- Background color picker
- Text color picker
- Reset button

Default preview text:

```text
پښتو ژبه زموږ د کلتور، ادب او ښکلا ژبه ده
```

Alternative sample texts:

```text
نننۍ مهمې خبرونه دلته ولولئ
د پښتنو تاریخ، ادب او هنر ډېر بډای دی
زموږ هدف د پښتو ښکلي فونټونه خلکو ته رسول دي
```

### Required CSS for RTL Preview

```css
.font-preview {
  direction: rtl;
  unicode-bidi: plaintext;
  text-align: right;
  line-height: 1.8;
  word-break: normal;
}
```

---

## 17. Font Card Component Requirements

Each card should show:

- Font name
- Category
- Preview text
- Available weights
- Supported language badges
- Download button
- View details button
- Copy CSS button

Example:

```text
BBC Reith Qalam
Naskh · Pashto · Urdu · Arabic
پښتو ژبه زموږ د کلتور، ادب او ښکلا ژبه ده
Weights: 400, 700
[View] [Download] [Copy CSS]
```

---

## 18. Font Detail Page Requirements

Each font page must include:

1. Font name.
2. Category.
3. Designer.
4. Publisher/source.
5. License.
6. Supported languages.
7. Available styles/weights.
8. Custom text preview.
9. Size slider.
10. Weight selector.
11. Glyph coverage summary.
12. Download buttons.
13. CSS embed code.
14. CSS usage example.
15. Similar fonts.

### Embed Code Display

```html
<link href="https://pashtofonts.com/css2?family=BBC+Reith+Qalam:wght@400;700&display=swap" rel="stylesheet">
```

### CSS Usage Display

```css
body {
  font-family: "BBC Reith Qalam", sans-serif;
}
```

---

## 19. Admin Upload Requirements

Admin should be able to bulk upload.

### Upload Validation

Accept only:

```text
.ttf
.otf
.woff
.woff2
```

Reject:

```text
.exe
.js
.php
.html
.svg
.zip unless explicitly supported later
```

### Upload Limits

Recommended:

```text
Single file max: 20 MB
Bulk upload max: 200 MB
```

### Admin Review

After processing, the admin should review:

- Extracted font name
- Slug
- Category
- License
- Supported languages
- Weight/style
- Preview result
- Processing status

---

## 20. License Policy

This project must treat licenses seriously.

For each font, store:

- License name
- License URL
- Source URL
- Designer/author
- Whether redistribution is allowed
- Whether commercial use is allowed
- Whether embedding is allowed
- Whether download is allowed

### Recommended Rule

Only fonts with clear redistribution permission should be:

- Publicly downloadable
- Publicly embeddable
- Available through CSS API

### License Status Behavior

```text
UNKNOWN:
  Show only in admin. Do not publish publicly.

ALLOWED:
  Can be previewed, downloaded, and embedded.

PERSONAL_ONLY:
  Can be listed with warning only if license allows redistribution. Otherwise keep private.

COMMERCIAL:
  Show purchase/source link if redistribution is not allowed.

BLOCKED:
  Do not show publicly.
```

---

## 21. Security Requirements

### General

- Use environment variables.
- Never commit secrets.
- Use secure password hashing.
- Use HTTP-only cookies or secure JWT handling.
- Use CSRF protection if cookie-based auth is used.
- Use rate limiting.
- Validate all input with Zod.
- Sanitize search parameters.
- Use CORS carefully.
- Add security headers.

### Upload Security

- Validate extension.
- Validate MIME type.
- Validate file signature where possible.
- Store uploads in temporary private storage first.
- Never execute uploaded files.
- Generate safe storage keys.
- Do not trust original filenames.
- Enforce upload size limits.

### Admin Security

- Strong password hashing with Argon2 or bcrypt.
- Login rate limiting.
- Optional two-factor authentication later.
- Audit logs for publish/delete actions.

---

## 22. SEO Requirements

Every public font page should be indexable.

### Font Page SEO Title

```text
BBC Reith Qalam Font - Download Pashto Web Font
```

### Meta Description

```text
Preview, download, and embed BBC Reith Qalam, a Pashto and RTL web font for websites, publishing, and design.
```

### SEO Keywords to Target

- Pashto fonts
- Pashto fonts download
- Pashto web fonts
- Urdu fonts for website
- Arabic RTL fonts
- Nastaliq web font
- Naskh font
- Pashto typography
- Pashto newspaper font

### Structured Data

Add structured data where useful:

- Font name
- License
- Author/designer
- Download URL
- Supported language

---

## 23. Testing Plan

### Unit Tests

Test:

- Slug generation
- Font weight parsing
- CSS URL parser
- CSS generator
- Glyph detection
- License status logic
- API validation schemas

### Integration Tests

Test:

- Font upload endpoint
- Processing job creation
- Font list API
- Font detail API
- CSS endpoint
- Download endpoint

### Frontend Tests

Test:

- Preview text updates
- Filters work
- Font cards render
- Copy CSS button works
- Detail page shows correct metadata
- Admin upload form validates files

### Manual QA Checklist

- Upload a TTF font.
- Confirm WOFF2 is created.
- Confirm Pashto glyph support is detected.
- Publish font.
- View on public fonts page.
- Type custom Pashto text.
- Confirm preview updates.
- Open font detail page.
- Download ZIP.
- Copy CSS embed.
- Test CSS embed on a separate HTML page.
- Confirm mobile layout works.
- Confirm RTL layout looks correct.

---

## 24. Environment Variables

Example `.env.example`:

```env
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pashto_fonts
REDIS_URL=redis://localhost:6379

JWT_SECRET=change_this_secret
COOKIE_SECRET=change_this_cookie_secret

S3_ENDPOINT=http://localhost:9000
S3_REGION=auto
S3_BUCKET=pashto-fonts
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio123
S3_PUBLIC_BASE_URL=http://localhost:9000/pashto-fonts

CDN_BASE_URL=https://cdn.pashtofonts.com
PUBLIC_SITE_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000

MAX_FONT_UPLOAD_MB=20
```

---

## 25. Docker Compose Plan

Services:

```text
web
api
worker
postgres
redis
minio
nginx
```

Development `docker-compose.yml` should include:

- PostgreSQL
- Redis
- MinIO for local S3-compatible storage
- API server
- Worker
- Web app

Production can replace MinIO with Cloudflare R2 or S3.

---

## 26. Development Phases

## Phase 0 — Project Setup

### Goal

Create clean monorepo and local environment.

### Tasks

- Initialize repository.
- Add apps/web.
- Add apps/api.
- Add apps/worker.
- Add TypeScript.
- Add ESLint/Prettier.
- Add Docker Compose.
- Add PostgreSQL.
- Add Redis.
- Add Prisma.
- Add `.env.example`.

### Acceptance Criteria

- Developer can run project locally.
- Web app opens.
- API health endpoint works.
- Database connection works.
- Redis connection works.

---

## Phase 1 — Database and Core API

### Goal

Create core database schema and public font APIs.

### Tasks

- Implement Prisma schema.
- Add migrations.
- Create seed categories.
- Create `GET /api/fonts`.
- Create `GET /api/fonts/:slug`.
- Create `GET /api/categories`.
- Add pagination.
- Add search.
- Add filtering.
- Add sorting.

### Acceptance Criteria

- Fonts can be seeded manually.
- Public API returns paginated fonts.
- Filters work.
- Search works.

---

## Phase 2 — Public Frontend

### Goal

Build homepage, fonts page, and font cards.

### Tasks

- Create homepage.
- Create fonts browsing page.
- Create global preview input.
- Create preview controls.
- Create font card component.
- Create category/filter sidebar.
- Connect to API.
- Add loading/error states.
- Add responsive design.

### Acceptance Criteria

- User can browse fonts.
- User can type Pashto text.
- Visible font previews update in real time.
- Filters and search update results.
- Mobile layout works.

---

## Phase 3 — Font Detail Page

### Goal

Build complete font detail experience.

### Tasks

- Create `/fonts/[slug]`.
- Fetch font detail API.
- Show metadata.
- Add large preview.
- Add weight selector.
- Add size slider.
- Show supported languages.
- Show license.
- Show CSS embed code.
- Add copy button.
- Add download buttons.

### Acceptance Criteria

- Each published font has a working detail page.
- User can preview text in selected font.
- User can copy embed code.
- User can download available font files.

---

## Phase 4 — Admin Authentication

### Goal

Create secure admin login.

### Tasks

- Create Admin model.
- Add password hashing.
- Add login endpoint.
- Add logout endpoint.
- Add auth middleware.
- Add admin login page.
- Protect admin routes.
- Add seed admin command.

### Acceptance Criteria

- Admin can log in.
- Admin can log out.
- Protected endpoints reject unauthenticated requests.
- Admin dashboard is not publicly accessible.

---

## Phase 5 — Font Upload and Worker Queue

### Goal

Allow admin to upload fonts and process them asynchronously.

### Tasks

- Create upload endpoint.
- Validate files.
- Store file temporarily.
- Add BullMQ queue.
- Create worker process.
- Add processing job.
- Create processing status field.
- Show status in admin UI.

### Acceptance Criteria

- Admin can upload TTF/OTF.
- API creates processing job.
- Worker receives job.
- Font status updates.

---

## Phase 6 — Font Metadata Extraction and WOFF2 Conversion

### Goal

Process fonts into usable web fonts.

### Tasks

- Extract font family name.
- Extract subfamily.
- Detect weight.
- Detect style.
- Detect variable font.
- Detect glyph coverage.
- Detect Pashto support.
- Convert to WOFF2.
- Upload files to storage.
- Save FontFile records.
- Set font status to DRAFT.

### Acceptance Criteria

- Uploaded fonts become WOFF2 files.
- Metadata is saved.
- Pashto support is detected.
- Admin can review processed font.

---

## Phase 7 — CSS Embed Endpoint

### Goal

Create Google Fonts-like CSS API.

### Tasks

- Parse `family` query parameter.
- Support weight syntax.
- Support display parameter.
- Generate `@font-face`.
- Return `text/css`.
- Add CDN/cache headers.
- Cache generated CSS in Redis.
- Track embed load count asynchronously.

### Acceptance Criteria

- `/css2?family=Font+Name` returns valid CSS.
- CSS loads font from CDN/storage URL.
- Browser can use hosted font on external site.
- Only published and license-allowed fonts are returned.

---

## Phase 8 — Download System

### Goal

Allow users to download fonts safely.

### Tasks

- Create download endpoint.
- Support WOFF2.
- Support original file if allowed.
- Support ZIP package.
- Increment download count.
- Add download buttons in UI.
- Add license file to ZIP if available.

### Acceptance Criteria

- User can download font.
- Download count increases.
- License-blocked fonts cannot be downloaded.

---

## Phase 9 — Admin Font Management

### Goal

Give admin complete control.

### Tasks

- Create admin font list.
- Create edit page.
- Allow category assignment.
- Allow license editing.
- Allow status changes.
- Allow publish/unpublish.
- Allow featured toggle.
- Allow delete/archive.
- Add retry processing button.

### Acceptance Criteria

- Admin can manage fonts without database access.
- Admin can keep unsafe fonts private.
- Admin can publish ready fonts.

---

## Phase 10 — Production Hardening

### Goal

Prepare for real users.

### Tasks

- Add rate limiting.
- Add API validation.
- Add logging.
- Add error monitoring.
- Add Nginx config.
- Add production Docker config.
- Add database backup instructions.
- Add CDN configuration.
- Add security headers.
- Add sitemap.
- Add robots.txt.
- Add Open Graph metadata.

### Acceptance Criteria

- App is deployable on Ubuntu VPS.
- Public pages are SEO-friendly.
- CSS/font files are cacheable.
- Admin is secure.
- Uploads are protected.

---

## 27. Suggested AI Build Prompts by Phase

Use these prompts one by one. Do not ask AI to build the entire application in one response.

### Prompt 1 — Setup Monorepo

```text
Create the initial monorepo for the Pashto Fonts project.

Use:
- apps/web: Next.js + TypeScript + Tailwind
- apps/api: Node.js + Express + TypeScript
- apps/worker: Node.js + TypeScript worker
- packages/shared for shared types
- PostgreSQL with Prisma
- Redis
- Docker Compose

Create clean folder structure, package scripts, .env.example, README, and a health check API endpoint.

Do not implement font upload yet. Only setup the foundation.
```

### Prompt 2 — Database Schema

```text
Implement the PostgreSQL database schema for Pashto Fonts using Prisma.

Create models:
- Admin
- Font
- FontFile
- Category
- FontTag
- FontAnalytics

Include enums:
- FontStatus
- LicenseStatus
- FontStyle
- FontFormat
- AnalyticsEvent
- AdminRole

Add migrations, Prisma client setup, and seed script for default categories:
Naskh, Nastaliq, Kufi, Modern, Sans, Serif, Calligraphy, Display, News, UI.

Create repository/service layer for fonts and categories.
```

### Prompt 3 — Public API

```text
Build the public API routes for Pashto Fonts.

Implement:
GET /api/fonts
GET /api/fonts/:slug
GET /api/categories
GET /api/categories/:slug

Support:
- pagination
- search by name
- filter by category
- filter by language support
- sort by latest, popular, downloads, name

Only return fonts with status PUBLISHED and licenseStatus ALLOWED.

Use Zod for query validation and return consistent JSON responses.
```

### Prompt 4 — Public Fonts UI

```text
Build the public frontend for browsing fonts.

Create:
- homepage
- /fonts page
- font card component
- global Pashto preview input
- font size slider
- search input
- category filter
- language filter
- sort dropdown

Use RTL-safe preview styling:
direction: rtl;
unicode-bidi: plaintext;
text-align: right;

Use Zustand for preview state.
Use TanStack Query for API fetching.
Make the UI responsive and clean.
```

### Prompt 5 — Lazy Font Loading

```text
Implement lazy web font loading for font preview cards.

Requirements:
- Do not load all font files at once.
- Use Intersection Observer.
- When a card becomes visible, inject the required @font-face CSS for that font.
- Load WOFF2 only.
- Load default weight first.
- Use font-display: swap.
- Prevent duplicate style injection for the same font.
```

### Prompt 6 — Font Detail Page

```text
Create the font detail page /fonts/[slug].

It should show:
- font name
- category
- designer
- publisher/source
- license
- supported languages
- available weights/styles
- large RTL preview area
- preview controls
- download buttons
- CSS embed code
- CSS usage example
- copy-to-clipboard buttons

Make the page SEO-friendly with metadata.
```

### Prompt 7 — Admin Auth

```text
Build admin authentication.

Requirements:
- Admin login endpoint
- Password hashing with Argon2 or bcrypt
- Secure session or JWT auth
- HTTP-only cookie preferred
- Login rate limiting
- Protected admin routes
- Admin login page
- Admin dashboard shell

Add seed script to create first admin from environment variables.
```

### Prompt 8 — Font Upload API

```text
Build admin font upload API.

Requirements:
- Accept TTF, OTF, WOFF, WOFF2
- Reject all other file types
- Validate file size
- Store uploaded file temporarily
- Create Font record with status PROCESSING
- Add processing job to BullMQ queue
- Return upload result with processing status

Do not publish fonts automatically. Processed fonts should become DRAFT.
```

### Prompt 9 — Font Worker Processing

```text
Build the font processing worker.

Requirements:
- Read uploaded font file
- Extract font family name
- Extract style/subfamily
- Detect weight
- Detect whether variable font
- Detect glyph coverage
- Detect Pashto support
- Convert TTF/OTF to WOFF2
- Upload original and WOFF2 files to S3-compatible storage
- Create FontFile records
- Update Font metadata
- Set status to DRAFT after successful processing
- Set status ERROR on failure
```

### Prompt 10 — Pashto Glyph Detection

```text
Implement Pashto glyph detection.

Use font cmap/codepoints to check whether the font supports Pashto-specific letters:
پ ټ ځ څ ډ ړ ژ ږ ښ ګ ڼ ئ ې ۍ

Store:
supportsPashto
supportsUrdu
supportsArabic
supportsPersian

Create unit tests using mocked codepoint sets.
```

### Prompt 11 — CSS Embed Endpoint

```text
Build the Google Fonts-like CSS endpoint.

Implement:
GET /css2?family=Font+Name
GET /css2?family=Font+Name:wght@400;700&display=swap

Requirements:
- Parse family query
- Parse weights
- Validate requested font exists
- Only serve PUBLISHED and ALLOWED fonts
- Generate @font-face CSS using WOFF2 files
- Return Content-Type text/css
- Add long cache headers
- Add CORS header
- Cache generated CSS in Redis
```

### Prompt 12 — Admin Font Management

```text
Build admin font management UI.

Features:
- Font list table
- Processing status
- Search
- Filter by status
- Edit font metadata
- Edit license
- Assign category
- Publish/unpublish
- Mark featured
- Archive/delete
- Retry processing failed fonts

Make it practical and safe.
```

### Prompt 13 — Download System

```text
Build font download system.

Requirements:
- Download WOFF2
- Download original file if license allows
- Download full ZIP package
- Include stylesheet.css in ZIP
- Include LICENSE.txt if available
- Increment download count
- Prevent download for BLOCKED or UNKNOWN license fonts
```

### Prompt 14 — Production Deployment

```text
Prepare production deployment.

Create:
- Dockerfile for web
- Dockerfile for api
- Dockerfile for worker
- production docker-compose.yml
- Nginx reverse proxy config
- environment variable guide
- database migration command
- backup instructions
- Cloudflare/R2 setup instructions
- CDN caching notes
```

---

## 28. UI Design Direction

### Visual Style

Use a clean Google Fonts-inspired layout:

- White background
- Large readable typography
- Minimal borders
- Soft shadows
- Rounded cards
- Strong search and preview controls
- RTL-first text rendering

### Suggested Colors

```text
Primary: #111827
Accent: #B80000
Background: #FFFFFF
Muted background: #F9FAFB
Border: #E5E7EB
Text muted: #6B7280
```

### Design Priorities

- Typography should be the hero.
- Font previews should be large and readable.
- UI should not distract from font samples.
- Mobile experience should be excellent.
- RTL preview must be accurate.

---

## 29. Performance Requirements

### Public Pages

- First contentful paint should be fast.
- Do not block page load with font files.
- Use paginated or virtualized list.
- Lazy-load font previews.
- Cache API responses where safe.
- Compress assets.
- Use CDN for font files.

### Font Files

- Use WOFF2 for browser preview.
- Use long-term cache headers.
- Use immutable URLs when files are content-hashed.
- Avoid changing file URLs after publishing.

---

## 30. Error Handling Requirements

### API Error Shape

Use consistent errors:

```json
{
  "success": false,
  "error": {
    "code": "FONT_NOT_FOUND",
    "message": "Font not found."
  }
}
```

### Common Error Codes

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
FONT_NOT_FOUND
FONT_NOT_PUBLISHED
LICENSE_BLOCKED
UPLOAD_INVALID_TYPE
UPLOAD_TOO_LARGE
PROCESSING_FAILED
INTERNAL_ERROR
```

---

## 31. Coding Standards

- Use TypeScript everywhere.
- Use clear service/repository separation.
- Validate all API input with Zod.
- Use descriptive names.
- Avoid giant components.
- Keep API response shape consistent.
- Add comments only where logic is non-obvious.
- Use environment variables.
- Do not hardcode secrets.
- Avoid premature complexity.
- Build phase by phase.

---

## 32. Recommended First Milestone

The first usable release should do this perfectly:

```text
Admin uploads a font.
System converts it to WOFF2.
Admin publishes it.
User sees it on /fonts.
User types Pashto text.
Preview updates live.
User opens detail page.
User downloads the font.
User copies CSS embed code.
External website can load the hosted font.
```

This is the core product.

Everything else is secondary.

---

## 33. Future Features

After MVP:

### WordPress Plugin

A WordPress plugin can let users:

- Select Pashto Fonts from your CDN.
- Apply fonts globally.
- Apply fonts to headings/body/buttons.
- Work with Elementor.
- Locally host selected fonts if needed.

### Font Collections

Users can create:

- News fonts
- Poetry fonts
- Nastaliq fonts
- UI fonts
- Political poster fonts
- Social media fonts

### Designer Submission Portal

Font designers can submit fonts.

Admin reviews and approves.

### Marketplace

Sell premium Pashto, Urdu, Arabic, and Persian fonts.

### PNG Text Generator

Users type Pashto text, select font/background, export image for:

- Facebook posts
- YouTube thumbnails
- News graphics
- Instagram cards

---

## 34. Final Build Instruction

When building this project with AI, do not say:

```text
Build the full app.
```

Instead, use the phase prompts above one by one.

The best order is:

```text
1. Setup monorepo
2. Database schema
3. Public API
4. Public frontend
5. Lazy font loading
6. Font detail page
7. Admin auth
8. Upload API
9. Worker processing
10. Glyph detection
11. CSS endpoint
12. Admin management
13. Download system
14. Production deployment
```

Build small, test each phase, then continue.

The most important technical goals are:

```text
Reliable font processing.
Correct Pashto glyph detection.
Fast preview performance.
Safe license handling.
Google Fonts-like CSS embedding.
Clean admin management.
```
