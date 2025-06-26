# client/Dockerfile
FROM node:20.19.0 AS builder

WORKDIR /app
COPY . .

RUN yarn install
RUN yarn build

# Используем Nginx для serve
FROM nginx:stable-alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
