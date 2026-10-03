FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# Maintenance commands run from this dedicated image, not every web startup.
FROM dependencies AS maintenance
ENV NODE_ENV=production
COPY lib/server/database-config.cjs ./lib/server/database-config.cjs
COPY scripts ./scripts
COPY db ./db
USER node
CMD ["node", "scripts/migrate.cjs"]

# A running private resource for Coolify scheduled commands.
FROM maintenance AS attendance-scheduler
CMD ["node", "scripts/maintenance-host.cjs"]

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --gid 1001 fgc && useradd --uid 1001 --gid fgc --no-create-home fgc \
    && mkdir -p /app/.next /app/uploads && chown -R fgc:fgc /app
COPY --from=build --chown=fgc:fgc /app/.next/standalone ./
COPY --from=build --chown=fgc:fgc /app/.next/static ./.next/static
COPY --from=build --chown=fgc:fgc /app/public ./public
USER fgc
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

