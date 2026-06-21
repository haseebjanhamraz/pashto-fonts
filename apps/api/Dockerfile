FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace=packages/shared
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --omit=dev
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 4000
ENV NODE_ENV=production
CMD ["npm", "run", "start", "--workspace=apps/api"]
