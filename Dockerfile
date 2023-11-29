# Dockerfile based on NextJS docs
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/README.md

FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build:docker

# Build db-seed script
RUN yarn db-seed:build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy license
COPY --from=builder --chown=nextjs:nodejs /app/LICENSE ./

# Copy files to be able to run migration and data seeding scripts from inside Docker
# Hackity hack to make self-hosting easier!
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ ./node_modules/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/ ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/tools/db-seed.mjs ./tools/
COPY --from=builder --chown=nextjs:nodejs /app/tools/db-migrate-and-seed.sh ./tools/

# Create dirs with right permissions
# The name must match paths in docker-compose as the dir needs to exist with right permissions before volume mounting.
RUN mkdir /app/volume && chown nextjs:nodejs /app/volume
VOLUME /app/volume

USER nextjs

EXPOSE 28669

ENV PORT 28669
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
