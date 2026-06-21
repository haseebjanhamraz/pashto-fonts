FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/worker/package*.json ./apps/worker/
COPY apps/api/prisma ./apps/api/prisma
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker
RUN npm run build --workspace=packages/shared
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/worker

FROM node:20-alpine
# Install Python, pip and fonttools
RUN apk add --no-cache python3 py3-pip openssl && \
    ln -sf python3 /usr/bin/python
RUN pip install --no-cache-dir fonttools --break-system-packages

WORKDIR /app
COPY package*.json ./
COPY apps/worker/package*.json ./apps/worker/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --omit=dev
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/scripts ./apps/worker/scripts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

ENV NODE_ENV=production
CMD ["npm", "run", "start", "--workspace=apps/worker"]
