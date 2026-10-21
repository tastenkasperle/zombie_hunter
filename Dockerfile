FROM node:20-slim

WORKDIR /app

# Install ca-certificates and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY src/ ./src/
COPY bin/ ./bin/

# Make sure bin is executable if linux binary is used
RUN chmod -R +x ./bin || true

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

ENTRYPOINT ["node", "src/mcp/server.mjs"]
