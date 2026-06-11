# Модуль Notifications (Уведомления)

Модуль уведомлений микросервиса **lumio** отвечает за создание, доставку и управление системными уведомлениями пользователей. Уведомления создаются в базе данных с отложенным выполнением (поле `executeAt`), после чего планировщик обрабатывает их и отправляет через WebSocket в реальном времени.

## Архитектура

```
notifications/
├── api/                                    # HTTP слой (контроллер)
│   ├── dto/
│   │   ├── input/                          # Входные DTO
│   │   │   ├── get-user-notifications.query.ts
│   │   │   └── mark-notifications-as-read.input.dto.ts
│   │   ├── output/                         # Выходные DTO
│   │   │   └── notification.output.dto.ts
│   │   └── transfer/                       # Внутренние DTO для передачи данных
│   │       ├── create-notification.transfer.dto.ts
│   │       └── subscription-active-notification.transfer.dto.ts
│   └── notifications.controller.ts
├── application/                            # Бизнес-логика
│   ├── commands/
│   │   ├── delete-notification.command.handler.ts
│   │   └── mark-notifications-as-read.command.handler.ts
│   ├── queries/
│   │   ├── get-unread-count.query-handler.ts
│   │   └── get-user-notifications.query-handler.ts
│   ├── notifications.gateway.ts            # WebSocket Gateway
│   ├── notifications.scheduler.ts          # Cron-задачи
│   └── notifications.service.ts            # Сервис создания уведомлений
├── constants/
│   └── notification-constants.ts           # Enum'ы типов и статусов
├── domain/
│   └── infrastructure/
│       ├── notifications.repository.ts     # Репозиторий (запись)
│       └── notifications.query-repository.ts # Query-репозиторий (чтение)
├── notifications.module.ts
├── README.md
└── (тесты в apps/lumio/test/unit/modules/notifications/)

core/decorators/swagger/notifications/       # Swagger-декораторы эндпоинтов
├── delete-notification.decorator.ts
├── get-notification-history.decorator.ts
├── get-unread-count.decorator.ts
├── mark-notifications-as-read.decorator.ts
└── websocket-docs.decorator.ts
```

## Типы уведомлений

| Тип                           | Назначение                           |
| ----------------------------- | ------------------------------------ |
| `SUBSCRIPTION_ACTIVE`         | Подписка активирована                |
| `SUBSCRIPTION_EXPIRING_1DAY`  | Подписка истекает через 1 день       |
| `SUBSCRIPTION_EXPIRING_7DAYS` | Подписка истекает через 7 дней       |
| `PAYMENT_WARNING`             | Предупреждение о предстоящем платеже |
| `USER_MESSAGE_SENT`           | Сообщение от другого пользователя    |

## Статусы уведомлений

| Статус    | Описание                                        |
| --------- | ----------------------------------------------- |
| `pending` | Ожидает отправки (ещё не наступило `executeAt`) |
| `sent`    | Успешно отправлено через WebSocket              |
| `failed`  | Ошибка отправки                                 |

## API Endpoints

> ⚠️ **Аутентификация**: Все эндпоинты защищены JWT Auth Guard (`JwtAuthGuard`).

### GET `notifications/websocket-docs`

Возвращает информацию о WebSocket соединении.

**Response:**

```json
{
  "message": "See Swagger description for WebSocket documentation",
  "websocket": {
    "namespace": "/notifications",
    "url": "wss://lumio.su/notifications"
  },
  "events": {
    "notification:new": {
      "title": "Подписка активирована",
      "message": "Ваша подписка активирована и действует до 14.04.2026"
    },
    "error": {
      "message": "Unauthorized: Missing token"
    }
  }
}
```

---

### GET `notifications/history`

Возвращает историю уведомлений пользователя с пагинацией (за последние 30 дней).

**Query Parameters:**

| Параметр        | Тип                   | По умолчанию | Описание                         |
| --------------- | --------------------- | ------------ | -------------------------------- |
| `pageNumber`    | `number`              | `1`          | Номер страницы                   |
| `pageSize`      | `number`              | `10`         | Количество элементов на странице |
| `sortBy`        | `NotificationsSortBy` | `createdAt`  | Поле сортировки                  |
| `sortDirection` | `SortDirection`       | `desc`       | Направление (`asc` / `desc`)     |

**Response:**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Подписка активирована",
      "message": "Ваша подписка активирована и действует до 14.04.2026",
      "isRead": false,
      "createdAt": "2026-03-14T10:30:00.000Z"
    }
  ],
  "totalCount": 42,
  "pagesCount": 5,
  "page": 1,
  "pageSize": 10,
  "unreadCount": 5
}
```

---

### GET `notifications/unread-count`

Возвращает количество непрочитанных уведомлений.

**Response:**

```json
{
  "unreadCount": 5
}
```

---

### PUT `notifications/mark-read`

Помечает указанные уведомления как прочитанные.

**Request Body:**

```json
{
  "notificationIds": [
    "a5107593-08c8-4669-8371-594fda24d71e",
    "5e3fc19c-97e9-45a1-995c-c5495298d481"
  ]
}
```

**Response:** `204 No Content`

---

### DELETE `notifications/:id`

Мягко удаляет уведомление (устанавливает `deletedAt`).

**Path Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | UUID уведомления |

**Response:** `204 No Content`

**Ошибки:**
| Статус | Описание |
|--------|----------|
| `404` | Уведомление не найдено |

## WebSocket Gateway

### Подключение

WebSocket сервер доступен по адресу:

- **Namespace:** `/notifications`
- **URL:** `wss://lumio.su/notifications`

### Аутентификация

Токен передаётся одним из способов:

1. **Auth handshake:** `{ auth: { token: "Bearer <JWT>" } }`
2. **Заголовок:** `Authorization: Bearer <JWT>`

### Валидация токена

Gateway проверяет:

- Наличие токена
- Валидность JWT (проверка подписи и срока)
- Наличие `userId` и `deviceId` в payload
- Существование активной сессии в БД
- Версию токена (`tokenVersion`)

### События

**Server → Client:**

```typescript
// Новое уведомление
socket.on('notification:new', (data: { title: string; message: string }) => {
  console.log(data.title, data.message);
});

// Ошибка
socket.on('error', (data: { message: string }) => {
  console.error(data.message);
});
```

## Планировщик (Scheduler)

### `processPendingNotifications()` — каждые 30 секунд

1. Выбирает до 100 pending-уведомлений, у которых `executeAt <= now()`
2. Отправляет их через WebSocket пользователю
3. Помечает как `sent` (или `failed` при ошибке)

### `cleanupOldNotifications()` — каждый день в 3:00

- Удаляет уведомления старше 31 дня из БД

## Сервис создания уведомлений (NotificationsService)

Методы сервиса, используемые другими модулями для создания уведомлений:

| Метод                                         | Аргументы                                | HTTP-код |
| --------------------------------------------- | ---------------------------------------- | -------- |
| `createSubscriptionActiveNotification`        | `dto: SubscriptionActiveNotificationDto` | 200      |
| `createPaymentWarningNotification`            | `userId, endDate`                        | 200      |
| `createSubscriptionExpiring1DayNotification`  | `userId, endDate`                        | 200      |
| `createSubscriptionExpiring7DaysNotification` | `userId, endDate`                        | 200      |
| `createUserSendMessageNotification`           | `userId, message, username`              | 200      |

**Особенность:** Уведомления создаются в БД со статусом `pending` и `executeAt`, а доставка происходит асинхронно через планировщик. Это гарантирует, что уведомление будет отправлено даже если пользователь не в сети в момент создания.

## CQRS

Модуль использует паттерн CQRS через `@nestjs/cqrs`:

### Commands

- **`DeleteNotificationCommand`** — мягкое удаление уведомления
- **`MarkNotificationsAsReadCommand`** — отметка о прочтении

### Queries

- **`GetUserNotificationsQuery`** — получение истории с пагинацией
- **`GetUnreadCountQuery`** — количество непрочитанных

## Prisma-модель

Модель `Notification` в Prisma-схеме:

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    Int
  type      String
  title     String   @db.VarChar(200)
  message   String   @db.VarChar(500)
  isRead    Boolean  @default(false)
  readAt    DateTime?
  status    String   @default("pending")
  executeAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

## Зависимости модуля

- **JwtModule** — для валидации WebSocket-токенов
- **UserAccountsModule** — для конфигурации access token secret

## Экспорты

Модуль экспортирует `NotificationsService`, позволяя другим модулям создавать уведомления.

## Тестирование

Unit-тесты расположены в `apps/lumio/test/unit/modules/notifications/`:

| Файл                                                                      | Описание                                |
| ------------------------------------------------------------------------- | --------------------------------------- |
| `application/commands/delete-notification.command.handler.spec.ts`        | Тест команды удаления                   |
| `application/commands/mark-notifications-as-read.command.handler.spec.ts` | Тест отметки прочитанными               |
| `application/notifications.gateway.spec.ts`                               | Тест WebSocket Gateway                  |
| `application/notifications.scheduler.spec.ts`                             | Тест планировщика                       |
| `application/notifications.service.spec.ts`                               | Тест сервиса создания уведомлений       |
| `application/queries/get-unread-count.query-handler.spec.ts`              | Тест получения количества непрочитанных |
| `application/queries/get-user-notifications.query-handler.spec.ts`        | Тест получения истории                  |
| `api/notifications.controller.spec.ts`                                    | Тест контроллера                        |
| `domain/infrastructure/notifications.repository.spec.ts`                  | Тест репозитория                        |
| `domain/infrastructure/notifications.query-repository.spec.ts`            | Тест query-репозитория                  |
