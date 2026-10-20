# syntax=docker/dockerfile:1
#
# Builds the admin panel for Liara's Docker platform (see apps/admin/liara.json).
# Build from the REPO ROOT so npm workspace deps resolve:
#   docker build -f apps/admin/Dockerfile -t rad-admin .
#
# This is the Node.js runtime path — the Cloudflare/vinext build (npm run
# build:vinext) is untouched and still deployable for rollback.

FROM node:22-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/artworks/package.json packages/artworks/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/state/package.json packages/state/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ENV LIARA_BUILD=1 \
    NODE_ENV=production
RUN npm run build --workspace @rad/admin

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder /repo/apps/admin/.next/standalone ./
COPY --from=builder /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /repo/apps/admin/public ./apps/admin/public
# docker-compose.frontend-vps.yml runs this container as uid:gid 1000:1000;
# targeted to this one subtree, not a recursive chown of /app — see the
# matching comment in apps/storefront/Dockerfile for the full explanation.
# Must stay the LAST instruction touching apps/admin/.next.
RUN mkdir -p apps/admin/.next/cache && \
    chown -R 1000:1000 apps/admin/.next/cache
EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
