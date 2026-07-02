# Изменения для деплоя — legacy-frontend

## Что добавилось / поменялось
- **Dockerfile** (новый) — multi-stage сборка: `node build` → `nginx` со статикой.
  `ARG VITE_API_BASE_URL` пустой ⇒ фронт ходит на `/api` того же домена (Caddy проксирует на бэк).
- **nginx.conf** (новый) — отдаёт статику SPA + fallback на `index.html` (роуты /home, /card/.. и т.п.).
- **.dockerignore** (новый).
- **.github/workflows/deploy.yml** — РАНЬШЕ деплоил на GitHub Pages, ТЕПЕРЬ собирает docker-образ
  и пушит в `ghcr.io/it-famcs/legacy-frontend:latest`.

## Как задеплоить (авторелиз)
1. Влить эти файлы в репозиторий и **запушить в master/main**.
2. Проверить сборку в **Actions**.
3. **Один раз:** сделать пакет публичным — Организация **IT-FAMCS** → **Packages** →
   `legacy-frontend` → **Package settings** → **Change visibility → Public**.
4. Всё. **watchtower** на сервере сам обновит контейнер `legacy-frontend`.

## Важно
- Старый деплой на **GitHub Pages** больше не используется. При желании выключите его:
  Settings → Pages → Source → None.
- Образ фронта — это nginx со статикой, слушает :80, HTTPS/домен даёт внешний Caddy на сервере.
