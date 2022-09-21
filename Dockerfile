# syntax=docker/dockerfile:1

FROM node:16.17.0
ENV NODE_ENV=production

WORKDIR "/app"
COPY . .
RUN npm install

CMD ["node", "src/push.js"]
