FROM oven/bun:1.1-slim as base
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
ENV NODE_ENV=production
RUN mkdir -p /app/data && chown -R bun:bun /app/data
RUN bun run build
USER bun
EXPOSE 3005
CMD ["bun", "run", "start"]
