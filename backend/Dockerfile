FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached across code-only changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
