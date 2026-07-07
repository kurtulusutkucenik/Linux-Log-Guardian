FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
# Cache bust — dashboard_refresh.sh DASHBOARD_SRC_REV gonderir (src degisince rebuild)
ARG DASHBOARD_SRC_REV=unknown
ARG NEXT_PUBLIC_DASHBOARD_BUILD_REV=unknown
ENV NEXT_PUBLIC_DASHBOARD_BUILD_REV=${NEXT_PUBLIC_DASHBOARD_BUILD_REV}
RUN echo "dashboard src rev: ${DASHBOARD_SRC_REV} build: ${NEXT_PUBLIC_DASHBOARD_BUILD_REV}"
COPY src ./src
COPY public ./public
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs next-env.d.ts ./

RUN npx prisma generate
ENV NODE_ENV=production
RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --create-home nextjs

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma-schema/schema.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R nextjs:nodejs /app /home/nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
