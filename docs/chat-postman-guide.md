# Chat service: Postman testing guide

Памятка для backend-разработчика, который подключается к проекту и должен быстро проверить полный flow чата: REST-запросы, Socket.IO события, текст, фото, voice, история и read status.

## 1. Что важно понять перед тестированием

Chat service работает в двух каналах:

- REST API создает сообщения, загружает media, возвращает историю и ставит read status.
- Socket.IO отдает realtime события: подключение, новые сообщения, typing, read status.

REST endpoints чата являются internal endpoints. Они не принимают пользовательский Bearer token напрямую. Вместо этого вызывающий сервис должен передать:

```text
x-internal-api-key: <internal api key>
x-actor-user-id: <current user id>
```

`x-actor-user-id` - это текущий пользователь, от имени которого выполняется действие.

Socket.IO подключение, наоборот, использует access token пользователя. Chat service валидирует этот token через Lumio service.

## 2. Локальные сервисы и порты

Для полного flow нужны минимум три сервиса:

```bash
yarn start:dev:lumio
yarn start:dev:files
yarn start:dev:chat
```

Ожидаемые local URLs:

```text
Lumio API:      http://localhost:3000/api/v1
Files API:      http://localhost:3001/api/v1
Chat REST API:  http://localhost:3004/api/v1
Chat Socket.IO: ws://localhost:3004
Chat Swagger:   http://localhost:3004/api/v1/swagger
```

Если Swagger path отличается, проверь `apps/chat/src/core/settings/swagger.setup.ts`.

## 3. Postman environment

Создай environment, например `Lumio local chat`, и добавь переменные:

```text
lumioBaseUrl        http://localhost:3000/api/v1
filesBaseUrl        http://localhost:3001/api/v1
chatBaseUrl         http://localhost:3004/api/v1
chatSocketUrl       ws://localhost:3004
internalApiKey      internal-api-key

user1Id             1
user2Id             2
user1AccessToken
user2AccessToken

chatId
messageId
mediaMessageId
```

`internalApiKey` должен совпадать с `INTERNAL_API_KEY` в `.env` chat/files/lumio сервисов.

## 4. Получение access token

Socket.IO требует настоящий access token. Получи его через Lumio:

```http
POST {{lumioBaseUrl}}/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "user1@example.com",
  "password": "Password123"
}
```

Ответ:

```json
{
  "accessToken": "..."
}
```

Сохрани token в `user1AccessToken`. Повтори для второго пользователя и сохрани в `user2AccessToken`.

Если регистрация падает на SMTP timeout, это не ошибка chat service. Для локальной проверки можно использовать уже существующих пользователей или взять confirmation code из базы Lumio через Prisma Studio.

## 5. Проверка health

Для chat service:

```http
GET {{chatBaseUrl}}/testing/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "chat",
  "timestamp": "2026-04-26T..."
}
```

Если endpoint недоступен, проверь:

- запущен ли `yarn start:dev:chat`;
- совпадает ли `PORT=3004`;
- нет ли ошибок подключения к Postgres/RabbitMQ на старте.

## 6. Подключение Socket.IO в Postman

В Postman создай `New` -> `Socket.IO`.

Для пользователя 1:

```text
{{chatSocketUrl}}?token={{user1AccessToken}}
```

Для пользователя 2 открой второй Socket.IO request:

```text
{{chatSocketUrl}}?token={{user2AccessToken}}
```

Добавь listeners на события:

```text
connection:established
message:created
message:sent
message:received
message:read
user:typing
exception
connect_error
disconnect
```

После подключения должен прийти event:

```text
connection:established
```

Payload:

```json
{
  "userId": 1
}
```

Если socket сразу disconnect:

- token отсутствует или истек;
- Lumio service не запущен;
- Chat service не может сходить в `{{lumioBaseUrl}}/auth/me`;
- в Socket.IO request случайно выбран plain WebSocket вместо Socket.IO.

## 7. Отправка текстового сообщения

Request:

```http
POST {{chatBaseUrl}}/chats/send-message
Content-Type: application/json
x-internal-api-key: {{internalApiKey}}
x-actor-user-id: {{user1Id}}
```

Body:

```json
{
  "recipientId": {{user2Id}},
  "message": "Привет из Postman"
}
```

Ожидаемый ответ:

```json
{
  "id": "8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e",
  "chatId": 5,
  "senderId": 1,
  "content": "Привет из Postman",
  "type": "TEXT",
  "status": "SENT",
  "readAt": null,
  "createdAt": "2026-04-26T10:00:00.000Z",
  "attachments": []
}
```

Сохрани:

- `chatId` из ответа;
- `messageId` из `id`.

Нюанс realtime:

- отправитель получает `message:sent` в `user:{senderId}`;
- все участники, которые сделали `join:chat`, получают `message:created`;
- отдельный `message:received` для `TEXT` сейчас не отправляется.

## 8. Join chat room

После первого сообщения у тебя уже есть `chatId`. В обоих Socket.IO requests отправь event:

```text
join:chat
```

Payload:

```json
{
  "chatId": {{chatId}}
}
```

Ожидаемый ack:

```json
{
  "success": true,
  "chatId": 5
}
```

Если приходит `Forbidden: User is not a participant of this chat`, значит socket подключен не тем пользователем или `chatId` от другого диалога.

После `join:chat` отправь еще одно текстовое сообщение. Оба socket клиента, находящиеся в комнате, должны увидеть:

```text
message:created
```

Payload:

```json
{
  "messageId": "...",
  "chatId": 5,
  "senderId": 1,
  "content": "Привет из Postman",
  "createdAt": "2026-04-26T10:00:00.000Z"
}
```

## 9. Typing events

В socket пользователя 1 отправь:

```text
typing:start
```

Payload:

```json
{
  "chatId": {{chatId}}
}
```

Пользователь 2 должен получить:

```text
user:typing
```

Payload:

```json
{
  "userId": 1,
  "chatId": 5,
  "isTyping": true
}
```

Остановить typing:

```text
typing:stop
```

Payload:

```json
{
  "chatId": {{chatId}}
}
```

Ожидаемый event у второго пользователя:

```json
{
  "userId": 1,
  "chatId": 5,
  "isTyping": false
}
```

## 10. Отправка фото

Фото отправляется через media endpoint.

Request:

```http
POST {{chatBaseUrl}}/chats/send-media-message
x-internal-api-key: {{internalApiKey}}
x-actor-user-id: {{user1Id}}
```

Body type: `form-data`

```text
file        File    photo.jpg
recipientId Text    {{user2Id}}
type        Text    IMAGE
width       Text    1080
height      Text    720
text        Text    Фото из Postman
```

Allowed MIME:

```text
image/jpeg
image/png
image/gif
image/webp
```

Limit:

```text
1 MB
```

Ожидаемый ответ:

```json
{
  "message": {
    "id": "...",
    "chatId": 5,
    "senderId": 1,
    "content": "Фото из Postman",
    "type": "IMAGE",
    "status": "SENT",
    "attachments": [
      {
        "type": "IMAGE",
        "url": "https://...",
        "mimeType": "image/jpeg",
        "size": 12345,
        "width": 1080,
        "height": 720
      }
    ]
  },
  "file": {
    "id": "...",
    "url": "https://...",
    "key": "...",
    "size": 12345,
    "mimeType": "image/jpeg"
  }
}
```

Realtime events для фото:

- `message:sent` у отправителя;
- `message:received` у получателя;
- `message:created` у всех, кто сделал `join:chat`.

## 11. Отправка voice

Voice тоже отправляется через media endpoint.

Request:

```http
POST {{chatBaseUrl}}/chats/send-media-message
x-internal-api-key: {{internalApiKey}}
x-actor-user-id: {{user1Id}}
```

Body type: `form-data`

```text
file        File    voice.ogg
recipientId Text    {{user2Id}}
type        Text    VOICE
duration    Text    12
text        Text    optional caption
```

Allowed MIME:

```text
audio/mpeg
audio/wav
audio/ogg
audio/webm
```

Limit:

```text
3 MB
```

Ожидаемый ответ:

```json
{
  "message": {
    "id": "...",
    "chatId": 5,
    "senderId": 1,
    "content": "",
    "type": "VOICE",
    "status": "SENT",
    "attachments": [
      {
        "type": "VOICE",
        "url": "https://...",
        "mimeType": "audio/ogg",
        "size": 12345,
        "duration": 12
      }
    ]
  },
  "file": {
    "id": "...",
    "url": "https://...",
    "key": "...",
    "size": 12345,
    "mimeType": "audio/ogg"
  }
}
```

Realtime events такие же, как у фото:

- `message:sent`;
- `message:received`;
- `message:created`.

## 12. История сообщений

Request:

```http
GET {{chatBaseUrl}}/chats/messages?recipientId={{user2Id}}&page=1&limit=20
x-internal-api-key: {{internalApiKey}}
x-actor-user-id: {{user1Id}}
```

Ожидаемый ответ:

```json
{
  "total": 3,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "items": [
    {
      "id": "...",
      "chatId": 5,
      "senderId": 1,
      "content": "Привет из Postman",
      "type": "TEXT",
      "status": "SENT",
      "attachments": []
    }
  ]
}
```

Проверки:

- `TEXT` сообщения приходят без attachments;
- `IMAGE` и `VOICE` приходят с attachments;
- `page` начинается с `1`;
- `limit` максимум `100`;
- если chat еще не создан, ответ должен быть пустой pagination result, а не ошибка.

## 13. Mark as read

Read status должен ставить получатель, а не отправитель.

Request от имени пользователя 2:

```http
POST {{chatBaseUrl}}/chats/messages/{{messageId}}/read
x-internal-api-key: {{internalApiKey}}
x-actor-user-id: {{user2Id}}
```

Ожидаемый ответ:

```json
{
  "success": true,
  "message": "Message marked as read"
}
```

Realtime:

```text
message:read
```

Payload:

```json
{
  "messageId": "...",
  "chatId": 5,
  "readerId": 2,
  "readAt": "2026-04-26T10:00:00.000Z"
}
```

Проверки:

- отправитель получает `message:read` через `user:{senderId}`;
- участники комнаты получают `message:read` через `chat:{chatId}`;
- повторный read того же сообщения может вернуть ошибку `Message not found or already read`.

## 14. Leave chat room

В Socket.IO request отправь:

```text
leave:chat
```

Payload:

```json
{
  "chatId": {{chatId}}
}
```

Ожидаемый ack:

```json
{
  "success": true,
  "chatId": 5
}
```

После этого socket не должен получать `message:created` через `chat:{chatId}`. Но user-scoped события, например `message:received`, могут продолжать приходить.

## 15. Полный ручной checklist в Postman

Используй этот порядок для smoke-теста:

1. Запустить `lumio`, `files`, `chat`.
2. Получить `user1AccessToken` и `user2AccessToken`.
3. Открыть два Socket.IO подключения.
4. Убедиться, что оба получили `connection:established`.
5. Отправить `TEXT` от user1 к user2.
6. Сохранить `chatId` и `messageId`.
7. Сделать `join:chat` на обоих socket клиентах.
8. Отправить второй `TEXT` и проверить `message:created`.
9. Отправить `typing:start` и `typing:stop`.
10. Отправить `IMAGE` и проверить `message:received`.
11. Отправить `VOICE` и проверить `message:received`.
12. Получить историю и проверить attachments.
13. От имени user2 вызвать mark as read.
14. Проверить `message:read`.
15. Сделать `leave:chat` и убедиться, что room-scoped события больше не приходят.

## 16. Частые ошибки

### 401 Unauthorized в REST

Проверь headers:

```text
x-internal-api-key
x-actor-user-id
```

`x-internal-api-key` должен совпадать с env `INTERNAL_API_KEY`.

### Actor user id header is missing

Не передан:

```text
x-actor-user-id
```

REST chat не берет `userId` из body.

### Cannot send message to yourself

`x-actor-user-id` совпадает с `recipientId`.

### Media file is required

В Postman body должен быть именно `form-data`, поле файла должно называться:

```text
file
```

### Unsupported image type или Unsupported audio type

Postman отправляет MIME не из allowed list. Проверь расширение файла и detected content type.

### Image size exceeds 1 MB limit

Для `IMAGE` лимит 1 MB.

### Voice message size exceeds 3 MB limit

Для `VOICE` лимит 3 MB.

### Files service error

Chat service создает message только после успешной загрузки файла в Files service. Проверь:

- запущен ли `yarn start:dev:files`;
- совпадает ли `FILES_SERVICE_URL`, если он задан;
- совпадает ли `INTERNAL_API_KEY`;
- доступны ли S3 credentials/storage для files service.

### Socket disconnect immediately

Проверь:

- используется Socket.IO request, не WebSocket request;
- token передан как `?token=...`, auth token или `Authorization: Bearer ...`;
- Lumio service запущен;
- token не истек;
- endpoint `GET {{lumioBaseUrl}}/auth/me` работает с этим token.

### join:chat возвращает Forbidden

Пользователь из socket token не является участником chat. Обычно это значит:

- перепутаны `user1AccessToken` и `user2AccessToken`;
- используется `chatId` от другого диалога;
- сообщение создавалось с другим `x-actor-user-id`.

### Не приходит message:created

`message:created` приходит только в room `chat:{chatId}`. Нужно сначала отправить:

```text
join:chat
```

### Не приходит message:received для TEXT

Это текущее поведение сервиса: `message:received` отправляется для media messages (`IMAGE`, `VOICE`). Для `TEXT` проверяй `message:sent` и `message:created`.

## 17. Что проверять в коде при изменениях chat flow

Основные файлы:

```text
apps/chat/src/modules/chats/api/chats.controller.ts
apps/chat/src/modules/chats/api/chats.gateway.ts
apps/chat/src/modules/chats/application/commands/send-message.command-handler.ts
apps/chat/src/modules/chats/application/commands/send-media-message.command-handler.ts
apps/chat/src/modules/chats/application/commands/mark-message-read.command-handler.ts
apps/chat/src/modules/chats/application/queries/get-chat-messages.query-handler.ts
apps/chat/src/modules/chats/domain/infrastructure/chat.repository.ts
apps/chat/src/modules/chats/domain/infrastructure/chat-query.repository.ts
apps/chat/src/core/adapters/files-http.adapter.ts
apps/chat/src/core/adapters/lumio-auth-http.adapter.ts
```

Swagger decorators лежат отдельно:

```text
apps/chat/src/core/decorators/swagger/chats
```

DTO для входных данных:

```text
apps/chat/src/modules/chats/api/dto/input
```

Строковые поля должны использовать `@Trim()` там, где пробелы по краям не несут смысла.

## 18. Автотесты перед PR

Минимум для chat changes:

```bash
yarn test:unit:chat
yarn build:chat
```

Если менялись DTO, Swagger или controller:

```bash
yarn jest --selectProjects chat --runTestsByPath apps/chat/test/unit/modules/chats/api/chats.controller.spec.ts
```

Если менялись Socket.IO события:

```bash
yarn jest --selectProjects chat --runTestsByPath apps/chat/test/unit/modules/chats/api/chats.gateway.spec.ts
```

Если менялась загрузка media:

```bash
yarn jest --selectProjects chat --runTestsByPath apps/chat/test/unit/core/adapters/files-http.adapter.spec.ts
```

## 19. Быстрая Postman collection структура

Рекомендуемая структура коллекции:

```text
Lumio Chat Local
  00 Auth
    Login user 1
    Login user 2
    Me
  01 Chat REST
    Health
    Send text message
    Send image message
    Send voice message
    Get messages
    Mark message as read
  02 Chat Socket.IO
    User 1 socket
    User 2 socket
  03 Negative cases
    Missing internal api key
    Missing actor user id
    Message to yourself
    Invalid image MIME
    Oversized voice
```

Для REST requests добавь collection-level headers:

```text
x-internal-api-key: {{internalApiKey}}
```

`x-actor-user-id` лучше ставить на уровне каждого request, чтобы явно видеть, от чьего имени выполняется действие.
