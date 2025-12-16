FROM node:20.17-alpine

ARG port=3001
ARG service=files
ENV SERVICE=$service
ENV PORT=$port

WORKDIR /home/node/app

COPY --chown=node package.json yarn.lock ./

RUN yarn install

COPY --chown=node . .

RUN npx prisma generate --schema apps/${SERVICE}/src/prisma/schema.prisma

RUN yarn build:${SERVICE}

USER node

EXPOSE ${PORT}

CMD ["node", "dist/apps/files/app/main"]
