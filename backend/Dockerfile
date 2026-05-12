FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json

RUN npm ci

COPY backend backend
COPY shared shared

RUN npm run build -w @fastik/shared && npm run build -w @fastik/backend
RUN cp -R backend/src/db/migrations backend/dist/db/migrations
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/shared/package.json shared/package.json
COPY --from=build /app/shared/dist shared/dist

EXPOSE 4200

CMD ["node", "backend/dist/server.js"]
