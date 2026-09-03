# Sciencepedia — image production, dùng cho VPS / Railway / Render / Fly.io.
#
# Lưu ý quan trọng: `next build` PHẢI kết nối được database, vì trang chủ,
# danh mục và 50 bài mới nhất được prerender ngay lúc build. Vì vậy các giá trị
# dưới đây được truyền vào bằng --build-arg / --secret, không phải runtime env.
#
#   docker build \
#     --build-arg DATABASE_URL="postgresql://...6543/postgres?pgbouncer=true&connection_limit=10" \
#     --build-arg NEXT_PUBLIC_SITE_URL="https://sciencepedia.vn" \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..." \
#     -t sciencepedia .

FROM node:22-alpine AS base
# openssl: Prisma query engine cần; libc6-compat: một số binary native cần
RUN apk add --no-cache libc6-compat openssl

# ---------------------------------------------------------------- deps
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# node:22-alpine đi kèm npm 10, nhưng package-lock.json ở repo do npm 12 sinh ra.
# npm 10 đọc lockfile đó sẽ báo "Missing: @swc/helpers from lock file" và dừng.
# Ghim đúng phiên bản npm đã tạo lockfile để `npm ci` cho ra cây phụ thuộc
# giống hệt môi trường phát triển.
RUN npm install -g npm@12.0.2 \
 && npm ci --no-audit --no-fund

# ---------------------------------------------------------------- builder
FROM base AS builder
WORKDIR /app

ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME="Sciencepedia"
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_OUTPUT_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# AUTH_SECRET giả chỉ để qua bước build; giá trị thật đưa vào lúc chạy
RUN AUTH_SECRET=build-time-placeholder-not-used-at-runtime \
    npx prisma generate && npm run build

# ---------------------------------------------------------------- runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
# standalone đã trace sẵn node_modules cần thiết, kể cả Prisma query engine
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# schema + migrations để chạy `prisma migrate deploy` từ chính container này
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
