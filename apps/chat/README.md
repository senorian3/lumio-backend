# Chat Microservice

Микросервис для управления чатами и сообщениями между пользователями.

## Структура базы данных

### Модели

#### Chat

- `id` - уникальный идентификатор
- `name` - название чата (опционально, для групповых чатов)
- `createdAt`, `updatedAt`, `deletedAt` - временные метки
- `lastMessageAt` - время последнего сообщения для сортировки

#### ChatParticipant

- `id` - уникальный идентификатор
- `chatId`, `userId` - ссылки на чат и пользователя
- `joinedAt`, `leftAt` - время входа/выхода из чата
- Уникальная пара `(chatId, userId)` - пользователь может быть в чате только один раз

#### Message

- `id` - UUID
- `chatId`, `senderId` - ссылки на чат и отправителя
- `content` - текстовое содержимое (только для типа TEXT)
- `type` - тип сообщения (TEXT, IMAGE, VOICE)
- `status` - статус доставки (SENT, DELIVERED, READ)
- `readAt` - время прочтения
- `createdAt`, `updatedAt`, `deletedAt` - временные метки

#### MessageAttachment

- `id` - UUID
- `messageId` - ссылка на сообщение
- `type` - тип вложения (IMAGE, VOICE)
- `url` - URL файла
- `mimeType`, `size` - метаданные файла
- `duration`, `width`, `height` - дополнительные метаданные для медиа

## Запуск

### Локальная разработка

1. Скопируйте файлы окружения:

```bash
cp .env.chat.example .env.chat.development
```

2. Запустите базу данных:

```bash
yarn docker:up:chat
```

3. Выполните миграции:

```bash
yarn prisma:dev:chat
```

4. Запустите микросервис:

```bash
yarn start:dev:chat
```

### Доступные скрипты

- `yarn start:dev:chat` - запуск в режиме разработки
- `yarn prisma:dev:chat` - выполнение миграций
- `yarn prisma:studio:chat` - запуск Prisma Studio
- `yarn test:unit:chat` - запуск unit тестов
- `yarn build:chat` - сборка проекта

## API Endpoints

### Чат

- `GET /chats` - получить все чаты пользователя
- `GET /chats/:id` - получить чат по ID
- `POST /chats` - создать новый чат
- `DELETE /chats/:id` - удалить чат

### Тестирование

- `GET /testing/health` - проверка здоровья сервиса

## Конфигурация

### Переменные окружения

| Переменная               | Описание                 | Пример                  |
| ------------------------ | ------------------------ | ----------------------- |
| `PORT`                   | Порт сервиса             | `3004`                  |
| `DATABASE_URL`           | URL базы данных          | `postgresql://...`      |
| `INTERNAL_API_KEY`       | Ключ для внутреннего API | `secret_key`            |
| `RABBITMQ_URL`           | URL RabbitMQ             | `amqp://localhost:5672` |
| `RABBITMQ_QUEUE`         | Очередь RabbitMQ         | `chat_queue`            |
| `IS_SWAGGER_ENABLED`     | Включить Swagger         | `true`                  |
| `INCLUDE_TESTING_MODULE` | Включить тестовый модуль | `true`                  |

## Интеграция

### RabbitMQ

Микросервис использует RabbitMQ для:

- Отправки уведомлений о новых сообщениях
- Синхронизации данных между микросервисами
- Обработки фоновых задач

### База данных

Используется PostgreSQL с Prisma ORM. Все таблицы включают поддержку soft delete через поле `deletedAt`.
