# Интеграция чата во фронтенд

Документ описывает фактический контракт микросервиса `chat`: загрузку истории и отправку сообщений через HTTP, а также получение обновлений через Socket.IO.

## Сначала важно: доступ к HTTP API

HTTP-контроллер чата сейчас является **внутренним API**. Он принимает запросы только от сервиса `lumio` и требует серверные заголовки:

- `x-internal-service: lumio`;
- `x-internal-api-key: <secret>`;
- `x-actor-user-id: <userId>`.

Фронтенд **не должен** отправлять эти заголовки и хранить `x-internal-api-key` в коде, `.env` сборки, localStorage или cookies. Любая переменная `VITE_*`, `NEXT_PUBLIC_*` или `REACT_APP_*` попадает пользователю. Кроме того, текущая CORS-конфигурация chat-сервиса не разрешает внутренние заголовки из браузера.

Безопасная схема должна быть такой:

```text
Browser
  ├─ HTTP + Authorization: Bearer <accessToken>
  │    → публичный API/BFF
  │    → chat REST API + внутренние заголовки
  │
  └─ Socket.IO + auth.token = <accessToken>
       → chat Socket.IO напрямую
```

> На момент написания в сервисе `lumio` нет публичных proxy-маршрутов к четырём операциям чата. До их появления браузер может безопасно подключиться к realtime, но не может напрямую загрузить историю, отправить сообщение или отметить его прочитанным. Примеры HTTP ниже предполагают, что backend уже выдал публичный URL/proxy с теми же маршрутами.

Backend должен получать `userId` из проверенного access token. Нельзя принимать `userId` текущего пользователя из body, query или пользовательского заголовка.

## Что поддерживается

- личный чат между двумя пользователями;
- текст до 500 символов;
- изображения JPEG, PNG, GIF и WebP до 1 МБ;
- голосовые MPEG, WAV, OGG и WebM до 3 МБ;
- история с cursor pagination;
- статус `SENT` / `READ`;
- realtime-события о новых и прочитанных сообщениях.

Сейчас нет публичного метода списка диалогов, удаления/редактирования сообщения и групповых чатов.

## Адреса и переменные окружения

Не хардкодьте адреса. Получите публичные URL у backend/devops и задайте их в окружении фронтенда:

```dotenv
# Публичный API или BFF, который проксирует HTTP-запросы в chat
VITE_CHAT_API_URL=https://<public-api-host>/api/v1

# Сам Socket.IO-сервер, без /api/v1 и без /chat
VITE_CHAT_SOCKET_URL=https://lumio.su
```

Для локального chat-сервиса обычно используется:

```dotenv
VITE_CHAT_SOCKET_URL=http://localhost:3004
```

Порт определяется переменной backend `PORT`, поэтому при отличающейся локальной конфигурации уточните его. Socket.IO работает в корневом namespace `/` и использует стандартный path `/socket.io`. В `io(...)` передавайте HTTP(S)-адрес: библиотека сама выполнит WebSocket upgrade.

Swagger chat-сервиса при включённой документации: `http://localhost:3004/api/v1/swagger`.

## Авторизация

Используется обычный access token Lumio, который возвращается после логина:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "..."
}
```

Ответ содержит `{ "accessToken": "..." }`, а refresh token хранится в `HttpOnly` cookie. Способ хранения access token должен соответствовать общей auth-архитектуре фронтенда.

- В публичные HTTP-запросы передавайте `Authorization: Bearer <accessToken>`.
- В Socket.IO передавайте токен через `auth.token`.
- Не передавайте токен в query string: он может попасть в логи и историю прокси.
- После refresh токена переподключите socket с новым access token.

## TypeScript-типы

```ts
export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE';
export type MessageStatus = 'SENT' | 'READ';

export interface ChatAttachment {
  id: string;
  type: 'IMAGE' | 'VOICE';
  url: string;
  mimeType: string;
  size: number; // bytes
  duration: number | null; // seconds, VOICE
  width: number | null; // pixels, IMAGE
  height: number | null; // pixels, IMAGE
  createdAt: string; // ISO 8601
}

export interface ChatMessage {
  id: string; // UUID
  chatId: number;
  senderId: number;
  content: string | null;
  type: MessageType;
  status: MessageStatus;
  readAt: string | null;
  createdAt: string;
  attachments: ChatAttachment[];
}

export interface ChatMessagesPage {
  items: ChatMessage[];
  nextCursor: string | null;
  totalCount: number;
  limit: number;
  currentCursor: string | null;
}

export interface RealtimeAttachment {
  url: string;
  key: string;
  mimeType: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
}

export interface RealtimeMessage {
  messageId: string;
  chatId: number;
  senderId?: number; // отсутствует в message:sent
  type?: 'IMAGE' | 'VOICE'; // отсутствует у TEXT
  content: string;
  attachment?: RealtimeAttachment;
  createdAt: string;
}

export interface ApiError {
  errorsMessages: Array<{
    message: string;
    field?: string | null;
  }>;
}
```

У ответа `POST /send-message` поле `attachments` сейчас может отсутствовать, хотя в истории оно всегда является массивом. Нормализуйте сообщение на границе API:

```ts
function normalizeMessage(
  message: Omit<ChatMessage, 'attachments'> & {
    attachments?: ChatAttachment[];
  },
): ChatMessage {
  return { ...message, attachments: message.attachments ?? [] };
}
```

## HTTP API

Все пути ниже добавляются к `VITE_CHAT_API_URL`. Публичный proxy должен принять bearer token, определить текущего пользователя и только на сервере добавить внутренние заголовки chat-сервиса.

### Общий HTTP-клиент

```ts
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL;

async function chatRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${CHAT_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      errorsMessages: [{ message: `HTTP ${response.status}` }],
    }))) as ApiError;

    throw Object.assign(new Error(error.errorsMessages[0]?.message), {
      status: response.status,
      details: error,
    });
  }

  return (await response.json()) as T;
}
```

Общий формат ошибки:

```json
{
  "errorsMessages": [
    {
      "message": "Cannot send message to yourself",
      "field": "recipientId"
    }
  ]
}
```

### Отправить текст

```http
POST /chats/send-message
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "recipientId": 12,
  "message": "Привет!"
}
```

- `recipientId`: положительное число;
- `message`: строка от 1 до 500 символов; пробелы по краям удаляются;
- отправка самому себе вернёт `400`;
- если личного чата ещё нет, он создаётся автоматически;
- успешный статус — `201`.

```ts
export async function sendTextMessage(
  recipientId: number,
  message: string,
  accessToken: string,
): Promise<ChatMessage> {
  const result = await chatRequest<ChatMessage>(
    '/chats/send-message',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, message }),
    },
  );

  return normalizeMessage(result);
}
```

### Отправить изображение

```ts
interface SendImageOptions {
  recipientId: number;
  file: File;
  text?: string;
  width?: number;
  height?: number;
}

export async function sendImage(input: SendImageOptions, accessToken: string) {
  const form = new FormData();
  form.append('file', input.file);
  form.append('recipientId', String(input.recipientId));
  form.append('type', 'IMAGE');

  if (input.text) form.append('text', input.text);
  if (input.width != null) form.append('width', String(input.width));
  if (input.height != null) form.append('height', String(input.height));

  return chatRequest<{
    message: ChatMessage;
    file: {
      id: string;
      url: string;
      key: string;
      size: number;
      mimeType: string;
      createdAt: string;
    };
  }>('/chats/send-media-message', accessToken, {
    method: 'POST',
    body: form,
  });
}
```

Разрешены `image/jpeg`, `image/png`, `image/gif`, `image/webp`, максимум 1 МБ. `text` — необязательная подпись до 500 символов.

> Не выставляйте `Content-Type: multipart/form-data` вручную. Браузер сам добавит корректный `boundary`.

### Отправить голосовое сообщение

```ts
export async function sendVoice(
  recipientId: number,
  file: File,
  durationSeconds: number | undefined,
  accessToken: string,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('recipientId', String(recipientId));
  form.append('type', 'VOICE');

  if (durationSeconds != null) {
    form.append('duration', String(Math.ceil(durationSeconds)));
  }

  return chatRequest<{ message: ChatMessage; file: unknown }>(
    '/chats/send-media-message',
    accessToken,
    { method: 'POST', body: form },
  );
}
```

Разрешены `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/webm`, максимум 3 МБ. Для `VOICE` нельзя передавать `text`, `width` или `height`.

Перед отправкой проверяйте реальный `file.type`: формат, который записывает `MediaRecorder`, зависит от браузера. Если браузер создал, например, неподдерживаемый MIME, backend вернёт `400`.

### Получить историю

```http
GET /chats/messages?recipientId=12&limit=20&cursor=<messageUuid>
Authorization: Bearer <accessToken>
```

- `recipientId` обязателен;
- `limit`: от 1 до 100, по умолчанию 20;
- первый запрос выполняется без `cursor`;
- для следующей страницы передайте `nextCursor` предыдущего ответа;
- `nextCursor: null` означает, что старых сообщений больше нет;
- сообщения приходят **от новых к старым** (`createdAt DESC`, затем `id DESC`);
- если диалог ещё не создан, придёт пустая страница с `200`.

```ts
export function getMessages(
  recipientId: number,
  accessToken: string,
  cursor?: string,
  limit = 20,
) {
  const query = new URLSearchParams({
    recipientId: String(recipientId),
    limit: String(limit),
  });

  if (cursor) query.set('cursor', cursor);

  return chatRequest<ChatMessagesPage>(`/chats/messages?${query}`, accessToken);
}
```

Для интерфейса с сообщениями снизу вверх можно развернуть `items` только для отображения. Курсор при этом берите из ответа backend, а не вычисляйте из развёрнутого массива.

### Отметить сообщение прочитанным

```http
POST /chats/messages/<messageId>/read
Authorization: Bearer <accessToken>
```

Успешный ответ (`201`):

```json
{
  "success": true,
  "message": "Message marked as read"
}
```

Отмечайте только входящие сообщения со статусом `SENT`, когда чат действительно открыт/видим. Свои сообщения отмечать нельзя. Повторный вызов для уже прочитанного сообщения сейчас возвращает `404`, поэтому на фронтенде его можно считать идемпотентным успехом только после проверки текста/контекста ошибки.

## Socket.IO realtime

Установите клиент версии 4:

```bash
npm install socket.io-client
```

Подключение:

```ts
import { io, Socket } from 'socket.io-client';

const CHAT_SOCKET_URL = import.meta.env.VITE_CHAT_SOCKET_URL;

export function createChatSocket(accessToken: string): Socket {
  return io(CHAT_SOCKET_URL, {
    autoConnect: false,
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
}
```

Подписывайте обработчики до `socket.connect()` и создавайте один socket на пользовательскую сессию, а не по одному на каждый компонент или диалог.

```ts
const socket = createChatSocket(accessToken);

socket.on('connection:established', ({ userId }: { userId: number }) => {
  console.info('Chat authenticated as', userId);
});

socket.on('message:received', (event: RealtimeMessage) => {
  // Входящее сообщение. Добавить по event.messageId, если его ещё нет.
  chatStore.upsertRealtime(event);
});

socket.on('message:sent', (event: RealtimeMessage) => {
  // Подтверждение отправителю. POST уже мог вернуть то же сообщение.
  chatStore.reconcileSent(event);
});

socket.on(
  'message:read',
  (event: {
    messageId: string;
    chatId: number;
    readerId: number;
    readAt: string;
  }) => {
    chatStore.markRead(event.messageId, event.readAt);
  },
);

socket.on('exception', (error) => {
  console.error('Chat socket event failed', error);
});

socket.on('connect_error', (error) => {
  console.error('Chat socket connection failed', error.message);
});

socket.on('disconnect', (reason) => {
  console.warn('Chat socket disconnected', reason);
});

socket.connect();
```

### События server → client

| Событие                  | Кому приходит             | Назначение                                                             |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------- |
| `connection:established` | текущему socket           | access token принят, содержит `userId`                                 |
| `message:received`       | получателю                | новое входящее текстовое или медиа-сообщение                           |
| `message:sent`           | отправителю               | подтверждение нового исходящего сообщения                              |
| `message:read`           | отправителю               | получатель прочитал сообщение                                          |
| `message:created`        | комнате `chat:{chatId}`   | событие нового сообщения для комнаты; сейчас на него нельзя полагаться |
| `user:typing`            | комнате `chat:{chatId}`   | typing indicator; сейчас практически не работает                       |
| `exception`              | socket, вызвавшему ошибку | ошибка обработчика клиентского события                                 |

Особенности realtime payload:

- поле идентификатора называется `messageId`, а в REST — `id`;
- у текстового realtime-события нет `type`; нормализуйте его в `TEXT`;
- в `message:sent` нет `senderId`; используйте ID текущего пользователя;
- realtime attachment содержит `key`, но не содержит DB-поля `id`, `type` и `createdAt`;
- даты сериализуются как ISO 8601 строки;
- один и тот же объект может прийти из HTTP-ответа и Socket.IO — всегда дедуплицируйте по ID сообщения.

### Обновление access token

```ts
export function reconnectChatWithToken(socket: Socket, accessToken: string) {
  socket.auth = { token: accessToken };
  socket.disconnect().connect();
}
```

При невалидном токене текущий gateway разрывает соединение без отдельного стабильного auth payload. Поэтому после неожиданного `disconnect` проверьте/обновите access token и переподключитесь. Не запускайте бесконечный reconnect при постоянном `401` auth-сервиса.

## Рекомендуемый поток экрана чата

1. Получить/восстановить access token.
2. Создать один Socket.IO client, подписать обработчики, вызвать `connect()`.
3. Дождаться `connection:established`.
4. Загрузить первую страницу истории по `recipientId`.
5. Нормализовать `attachments`, отобразить историю в хронологическом порядке.
6. Добавлять `message:received`, а `message:sent` объединять с результатом HTTP по `messageId`.
7. При прокрутке вверх загружать старые страницы через `nextCursor`.
8. При открытом окне отмечать видимые входящие `SENT` сообщения прочитанными.
9. После reconnect повторно запросить свежую страницу истории: Socket.IO не отдаёт пропущенные события.

Не ретрайте `POST send-message` автоматически: API пока не принимает idempotency key, поэтому повтор может создать дубликат. При неопределённом результате сначала обновите историю.

## Текущие ограничения backend, важные для фронтенда

1. **Нет публичного HTTP proxy/BFF.** Без него основной сценарий чата из браузера не завершён.
2. **Нет join/leave событий для `chat:{chatId}`.** Socket подключается только к комнате `user:{userId}`. Используйте `message:received`, `message:sent` и `message:read`; не полагайтесь на `message:created`.
3. **Typing indicator не готов.** Есть только клиентское событие `typing:stop`; `typing:start` отсутствует, а socket не вступает в комнату чата.
4. **Нет списка диалогов/unread count.** Историю можно запросить только по известному `recipientId`.
5. **Формы REST и realtime различаются.** Нужен слой нормализации, описанный выше.
6. **Повторный mark-read возвращает `404`.** Это нужно учитывать при параллельных вкладках/устройствах.

## Что запросить у backend перед приёмкой

- публичный base URL для четырёх HTTP-операций;
- подтверждение, что proxy принимает `Authorization: Bearer`, сам вычисляет actor user ID и проксирует multipart без потери файла;
- production Socket.IO URL/path;
- добавление origin вашего фронтенда в CORS Socket.IO (`FRONTEND_URL`);
- настроенный `LUMIO_SERVICE_URL` у chat-сервиса для проверки access token;
- решение по списку диалогов, unread count и typing indicator, если они входят в макет;
- проверку realtime при нескольких экземплярах chat-сервиса (общий Socket.IO adapter/sticky sessions).

## Быстрый чек-лист фронтенда

- [ ] В клиентской сборке нет internal API key.
- [ ] HTTP идёт через выданный public API/BFF.
- [ ] Socket.IO использует `auth.token` и root namespace.
- [ ] Есть нормализация REST/realtime моделей.
- [ ] Сообщения дедуплицируются по `id` / `messageId`.
- [ ] История учитывает сортировку от новых к старым.
- [ ] FormData отправляется без ручного `Content-Type`.
- [ ] После refresh токена socket переподключается.
- [ ] После reconnect история синхронизируется повторно.
- [ ] Автоматический retry отправки не создаёт дубликаты.
