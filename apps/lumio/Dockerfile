FROM node:20.17-alpine

ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

WORKDIR /app

# Копируем package.json и yarn.lock
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем весь проект
COPY . .

# Переходим в директорию сервиса lumio
WORKDIR /app/apps/lumio

# Генерируем Prisma клиент
RUN npx prisma generate --schema src/prisma/schema.prisma

# Собираем проект из корня
WORKDIR /app
RUN yarn build:${SERVICE}

USER node

EXPOSE ${PORT}

# Запускаем миграции и приложение из директории lumio
CMD ["sh", "-c", "cd /app/apps/lumio && echo 'Applying database migrations...' && npx prisma migrate deploy && echo 'Starting application...' && cd /app && node dist/apps/lumio/app/main"]