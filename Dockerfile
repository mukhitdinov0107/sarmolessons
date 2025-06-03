FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Files required by pnpm install
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public and data directories
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

# Set the correct permissions
RUN chown -R nextjs:nodejs ./data
RUN chown -R nextjs:nodejs ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"
ENV NEXT_PUBLIC_APP_URL="https://sarmolessons-production.up.railway.app"

# Firebase Configuration
ENV NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCOE2Fya_KInxjVa9EzphKvMmXSf7n_oX8"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="sarmolessons.firebaseapp.com"
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="sarmolessons"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="sarmolessons.firebasestorage.app"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="906913633920"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="1:906913633920:web:198f70874ff15948b87865"
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-6ZGR2TDJ1Q"

CMD ["node", "server.js"] 