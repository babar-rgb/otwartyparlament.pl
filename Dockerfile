# Frontend Dockerfile
# Stage 1: Build
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# We need VITE_POSTGREST_URL and VITE_API_ANON_KEY at build time or runtime?
# Vite inlines env vars starting with VITE_ at build time.
# So we must provide ARG.
ARG VITE_POSTGREST_URL
ARG VITE_API_ANON_KEY
ENV VITE_POSTGREST_URL=$VITE_POSTGREST_URL
ENV VITE_API_ANON_KEY=$VITE_API_ANON_KEY
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
