FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-timeout=600000 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
# Docker 連真實後端，必須走真實登入（mock 假 JWT 會被後端 JWT 過濾器擋下）
ARG VITE_USE_MOCK_AUTH=false
ENV VITE_USE_MOCK_AUTH=$VITE_USE_MOCK_AUTH
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]