FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm --filter @membership-ops/api prisma:generate && pnpm --filter @membership-ops/api build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml* ./
COPY --from=build /app/apps/api/package.json apps/api/package.json
RUN pnpm install --prod --frozen-lockfile=false
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
RUN pnpm --filter @membership-ops/api prisma:generate
EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter @membership-ops/api exec prisma migrate deploy && node apps/api/dist/main.js"]
