# Pashto Fonts — Production Deployment Guide

This guide details the steps to deploy the Pashto Fonts application on an Ubuntu LTS server using Docker Compose and Nginx.

---

## 1. Domain Setup & DNS
Configure DNS records on Cloudflare (or your DNS provider):
- `A` record pointing `pashtofonts.com` to your server's public IP.
- `A` record pointing `pashtofonts.kpcybers.com` (for dev/staging tests) to the target server's IP.

---

## 2. Cloudflare R2 (S3-Compatible Storage)
For production, replace local MinIO with Cloudflare R2:
1. **Create Bucket**: Log in to Cloudflare Dashboard → R2 Object Storage → Create Bucket named `pashto-fonts-prod`.
2. **CORS Policy**: Under settings, configure the CORS policy to allow font file requests from your domain:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["https://pashtofonts.com", "https://pashtofonts.kpcybers.com"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
3. **Public URL**: Enable custom domain (e.g. `cdn.pashtofonts.com`) or enable the R2 managed public bucket URL to serve fonts.
4. **API Credentials**: Generate an API token with `Edit` permissions to obtain:
   - S3 Endpoint URL (e.g. `https://<account-id>.r2.cloudflarestorage.com`)
   - Access Key ID
   - Secret Access Key

---

## 3. Server Configuration & Setup

### Prerequisites
On your clean Ubuntu server, install Docker, Docker Compose, and Nginx:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
```

### Clone Project & Configure `.env`
Create a `.env` file on your server in the project directory:
```ini
# Production Environment Variables
NODE_ENV=production
JWT_SECRET=supersecretjwtkeyforproddontshare

# Database Settings
POSTGRES_USER=pashtofonts_admin
POSTGRES_PASSWORD=secureproductiondbpasswordhere
POSTGRES_DB=pashto_fonts

# Next.js URLs (Used in building/running Next.js container)
NEXT_PUBLIC_API_URL=https://pashtofonts.com
NEXT_PUBLIC_SITE_URL=https://pashtofonts.com

# Cloudflare R2 / S3 Config
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_BUCKET=pashto-fonts-prod
S3_REGION=auto
S3_PUBLIC_URL=https://cdn.pashtofonts.com # Or R2 public url
```

---

## 4. Run Deployments

### Build and Start Containers
Run Docker Compose in detached mode using the production compose file:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
This builds:
- Frontend on container port `3000` (mapped to local host `127.0.0.1:3000`)
- Backend API on container port `4000` (mapped to local host `127.0.0.1:4000`)
- Worker connected to Redis/PostgreSQL for background processing.

### Database Migrations & Seeding
Run migrations and seeds directly inside the API container to initialize schemas:
```bash
docker exec -it pashto-fonts-api-prod npm run db:migrate
docker exec -it pashto-fonts-api-prod npm run db:seed
# Seed admin account (admin@pashtofonts.com / admin123)
docker exec -it pashto-fonts-api-prod npx ts-node prisma/seed-admin.ts
```

---

## 5. Nginx & SSL termination

1. Copy the Nginx site configuration file from [nginx/pashtofonts.conf](file:///D:/projects/pashto-fonts/nginx/pashtofonts.conf) to the Nginx servers:
   ```bash
   sudo cp nginx/pashtofonts.conf /etc/nginx/sites-available/pashtofonts
   sudo ln -s /etc/nginx/sites-available/pashtofonts /etc/nginx/sites-enabled/
   ```
2. Test Nginx configuration and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Secure with SSL (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d pashtofonts.com -d pashtofonts.kpcybers.com
   ```

---

## 6. Database Backups
To protect font metadata, setup a cron job to backup the PostgreSQL database daily:
1. Create a script `/opt/backup-db.sh`:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/var/backups/pashtofonts"
   mkdir -p $BACKUP_DIR
   FILENAME="$BACKUP_DIR/db_backup_$(date +%F_%T).sql"
   
   # Run pg_dump inside docker
   docker exec pashto-fonts-postgres-prod pg_dump -U pashtofonts_admin pashto_fonts > $FILENAME
   
   # Compress backup
   gzip $FILENAME
   
   # Retain only past 14 days of backups
   find $BACKUP_DIR -type f -mtime +14 -delete
   ```
2. Make script executable:
   ```bash
   chmod +x /opt/backup-db.sh
   ```
3. Set Cron job (`sudo crontab -e`):
   ```cron
   0 2 * * * /opt/backup-db.sh
   ```

---

## 7. CDN Caching Strategy
To ensure speed and cost reduction:
1. **Immutable Font Files**: Font WOFF2/TTF assets on R2 should have metadata headers:
   `Cache-Control: public, max-age=31536000, immutable`
2. **Dynamic embeds**: `/css2` serves standard stylesheets. It uses Redis caching for 24 hours. If Cloudflare CDN is in front, configure caching rule for path `/css2` to cache on Edge servers for 1 day.
