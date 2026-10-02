ARG NODE_IMAGE=node:22-slim
FROM ${NODE_IMAGE} AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM ${NODE_IMAGE}
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data WEB_DIST=/app/web/dist
WORKDIR /app/server
COPY server/package*.json ./
RUN (npm ci --omit=dev) || (apt-get update && apt-get install -y --no-install-recommends python3 make g++ && npm ci --omit=dev --build-from-source && apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*)
COPY server/ ./
COPY --from=web /web/dist /app/web/dist
VOLUME /data
EXPOSE 8080
CMD ["node", "src/index.js"]
