# Builds an omnibus image containing both apps: web and task-master
#
# Dockerfile based on Turborepo docs
# https://github.com/vercel/turbo/blob/main/examples/with-docker/apps/web/Dockerfile
# https://turbo.build/repo/docs/handbook/deploying-with-docker

FROM node:18-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=web --scope=task-master --docker


# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo build --filter=web... --filter=task-master...
RUN yarn turbo db-seed:build

# Production image, copy all the files and run next
FROM base AS runner
# pgloader is needed for SQLite to Postgres migration
RUN apk add --no-cache pgloader
WORKDIR /app

ENV NODE_ENV production

COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

# Copy license
COPY --from=builder /app/LICENSE ./

# Copy files to be able to run migration and data seeding scripts from inside Docker
# Hackity hack to make self-hosting easier!
COPY --from=installer /app/node_modules/ ./node_modules/
COPY --from=installer /app/packages/database/prisma/ ./packages/database/prisma/
COPY --from=installer /app/apps/web/tools/db-seed.mjs ./apps/web/tools/
COPY --from=installer /app/apps/web/tools/db-migrate-and-seed.sh ./apps/web/tools/
COPY --from=installer /app/apps/web/tools/migrate-to-postgres-db.load ./apps/web/tools/

# Copy task-master app
COPY --from=installer /app/apps/task-master/package.json ./apps/task-master/
COPY --from=installer /app/apps/task-master/dist/ ./apps/task-master/dist/
COPY --from=installer /app/packages/backend/dist/ ./packages/backend/dist/
COPY --from=installer /app/packages/core/dist/ ./packages/core/dist/
COPY --from=installer /app/packages/database/dist/ ./packages/database/dist/

EXPOSE 28669

ENV PORT 28669
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "apps/web/server.js"]
