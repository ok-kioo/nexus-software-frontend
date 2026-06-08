# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Args injetados em build-time (Vite só lê variáveis com prefixo VITE_).
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SUPABASE_URL=https://iqrbavaodcmxtkkefwez.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TIhPM0HHrL_dKb6y2vxeIg_FEgY_1m-
ARG VITE_SUPABASE_PROJECT_ID=iqrbavaodcmxtkkefwez

COPY package.json ./
RUN bun install --no-save

COPY . .
RUN bun run build

# ---------- runtime (nginx) ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
