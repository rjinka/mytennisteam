# --- Stage 1: Base ---
# Use an official Node.js runtime as a parent image.
# Using alpine for a smaller image size.
FROM node:18-alpine AS base

# Set the working directory in the container.
WORKDIR /usr/src/app

# --- Stage 2: Dependencies ---
# Copy package.json and package-lock.json to leverage Docker cache
FROM base AS dependencies
COPY package*.json ./
# Use 'npm ci' for clean, reproducible installs in CI/CD environments
RUN npm ci --only=production

# --- Stage 3: Runtime ---
# Copy the production dependencies and the application code
FROM base AS runtime
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD [ "node", "server.js" ]
