# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# NEXT_PUBLIC_API_ROOT is compiled into the browser bundle, so it is a build
# argument: the api's public URL, without a trailing slash.
ARG NEXT_PUBLIC_API_ROOT=http://localhost:4000
ENV NEXT_PUBLIC_API_ROOT=$NEXT_PUBLIC_API_ROOT
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# --- Production stage ---
FROM node:20-slim

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
