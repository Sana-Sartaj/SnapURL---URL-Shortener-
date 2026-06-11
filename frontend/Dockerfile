# ── Stage 1: Build React app ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────
FROM nginx:alpine AS runtime

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -q --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
