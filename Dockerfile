# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
WORKDIR /app
COPY . .
RUN npm run lint && npm run build

FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
RUN groupadd --system --gid 10001 prolog && useradd --system --uid 10001 --gid prolog --home-dir /app prolog
RUN mkdir -p /app/uploads && chown -R prolog:prolog /app/uploads
COPY --from=production-dependencies --chown=prolog:prolog /app/node_modules ./node_modules
COPY --from=build --chown=prolog:prolog /app/dist ./dist
COPY --from=build --chown=prolog:prolog /app/build ./build
COPY --from=build --chown=prolog:prolog /app/db ./db
COPY --chown=prolog:prolog package.json ./
VOLUME ["/app/uploads"]
USER 10001:10001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "build/server.mjs"]
