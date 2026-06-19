# Pashto Fonts Web Application

A Google Fonts-inspired RTL font discovery, preview, download, and web-font hosting platform focused on Pashto and Arabic-script languages.

## Project Structure

This project is managed as a monorepo containing:
- `apps/web`: Next.js web application (Frontend using Vanilla CSS).
- `apps/api`: Node.js & Express.js REST API (Backend).
- `apps/worker`: Node.js background processor for font conversion and glyph detection.
- `packages/shared`: Shared TypeScript types and configurations.

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Python 3.9+ (with `pip` for installing `fontTools`)

## Local Development Setup

1. **Clone and Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start local services:**
   Spin up PostgreSQL, Redis, and MinIO:
   ```bash
   npm run dev:services
   ```

4. **Initialize Database:**
   Apply Prisma migrations and seed database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Applications:**
   Start web, api, and worker concurrently:
   ```bash
   npm run dev:apps
   ```

## Production Target

- Deployment: Ubuntu LTS running Docker Compose.
- Subdomain: `pashtofonts.kpcybers.com`
- Object Storage: Cloudflare R2
- CSS Strategy: Centralized Vanilla CSS design system.
