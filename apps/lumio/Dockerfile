FROM node:20.17-alpine

ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

WORKDIR /home/node/app

COPY --chown=node package.json yarn.lock ./
RUN yarn install

COPY --chown=node . .

RUN npx prisma generate --schema apps/${SERVICE}/src/prisma/schema.prisma
RUN yarn build:${SERVICE}

COPY --chown=node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

USER node

EXPOSE ${PORT}

ENTRYPOINT ["/home/node/app/entrypoint.sh"]