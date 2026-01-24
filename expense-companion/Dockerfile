# Multi-stage build for expense-companion frontend
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org
ARG VITE_KEYCLOAK_REALM=expenses-monitor
ARG VITE_KEYCLOAK_CLIENT_ID=frontend
ARG VITE_API_BASE_URL=https://api.expmonitor.freeddns.org
ARG VITE_USE_MOCK_DATA=false
ARG VITE_SOURCEMAPS=false

# Set environment variables for build
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA
ENV VITE_SOURCEMAPS=$VITE_SOURCEMAPS

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine3.23 AS runtime

EXPOSE 80

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
