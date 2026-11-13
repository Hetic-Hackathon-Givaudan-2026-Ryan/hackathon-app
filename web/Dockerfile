# Front pour la démo (docker compose up) : build Vite, puis fichiers servis par
# nginx, qui transmet /api à l'API. Contexte de build : la racine du dépôt.
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
# --ignore-scripts : le « prepare » de la racine lance husky, inutile ici
RUN npm ci --workspace=web --ignore-scripts
COPY web web
# Sans VITE_DATA_SOURCE, le front lit l'API (mode « api »)
RUN npm run build --workspace=web

FROM nginx:1.30-alpine
COPY web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --start-interval=2s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
