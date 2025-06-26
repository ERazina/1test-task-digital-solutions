# server/Dockerfile
FROM node:20.19.0 AS builder

WORKDIR /app
COPY . .

RUN yarn install

EXPOSE 3000
CMD ["node", "index.js"]
