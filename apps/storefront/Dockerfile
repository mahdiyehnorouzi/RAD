# syntax=docker/dockerfile:1
#
# Builds the storefront for Liara's Docker platform (see apps/storefront/liara.json).
# Build from the REPO ROOT so npm workspace deps resolve:
#   docker build -f apps/storefront/Dockerfile -t rad-storefront .
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
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# they must arrive as build ARGs (via liara.json's build.args), not just
# runtime env vars. API_URL/CATALOG_SOURCE are server-only and stay runtime.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV LIARA_BUILD=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID} \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=${NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
RUN npm run build --workspace @rad/storefront

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# `output: "standalone"` traces the monorepo-relative files it actually
# needs (apps/storefront/server.js + a pruned node_modules + the @rad/*
# workspace packages it imports) — copy that whole tree verbatim rather
# than hand-picking files, so a change in what gets traced doesn't silently
# go missing here. Static assets and public/ are not part of the trace and
# must be copied separately (this is standard Next.js standalone deploy).
COPY --from=builder /repo/apps/storefront/.next/standalone ./
COPY --from=builder /repo/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder /repo/apps/storefront/public ./apps/storefront/public
EXPOSE 3000
CMD ["node", "apps/storefront/server.js"]
