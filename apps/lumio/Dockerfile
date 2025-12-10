FROM node:20.17-alpine

ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN npx prisma generate --schema apps/${SERVICE}/src/prisma/schema.prisma

RUN yarn build:${SERVICE}

USER node

EXPOSE ${PORT}

CMD yarn 'start:prod:lumio'