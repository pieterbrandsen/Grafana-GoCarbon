# syntax=docker/dockerfile:1

FROM node:16.16.0
ENV NODE_ENV=production

WORKDIR "/app"
COPY ./src/pushStats .
RUN npm install

CMD ["node", "index.js"]
