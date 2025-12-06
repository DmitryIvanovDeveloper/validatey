FROM node:20-alpine AS deps
ARG BUILD_REV=1
ENV BUILD_REV=${BUILD_REV}
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
ARG BUILD_REV=1
ENV BUILD_REV=${BUILD_REV}
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM node:20-alpine AS runner
ARG BUILD_REV=1
ENV BUILD_REV=${BUILD_REV}
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "--experimental-specifier-resolution=node", "dist/server.js"]



