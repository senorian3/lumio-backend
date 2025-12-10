FROM node:20.17-alpine

ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

USER node

# Правильная рабочая директория - корень проекта
WORKDIR /home/node/app

# Копируем зависимости
COPY --chown=node package*.json yarn.lock ./
COPY --chown=node apps/${SERVICE}/package.json ./apps/${SERVICE}/

RUN yarn install --frozen-lockfile

# Копируем весь код
COPY --chown=node . .

# Генерируем Prisma Client
RUN npx prisma generate --schema apps/${SERVICE}/src/prisma/schema.prisma

# Собираем приложение
RUN yarn build:${SERVICE}

EXPOSE ${PORT}

CMD yarn 'start:prod:lumio'
