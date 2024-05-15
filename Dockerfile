##### DEPENDENCIES

FROM --platform=linux/amd64 node:20-alpine AS base

FROM base AS builder 

RUN apk add --no-cache libc6-compat openssl
RUN apk update

WORKDIR /app

RUN yarn global add turbo

RUN yarn global add pnpm
# Not using turbo prune causes redownloading of all dependencies on every build
# Not a big issue for small projects, but can be a bottleneck for larger ones
COPY . .

RUN pnpm install

RUN pnpm turbo run build --filter=web

FROM base AS runner

WORKDIR /app
 
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
 
COPY --from=builder /app/apps/web/next.config.js .
COPY --from=builder /app/apps/web/package.json .
 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
CMD NODE_TLS_REJECT_UNAUTHORIZED=0 node apps/web/server.js