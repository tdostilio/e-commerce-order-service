FROM node:20-slim as development

# Install OpenSSL, procps and other dependencies
RUN apt-get update && apt-get install -y openssl procps

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN yarn prisma generate

# Copy source code
COPY . .

# Expose ports
EXPOSE 3001
EXPOSE 9229

# Use development command by default
CMD ["yarn", "start:debug"]

# Create a separate production build stage
FROM node:20-slim as production

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

# Install only production dependencies
RUN yarn install --production

COPY prisma ./prisma/
RUN yarn prisma generate

COPY . .
RUN yarn build

# Remove development files
RUN rm -rf src test

EXPOSE 3001

CMD ["yarn", "start:prod"]