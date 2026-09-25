# API server image. Configuration comes from environment variables set by
# the host (see .env.example); no .env file is baked into the image.
#
# Run migrations as a release step before starting new containers:
#   docker run --rm --env-file .env <image> npm run migrate
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

USER node
EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:${PORT:-5050}/health || exit 1

CMD ["node", "server.js"]
