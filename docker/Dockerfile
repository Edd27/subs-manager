# Base
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Build
FROM deps AS build
COPY . .
RUN npm run build

# Runtime
FROM base AS runtime
WORKDIR /app
COPY --from=build /app .
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]
