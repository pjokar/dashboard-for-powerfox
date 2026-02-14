FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* .npmrc .pnpmfile.cjs ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run db:generate
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app ./

EXPOSE 3000
CMD ["pnpm", "start"]