# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Пустой VITE_API_BASE_URL => фронт обращается к /api на ТОМ ЖЕ домене,
# а Caddy проксирует /api на backend. Никакого CORS.
ARG VITE_API_BASE_URL=""
# Удаляем закоммиченный dev-овский .env (там 127.0.0.1:8000) и фиксируем
# прод-значение в .env.production, чтобы сборка была детерминированной.
RUN rm -f .env .env.local \
 && printf 'VITE_API_BASE_URL=%s\n' "$VITE_API_BASE_URL" > .env.production

RUN npm run build

# ---------- runtime stage ----------
FROM nginx:alpine
# Этот nginx только отдаёт статику SPA (TLS и /api берёт на себя Caddy снаружи).
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
