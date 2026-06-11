# Chats Module — Документация

## Обзор

Модуль **chats** микросервиса `chat` отвечает за обмен личными сообщениями между пользователями в реальном времени. Реализован на базе NestJS + CQRS + WebSocket (Socket.IO) и PostgreSQL (Prisma ORM).

### Основные возможности

- Отправка текстовых сообщений
- Отправка медиа-сообщений (изображения, голосовые)
- История сообщений с курсорной пагинацией
- Отметка сообщений как прочитанные
- Реалтайм-доставка через WebSocket
- Статус "печатает" (typing indicator)

---

## Архитектура модуля

Модуль организован по **Feature-Sliced Design** с CQRS-паттерном:

```
modules/chats/
├── api/                     # HTTP-слой (контроллеры, DTO)
│   ├── chats.controller.ts
│   ├── dto/input/              # Входные DTO
│   │   ├── send-message.input.dto.ts
│   │   ├── send-media-message.input.dto.ts
│   │   └── get-chat-messages.input.dto.ts
│   └── types/
│       └── authenticated-socket.type.ts
├── application/              # Use Cases (CQRS — команды, запросы, события)
│   ├── chats.gateway.ts         # WebSocket Gateway
│   ├── commands/
│   │   ├── send-message.command-handler.ts
│   │   ├── send-media-message.command-handler.ts
│   │   └── mark-message-read.command-handler.ts
│   ├── queries/
│   │   ├── get-chat-messages.query-handler.ts
│   │   └── get-chat-messages.query.ts
│   ├── events/
│   │   ├── message-created.event.ts
│   │   ├── media-message-created.event.ts
│   │   └── message-read.event.ts
│   └── types/
│       └── media-message-metadata.type.ts
├── domain/                    # Доменные типы и интерфейсы репозиториев
│   ├── message-types.enum.ts
│   ├── types/chat-message-with-attachments.type.ts
│   └── infrastructure/          # Репозитории (работа с БД)
│       ├── chat.repository.ts
│       └── chat-query.repository.ts
```

### Слои

| Слой               | Ответственность                                   |
| ------------------ | ------------------------------------------------- |
| **api**            | HTTP-контроллер, входные DTO, декораторы Swagger  |
| **application**    | CQRS-обработчики, WebSocket Gateway, события      |
| **domain**         | Перечисления (enum), типы, контракты репозиториев |
| **infrastructure** | Репозитории Prisma (реализация работы с БД)       |

---

## Схема базы данных (Prisma)

### Chat

```prisma
model Chat {
  id            Int               @id @default(autoincrement())
  name          String?           @db.VarChar(100)  // Для групповых чатов; null для личных
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  deletedAt     DateTime?
  lastMessageAt DateTime?         // Для сортировки списка чатов

  participants  ChatParticipant[]
  messages      Message[]

  @@index([deletedAt])
  @@index([lastMessageAt])
}
```

### ChatParticipant

```prisma
model ChatParticipant {
  id        Int       @id @default(autoincrement())
  chatId    Int
  chat      Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  userId    Int       // ID из микросервиса users
  joinedAt  DateTime  @default(now())
  leftAt    DateTime? // Выход из чата (мягкое удаление)

  @@unique([chatId, userId])    // Одна запись на пользователя
  @@index([userId])
}
```

### Message

```prisma
model Message {
  id          String        @id @default(uuid())
  chatId      Int
  chat        Chat          @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId    Int           // ID отправителя
  content     String?       @db.VarChar(2000)  // Текст (только для TEXT)
  type        MessageType   @default(TEXT)
  status      MessageStatus @default(SENT)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  readAt      DateTime?     // Время прочтения

  attachments MessageAttachment[]

  @@index([chatId, createdAt])   // Пагинация по истории
  @@index([senderId])
  @@index([deletedAt])
}
```

### MessageAttachment

```prisma
model MessageAttachment {
  id        String         @id @default(uuid())
  messageId String
  message   Message        @relation(fields: [messageId], references: [id], onDelete: Cascade)
  type      AttachmentType
  url       String         @db.VarChar(500)   // Путь к S3
  mimeType  String         @db.VarChar(100)
  size      Int                               // Размер в байтах
  duration  Int?                              // Секунды (голосовые)
  width     Int?                              // Пиксели (изображения)
  height    Int?                              // Пиксели (изображения)
  createdAt DateTime       @default(now())

  @@index([messageId])
}
```

### Enumы

```typescript
enum MessageType {
  TEXT,
  IMAGE,
  VOICE,
}
enum MessageStatus {
  SENT,
  READ,
}
enum AttachmentType {
  TEXT,
  IMAGE,
  VOICE,
}
```

---

## REST API

Базовый URL: `/chats`

Все эндпоинты защищены `InternalApiGuard`. Требуется валидный `x-internal-api-key` и `x-internal-service: lumio`.

### 1. Отправка текстового сообщения

**`POST /chats/send-message`**

- `x-actor-user-id` — ID отправителя (header)
- Body:

```json
{
  "recipientId": 12,
  "message": "hello"
}
```

- Валидация:
  - `recipientId` — number, positive
  - `message` — string, 1–500 символов, trim
- Бизнес-логика:
  - Запрещено отправлять сообщение самому себе
  - Если личный чат между пользователями не существует — создаётся
  - Сообщение сохраняется, обновляется `lastMessageAt` в чате
  - Публикуется событие `MessageCreatedEvent`

### 2. Отправка медиа-сообщения

**`POST /chats/send-media-message`**

- `x-actor-user-id` — ID отправителя (header)
- `multipart/form-data`:
  - `file` — файл (изображение до 1 MB / голосовое до 3 MB)
  - `recipientId` — number
  - `type` — `IMAGE` | `VOICE`
  - `text` — caption (опционально, только для IMAGE, макс 500 символов)
  - `width` / `height` — размеры изображения (опционально)
  - `duration` — длительность голосового (опционально, в секундах)

- Валидация:
  - Проверка типа файла по MIME (jpeg, png, gif, webp для IMAGE; mpeg, wav, ogg, webm для VOICE)
  - Ограничение размера: 1 MB для IMAGE, 3 MB для VOICE
  - Голосовые сообщения не могут содержать text, width, height
  - Изображения не могут содержать duration
- Бизнес-логика:
  - Файл загружается в микросервис `files` через `FilesHttpAdapter`
  - Если чата нет — создаётся
  - Сохраняется сообщение + attachment с метаданными файла
  - Публикуется событие `MediaMessageCreatedEvent`

### 3. Получение истории сообщений

**`GET /chats/messages?recipientId=12&cursor=<uuid>&limit=20`**

- `x-actor-user-id` — ID запрашивающего (header)
- Query params:
  - `recipientId` — ID собеседника (опционально, int >= 1)
  - `cursor` — UUID сообщения для курсорной пагинации (опционально)
  - `limit` — размер страницы (1–100, default 20)

- Ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "chatId": 5,
      "senderId": 77,
      "content": "hello",
      "type": "TEXT",
      "status": "SENT",
      "readAt": null,
      "createdAt": "2026-04-22T10:00:00.000Z",
      "attachments": []
    }
  ],
  "nextCursor": "uuid-or-null",
  "totalCount": 42,
  "limit": 20,
  "currentCursor": "uuid-or-null"
}
```

- Сортировка: по `createdAt DESC`, затем по `id DESC`
- Если чата между пользователями нет — возвращается пустой массив
- Проверяется, что пользователь является участником чата

### 4. Отметка сообщения как прочитанного

**`POST /chats/messages/:messageId/read`**

- `messageId` — UUID сообщения (path param)
- `x-actor-user-id` — ID читающего (header)

- Бизнес-логика:
  - Пользователь не может отметить своё сообщение как прочитанное
  - Сообщение должно быть в статусе `SENT`
  - Обновляется `status = READ`, устанавливается `readAt`
  - Публикуется событие `MessageReadEvent`
  - Если сообщение не найдено или уже прочитано — `404`

### 5. WebSocket документация (информационный эндпоинт)

**`GET /chats/docs/websocket`**

Возвращает описание WebSocket событий с примерами. Не требует аутентификации, но используется через InternalApiGuard.

---

## WebSocket (Socket.IO)

Gateway: `ChatsGateway`

Namespace: `/` (root)

Транспорты: `websocket`, `polling`

CORS: настраивается через `FRONTEND_URL`, по умолчанию `http://localhost:3000`

### Аутентификация

При подключении клиент должен передать access token любым из способов:

- `auth.token` в handshake
- `query.token` в URL
- `Authorization: Bearer <token>` в headers

Токен валидируется через `LumioAuthHttpAdapter` (запрос `GET /auth/me` в микросервис `lumio`).

### Комнаты (Rooms)

- `user:{userId}` — персональная комната пользователя (для уведомлений о новых сообщениях)
- `chat:{chatId}` — комната чата (для совместной активности)

### События (от сервера к клиенту)

| Событие                   | Payload                                                                 | Описание                                    |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| `connection:established`  | `{ userId }`                                                            | Подтверждение успешного подключения         |
| `message:created`         | `{ messageId, chatId, senderId, content, createdAt }`                   | Новое сообщение в чате (всем участникам)    |
| `message:created` (media) | `{ messageId, chatId, senderId, type, content, attachment, createdAt }` | Новое медиа-сообщение (всем участникам)     |
| `message:sent`            | `{ messageId, chatId, content, createdAt }`                             | Подтверждение отправки (только отправителю) |
| `message:received`        | `{ messageId, chatId, senderId, content, createdAt }`                   | Уведомление о получении (только получателю) |
| `message:read`            | `{ messageId, chatId, readerId, readAt }`                               | Сообщение прочитано                         |
| `user:typing`             | `{ userId, chatId, isTyping }`                                          | Индикатор печатания                         |
| `error`                   | `{ message }`                                                           | Ошибка (например, невалидный токен)         |

### События (от клиента к серверу)

| Событие       | Payload      | Описание                                             |
| ------------- | ------------ | ---------------------------------------------------- |
| `typing:stop` | `{ chatId }` | Пользователь перестал печатать (защищено WsJwtGuard) |

### WsJwtGuard

Проверяет, что сокет аутентифицирован (`client.data.userId` существует).

---

## CQRS: Команды, Запросы и События

### Команды (Command)

| Команда                   | Вход                                                | Обработчик                       | Результат           |
| ------------------------- | --------------------------------------------------- | -------------------------------- | ------------------- |
| `SendMessageCommand`      | `userId, recipientId, message`                      | `SendMessageCommandHandler`      | `Message` (created) |
| `SendMediaMessageCommand` | `userId, recipientId, type, file, text?, metadata?` | `SendMediaMessageCommandHandler` | `{ message, file }` |
| `MarkMessageReadCommand`  | `messageId, userId`                                 | `MarkMessageReadCommandHandler`  | `{ success: true }` |

### Запросы (Query)

| Запрос                 | Вход                                    | Обработчик                    | Результат                       |
| ---------------------- | --------------------------------------- | ----------------------------- | ------------------------------- |
| `GetChatMessagesQuery` | `userId, recipientId, cursorId?, limit` | `GetChatMessagesQueryHandler` | Пагинированный список сообщений |

### События (Event)

| Событие                    | Поля                                                                             | Назначение         |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------ |
| `MessageCreatedEvent`      | `chatId, messageId, senderId, recipientId, content, createdAt`                   | WebSocket рассылка |
| `MediaMessageCreatedEvent` | `chatId, messageId, senderId, recipientId, type, content, attachment, createdAt` | WebSocket рассылка |
| `MessageReadEvent`         | `messageId, chatId, readerId, senderId, readAt`                                  | WebSocket рассылка |

События публикуются через `EventBus` из `@nestjs/cqrs` и обрабатываются в `ChatsGateway.subscribeToEvents()`.

---

## Интеграция с другими микросервисами

### Микросервис `lumio` (Auth)

**Адаптер:** `LumioAuthHttpAdapter`

- Валидация access token: `GET {LUMIO_SERVICE_URL}/auth/me` с заголовком `Authorization: Bearer {token}`
- Возвращает `LumioAccessTokenContextDto` с полем `userId`

### Микросервис `files` (File Storage)

**Адаптер:** `FilesHttpAdapter`

- Загрузка файла: `POST {FILES_SERVICE_URL}/chat-files/upload` (multipart/form-data)
- Удаление файла: `DELETE {FILES_SERVICE_URL}/chat-files/{fileKey}`
- Валидация файлов (размер, MIME-тип) встроена в адаптер

Оба запроса используют `buildInternalApiHeaders()` для внутренней аутентификации.

---

## Репозитории

### ChatRepository

Работает с `PrismaService`. Основные методы:

| Метод                                      | Описание                                                    |
| ------------------------------------------ | ----------------------------------------------------------- |
| `findPrivateChatByUsers(userId1, userId2)` | Поиск личного чата между двумя пользователями               |
| `createPrivateChat(userId1, userId2)`      | Создание личного чата в транзакции                          |
| `createMessage(data)`                      | Создание сообщения + обновление `lastMessageAt`             |
| `isUserInChat(chatId, userId)`             | Проверка, является ли пользователь участником чата          |
| `findChatById(chatId)`                     | Поиск чата по ID                                            |
| `markMessageAsRead(messageId, userId)`     | Отметка сообщения прочитанным (в транзакции)                |
| `createMessageWithAttachment(data)`        | Создание сообщения с вложением + обновление `lastMessageAt` |
| `updateChatLastMessage(chatId, date)`      | Обновление времени последнего сообщения                     |

### ChatQueryRepository

Отдельный репозиторий для read-операций:

| Метод                                       | Описание                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| `getChatMessages(chatId, limit, cursorId?)` | Курсорная пагинация с сортировкой по `createdAt DESC, id DESC` |

---

## Обработка ошибок

### Исключения (Domain Exceptions)

Используются кастомные исключения из `@libs/core/exceptions/domain-exceptions`:

| Исключение                    | Код HTTP | Ситуация                                                          |
| ----------------------------- | -------- | ----------------------------------------------------------------- |
| `BadRequestDomainException`   | 400      | Невалидные данные, отправка самому себе, ошибки файлового сервиса |
| `NotFoundDomainException`     | 404      | Чат не найден, сообщение не найдено                               |
| `UnauthorizedDomainException` | 401      | Отсутствует/невалидный API-ключ, некорректный `x-actor-user-id`   |
| `WsException`                 | —        | WebSocket: неаутентифицированный сокет, пользователь не в чате    |

### Валидация DTO

Все входные DTO валидируются через `class-validator`:

- `@IsNumber`, `@IsString`, `@IsPositive`, `@Min`, `@Max`, `@MaxLength`, `@IsIn`, `@IsOptional`, `@ValidateIf`
- `@Trim` — удаление пробелов по краям
- `@Type(() => Number)` — трансформация query params из строки в число

---

## Конфигурация (CoreConfig)

Основные переменные окружения:

| Переменная               | Описание                               | Пример                           |
| ------------------------ | -------------------------------------- | -------------------------------- |
| `PORT`                   | Порт сервера                           | `3004`                           |
| `DATABASE_URL`           | URL подключения к PostgreSQL           | `postgresql://...`               |
| `NODE_ENV`               | Окружение                              | `development`                    |
| `IS_SWAGGER_ENABLED`     | Включение Swagger                      | `true`                           |
| `INTERNAL_API_KEY`       | API-ключ для сервиса chat              |                                  |
| `INTERNAL_SERVICE_NAME`  | Имя сервиса                            | `chat`                           |
| `INTERNAL_API_KEYS`      | JSON-объект ключей доверенных сервисов | `{"lumio": "...", "...": "..."}` |
| `INCLUDE_TESTING_MODULE` | Включение тестового модуля             | `false`                          |
| `FRONTEND_URL`           | URL фронтенда для CORS                 | `https://app.example.com`        |
| `FILES_SERVICE_URL`      | URL микросервиса files                 | `https://files.example.com`      |
| `LUMIO_SERVICE_URL`      | URL микросервиса lumio (auth)          | `https://lumio.example.com`      |

---

## Тестирование

- **Unit-тесты** находятся в `apps/chat/test/unit/modules/chats/`
- Покрытие: контроллеры, gateway, command-handlerы, query-handlerы, репозитории
- Используется `@nestjs/testing` с mocked-зависимостями и `DeepMocked` из `@testthem/jest`

---

## Безопасность

1. **Internal API Guard** — все HTTP эндпоинты доступны только для доверенных сервисов (lumio) через API-ключ
2. **WsJwtGuard** — WebSocket события защищены JWT-валидацией
3. **Валидация файлов** — проверка MIME-типов и размеров перед загрузкой в S3
4. **Проверка членства в чате** — пользователь не может читать/писать в чат, где он не участник
5. **Защита от отправки самому себе** — блокируется на уровне команды

---

## Для разработчика

### Быстрый старт

```bash
# Установка зависимостей (из корня монорепозитория)
yarn

# Генерация Prisma клиента
yarn prisma:generate:chat

# Применение миграций
yarn prisma:dev:chat

# Запуск микросервиса
yarn start:chat:dev
```
