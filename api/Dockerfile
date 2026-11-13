# API Express pour la démo (docker compose up). Contexte de build : la racine
# du dépôt, pour le package-lock.json commun aux workspaces.
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
# --ignore-scripts : le « prepare » de la racine lance husky, inutile ici
RUN npm ci --workspace=api --ignore-scripts
COPY api/tsconfig.json api/
COPY api/src api/src
RUN npm run build --workspace=api

FROM node:24-trixie-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace=api --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/api/dist api/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --start-interval=2s \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "api/dist/index.js"]
