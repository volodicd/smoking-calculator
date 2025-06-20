FROM node:18-alpine as builder

WORKDIR /app

# Install required packages including OpenSSL
RUN apk add --no-cache \
    curl \
    openssl \
    openssl-dev \
    libc6-compat

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Install runtime dependencies including OpenSSL
RUN apk add --no-cache \
    curl \
    openssl \
    openssl-dev \
    libc6-compat

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm install --production

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create start script
RUN printf '#!/bin/sh\necho "Setting up database..."\nnpx prisma db push --accept-data-loss\necho "Starting application..."\nnpm start\n' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]