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

USER node

EXPOSE ${PORT}

CMD ["sh", "-c", "echo 'Applying database migrations...' && npx prisma migrate deploy && echo 'Starting application...' && node dist/apps/lumio/app/main"]