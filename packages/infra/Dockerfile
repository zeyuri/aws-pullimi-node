FROM node:20-alpine AS alpine
ARG PROJECT
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN echo "Building ${PROJECT} in alpine"
RUN apk update
RUN apk add --no-cache libc6-compat

FROM alpine AS base
RUN pnpm install turbo --global
# RUN pnpm config set store-dir ~/.pnpm-store


# Prune projects
FROM base AS pruner
ARG PROJECT=nitro
WORKDIR /app
COPY . .
RUN turbo prune ${PROJECT} --docker


# Build the project
FROM base AS builder
ARG PROJECT=nitro

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

RUN turbo build --filter=${PROJECT}
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN rm -rf ./**/*/src

# Runner
FROM alpine AS runner
ARG PROJECT=nitro

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app .
WORKDIR /app/apps/${PROJECT}

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["node", "./.output/server/index.mjs"]