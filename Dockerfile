# Development stage for hot reloading and debugging
FROM node:20-slim as development

# Install OpenSSL for Prisma and other essential dependencies
RUN apt-get update && apt-get install -y openssl

# Set working directory in container
WORKDIR /usr/src/app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json yarn.lock ./
RUN yarn install

# Copy and generate Prisma client
COPY prisma ./prisma/
RUN yarn prisma generate

# Copy the rest of the application code
COPY . .
RUN yarn build

# Expose API and debug ports
EXPOSE 3001
EXPOSE 9229

# Start app in debug mode for development
CMD ["yarn", "start:debug"]

# Production stage for minimal image size
FROM node:20-slim as production

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json yarn.lock ./
RUN yarn install --production

# Copy and generate Prisma client for production
COPY prisma ./prisma/
RUN yarn prisma generate

# Copy only the built assets from development stage
COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3001

# Start app in production mode
CMD ["node", "dist/main"] 