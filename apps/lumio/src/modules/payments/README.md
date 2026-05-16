# Модуль Payments (lumio)

## Общее описание

Модуль **Payments** является частью микросервиса `lumio` и отвечает за управление подписками, платежами и автопродлением. Реализован с использованием паттерна CQRS для разделения операций чтения и записи. Взаимодействует с микросервисом `payments` через HTTP-адаптер для создания платежей и через RabbitMQ для обработки событий платежной системы.

### Основные возможности

- **Создание ссылки на оплату подписки** — генерация URL для оплаты через платежный шлюз (Stripe)
- **Информация о подписке пользователя** — получение деталей активной подписки
- **История платежей** — пагинированный список платежей пользователя
- **Управление автопродлением** — включение/отключение автопродления подписки
- **Обработка событий платежей** — получение и обработка событий `payment.completed`, `payment.recurring.completed`, `subscription.deleted` через RabbitMQ
- **Идемпотентная обработка сообщений** — защита от повторной обработки одного и того же события
- **Планировщик уведомлений** — оповещения о предстоящем списании и истечении подписки
- **DLQ-уведомления** — логирование сообщений, упавших в Dead Letter Queue

---

## Архитектура модуля

```
modules/payments/
├── api/
│   ├── dto/
│   │   ├── input/
│   │   │   ├── subscription-create.input.dto.ts
│   │   │   ├── change-autorenewal-subscription.input.dto.ts
│   │   │   ├── subscription-cancelled.input.dto.ts
│   │   │   ├── subscription-updated.input.dto.ts
│   │   │   └── get-user-payments.query.ts
│   │   ├── output/
│   │   │   ├── user-payment.output.dto.ts
│   │   │   └── user-subscription.output.dto.ts
│   │   └── transfer/
│   │       ├── payment-completed-event.dto.ts
│   │       ├── subscription-recurring-updated-event.dto.ts
│   │       └── subscription-deleted-event.dto.ts
│   ├── payments.controller.ts
│   └── payments-rabbitmq.controller.ts
├── application/
│   ├── commands/
│   │   ├── create-subscription.command-handler.ts
│   │   ├── handle-payment-completed.command-handler.ts
│   │   ├── handle-subscription-updated.command-handler.ts
│   │   ├── handle-subscription-deleted.command-handler.ts
│   │   └── change-autorenewal.command.handler.ts
│   ├── queries/
│   │   ├── get-user-payments.query-handler.ts
│   │   └── get-user-subscription.query-handler.ts
│   ├── payments-http.adapter.ts
│   ├── payments.scheduler.ts
│   ├── message-processing.service.ts
│   └── dlq-notification.service.ts
├── domain/
│   ├── entities/
│   │   └── subscription.entity.ts
│   └── infrastructure/
│       ├── subscription.repository.ts
│       └── idempotency-key.repository.ts
├── constants/
│   └── payments-constants.ts
└── payments.module.ts
```

---

## Модели данных (Prisma Schema)

### Subscription

| Поле             | Тип                   | Описание                                               |
| ---------------- | --------------------- | ------------------------------------------------------ |
| `id`             | `Int` (autoincrement) | Внутренний ID подписки                                 |
| `subscriptionId` | `String` (unique)     | Внешний ID подписки от платежной системы               |
| `durationType`   | `String`              | Тип длительности (1 week, 1 month, 1 year и т.д.)      |
| `startDate`      | `DateTime`            | Дата начала подписки                                   |
| `endDate`        | `DateTime`            | Дата окончания подписки                                |
| `autoRenewal`    | `Boolean`             | Флаг автопродления (по умолчанию `false`)              |
| `userProfileId`  | `Int` (unique)        | ID профиля пользователя (один профиль = одна подписка) |

**Связи:** `userProfile` → `UserProfileEntity`

---

## API Endpoints

### PaymentsController (`/api/v1/payments`)

| Метод | Путь               | Аутентификация | Описание                                               |
| ----- | ------------------ | -------------- | ------------------------------------------------------ |
| GET   | `/my-payments`     | JwtAuth        | Получение истории платежей пользователя (с пагинацией) |
| GET   | `/my-subscription` | JwtAuth        | Получение информации об активной подписке              |
| POST  | `/`                | JwtAuth        | Создание ссылки на оплату подписки                     |
| PATCH | `/autorenewal`     | JwtAuth        | Изменение статуса автопродления подписки               |

### PaymentsRabbitMQController (RabbitMQ Events)

| Routing Key                   | Описание                                                       |
| ----------------------------- | -------------------------------------------------------------- |
| `payment.completed`           | Обработка завершённого платежа (создание/обновление подписки)  |
| `payment.recurring.completed` | Обработка успешного рекуррентного платежа (продление подписки) |
| `subscription.deleted`        | Обработка удаления подписки                                    |

---

## CQRS — Команды (Commands)

Команды используются для операций записи и выполняются через `CommandBus`.

### 1. CreateSubscriptionPaymentUrlCommand

**Создание ссылки на оплату подписки.**

- **Вход:** `userId: number`, `dto: InputCreateSubscriptionPaymentUrlDto`
- **Поля DTO:**
  - `profileId: string` — ID профиля пользователя (numeric string)
  - `currency: string` — Валюта платежа
  - `subscriptionType: SubscriptionType` — Тип подписки (1 week, 2 weeks, 1 month, 3 months, 1 year)
  - `paymentProvider: string` — Платежный провайдер (Stripe)
- **Логика:**
  1. Проверка существования профиля пользователя через `ExternalQueryUserAccountsRepository`
  2. Вызов `PaymentsHttpAdapter.createPaymentUrl()` на микросервис `payments`
- **Результат:** `{ url: string }` — URL для редиректа на страницу оплаты

### 2. HandlePaymentCompletedCommand

**Обработка события успешного платежа.** Вызывается из RabbitMQ при получении `payment.completed`.

- **Вход:** `data: PaymentCompletedEvent`
- **Payload:** `profileId`, `subscriptionId`, `subscriptionType`, `periodStart`, `periodEnd`
- **Логика:**
  1. Проверка существования профиля пользователя
  2. Транзакция Prisma:
     - Если у профиля уже есть подписка — обновление `durationType`, `endDate`, `subscriptionId`
     - Если подписки нет — создание новой с `autoRenewal: true`
     - Обновление `accountType` профиля на `Business`
  3. Отправка уведомления пользователю об активации подписки
- **Результат:** `void`

### 3. HandleSubscriptionRecurringUpdatedCommand

**Обработка события рекуррентного продления подписки.** Вызывается из RabbitMQ при получении `payment.recurring.completed`.

- **Вход:** `data: SubscriptionRecurringUpdatedEvent`
- **Payload:** `profileId`, `subscriptionId`, `subscriptionType`, `nextPaymentDate`
- **Логика:**
  1. Поиск существующей подписки по `profileId`
  2. Если подписка не найдена — выход без ошибки (graceful handling)
  3. Обновление подписки: `durationType`, `endDate` (nextPaymentDate), `subscriptionId`
- **Результат:** `void`

### 4. HandleSubscriptionDeletedCommand

**Обработка события удаления подписки.** Вызывается из RabbitMQ при получении `subscription.deleted`.

- **Вход:** `data: SubscriptionDeletedEvent`
- **Payload:** `profileId`, `subscriptionId`
- **Логика:**
  1. Поиск подписки по `profileId`
  2. Если подписка не найдена — выход без ошибки
  3. Транзакция Prisma:
     - Удаление записи подписки из БД
     - Обновление `accountType` профиля на `Personal`
- **Результат:** `void`

### 5. ChangeAutoRenewalCommand

**Изменение статуса автопродления подписки.**

- **Вход:** `userId: number`, `dto: InputChangeAutorenewalSubscriptionDto`
- **Поля DTO:**
  - `profileId: string` — ID профиля (numeric string)
  - `autoRenewal: boolean` — Новый статус автопродления
- **Логика:**
  1. Проверка существования профиля по `profileId`
  2. Проверка, что профиль принадлежит текущему пользователю (`ForbiddenDomainException`)
  3. Проверка наличия активной подписки у профиля (`NotFoundDomainException`)
  4. Вызов `PaymentsHttpAdapter.updateAutoRenewal()` на микросервис `payments`
  5. Обновление поля `autoRenewal` в локальной БД через `SubscriptionRepository`
- **Результат:** `void`

---

## CQRS — Запросы (Queries)

Запросы используются для операций чтения и выполняются через `QueryBus`.

### 1. GetUserPaymentsQuery

**Получение истории платежей пользователя.**

- **Вход:** `userId: number`, `query: GetUserPaymentsParams`
- **Параметры запроса:**
  - `pageNumber`, `pageSize` (от `BaseSortablePaginationParams`)
  - `sortBy: PaymentsSortBy` (по умолчанию `createdAt`)
- **Логика:**
  1. Получение профиля пользователя через `ExternalQueryUserAccountsRepository`
  2. Вызов `PaymentsHttpAdapter.findAllUserProfilePayments()` на микросервис `payments`
  3. Маппинг ответа через `PaymentViewDto.mapManyToView()`
- **Результат:** `PaginatedViewDto<PaymentViewDto[]>`

### 2. GetUserSubscriptionQuery

**Получение активной подписки пользователя.**

- **Вход:** `userId: number`
- **Логика:**
  1. Получение профиля пользователя
  2. Поиск подписки по `profileId` через `SubscriptionRepository`
  3. Если подписка не найдена — `NotFoundDomainException`
- **Результат:** `OutputUserSubscriptionDto`

---

## DTO — Входные данные (Input)

### InputCreateSubscriptionPaymentDto

| Поле               | Тип                | Валидация                                     | Описание                |
| ------------------ | ------------------ | --------------------------------------------- | ----------------------- |
| `profileId`        | `string`           | `@IsString`, `@IsNumberString`, `@IsNotEmpty` | ID профиля пользователя |
| `currency`         | `string`           | `@IsString`, `@IsNotEmpty`                    | Валюта (например, USD)  |
| `subscriptionType` | `SubscriptionType` | `@IsEnum`                                     | Тип подписки (enum)     |
| `paymentProvider`  | `string`           | `@IsString`, `@IsNotEmpty`                    | Платежный провайдер     |

### InputChangeAutorenewalSubscriptionDto

| Поле          | Тип       | Валидация                        | Описание                    |
| ------------- | --------- | -------------------------------- | --------------------------- |
| `profileId`   | `string`  | `@IsNumberString`, `@IsNotEmpty` | ID профиля (numeric string) |
| `autoRenewal` | `boolean` | `@IsBoolean`, `@IsNotEmpty`      | Статус автопродления        |

### GetUserPaymentsParams (extends BaseSortablePaginationParams)

| Поле                     | Тип                            | По умолчанию | Описание            |
| ------------------------ | ------------------------------ | ------------ | ------------------- |
| `sortBy`                 | `PaymentsSortBy`               | `createdAt`  | Поле для сортировки |
| `pageNumber`, `pageSize` | наследуется из базового класса |

### InputSubscriptionCancelledDto

| Поле            | Тип      | Описание                                   |
| --------------- | -------- | ------------------------------------------ |
| `id`            | `number` | ID события                                 |
| `aggregateId`   | `number` | ID агрегата                                |
| `aggregateType` | `string` | Тип агрегата                               |
| `eventType`     | `string` | Тип события                                |
| `payload`       | `object` | `paymentId`, `subscriptionId`, `timestamp` |
| `timestamp`     | `Date`   | Временная метка                            |

### InputSubscriptionUpdatedDto

| Поле            | Тип      | Описание                                                                                                              |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`            | `number` | ID события                                                                                                            |
| `aggregateId`   | `number` | ID агрегата                                                                                                           |
| `aggregateType` | `string` | Тип агрегата                                                                                                          |
| `eventType`     | `string` | Тип события                                                                                                           |
| `payload`       | `object` | `paymentId`, `createdAt`, `amount`, `subscriptionId`, `subscriptionType`, `periodEnd`, `nextPaymentDate`, `timestamp` |
| `timestamp`     | `Date`   | Временная метка                                                                                                       |

---

## DTO — Выходные данные (Output)

### OutputUserSubscriptionDto

| Поле              | Тип       | Описание                                      |
| ----------------- | --------- | --------------------------------------------- |
| `id`              | `string`  | Внешний ID подписки от платежной системы      |
| `accountType`     | `string`  | Тип аккаунта (всегда `Business` при подписке) |
| `durationType`    | `string`  | Тип длительности подписки                     |
| `endDate`         | `Date`    | Дата окончания подписки                       |
| `nextPaymentDate` | `Date`    | Дата следующего платежа (равна endDate)       |
| `autoRenewal`     | `boolean` | Статус автопродления                          |

### PaymentViewDto

| Поле               | Тип      | Описание                           |
| ------------------ | -------- | ---------------------------------- | ------------------------------ |
| `datePayment`      | `string` | Дата платежа                       |
| `endDate`          | `string` | Дата окончания оплаченного периода |
| `amount`           | `number` | Сумма платежа                      |
| `currency`         | `string` | Валюта                             |
| `paymentType`      | `string` | Тип/сервис платежа                 |
| `subscriptionType` | `string  | null`                              | Тип подписки на момент платежа |

**Методы:** `mapToView()` / `mapManyToView()` — маппинг из ответа микросервиса `payments`.

---

## DTO — Трансферные события (Transfer)

### PaymentCompletedEvent

Трансферный DTO для события `payment.completed` из RabbitMQ.

| Поле            | Тип                               | Описание                                                                                       |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`            | `number`                          | ID события                                                                                     |
| `aggregateId`   | `number`                          | ID агрегата                                                                                    |
| `aggregateType` | `string`                          | Тип агрегата                                                                                   |
| `eventType`     | `string`                          | Тип события                                                                                    |
| `payload`       | `CreatePaymentCompleteMessageDto` | `profileId`, `subscriptionId`, `subscriptionType`, `periodStart`, `periodEnd`, `transactionId` |
| `timestamp`     | `Date`                            | Временная метка                                                                                |

### SubscriptionRecurringUpdatedEvent

Трансферный DTO для события `payment.recurring.completed` из RabbitMQ.

| Поле            | Тип                                  | Описание                                                             |
| --------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `id`            | `number`                             | ID события                                                           |
| `aggregateId`   | `number`                             | ID агрегата                                                          |
| `aggregateType` | `string`                             | Тип агрегата                                                         |
| `eventType`     | `string`                             | Тип события                                                          |
| `payload`       | `CreateSubscriptionUpdateMessageDto` | `profileId`, `subscriptionId`, `subscriptionType`, `nextPaymentDate` |
| `timestamp`     | `Date`                               | Временная метка                                                      |

### SubscriptionDeletedEvent

Трансферный DTO для события `subscription.deleted` из RabbitMQ.

| Поле            | Тип                                   | Описание                      |
| --------------- | ------------------------------------- | ----------------------------- |
| `id`            | `number`                              | ID события                    |
| `aggregateId`   | `string`                              | ID агрегата                   |
| `aggregateType` | `string`                              | Тип агрегата                  |
| `eventType`     | `string`                              | Тип события                   |
| `payload`       | `CreateSubscriptionDeletedMessageDto` | `profileId`, `subscriptionId` |
| `timestamp`     | `Date`                                | Временная метка               |

---

## Сервисы и адаптеры

### PaymentsHttpAdapter

HTTP-адаптер для синхронного взаимодействия с микросервисом `payments`. Использует `axios` для REST-запросов. Запросы аутентифицируются через `buildInternalApiHeaders()` с использованием `internalServiceName` и `internalApiKey`.

| Метод                          | Endpoint                                                 | Описание                           |
| ------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `createPaymentUrl()`           | `{paymentsFrontendUrl}/{endpoint}` (POST)                | Создание ссылки на оплату подписки |
| `updateAutoRenewal()`          | `{paymentsFrontendUrl}/{endpoint}` (PATCH)               | Обновление статуса автопродления   |
| `findAllUserProfilePayments()` | `{paymentsFrontendUrl}/{endpoint}` (GET, с query params) | Получение истории платежей профиля |

**Используемые endpoints микросервиса `payments`:**

- `POST /api/v1/subscription-payments/create-url`
- `PATCH /api/v1/subscription-payments/autorenewal`
- `GET /api/v1/subscription-payments/profile-payments`

---

### MessageProcessingService

Центральный сервис для идемпотентной обработки входящих RabbitMQ-сообщений с поддержкой повторных попыток и Dead Letter Queue.

| Параметр      | Значение по умолчанию | Описание                                  |
| ------------- | --------------------- | ----------------------------------------- |
| `MAX_RETRIES` | `3`                   | Максимальное количество повторных попыток |
| `TTL_SECONDS` | `86400` (24 часа)     | Время жизни ключа идемпотентности         |

**Алгоритм работы:**

1. Извлечение `messageId` из свойств сообщения или из `data._messageId`
2. Транзакция Prisma:
   - Проверка наличия ключа идемпотентности в БД (таблица `IdempotencyKey`)
   - Если ключ существует и не истёк — пропуск обработки (повторное сообщение)
   - Upsert ключа идемпотентности с TTL
   - Выполнение команды через `CommandBus.execute(command)`
3. Если успех — `channel.ack(originalMsg)`
4. Если ошибка:
   - До 3 попыток — `channel.nack(msg, false, true)` с инкрементом `x-retry-count`
   - После 3 попыток — `channel.nack(msg, false, false)` (DLQ) + уведомление через `DlqNotificationService`

---

### DlqNotificationService

Сервис логирования сообщений, попавших в Dead Letter Queue.

| Метод                | Описание                                                     |
| -------------------- | ------------------------------------------------------------ |
| `sendNotification()` | Логирование `messageId`, `routingKey`, `error`, `retryCount` |

В текущей реализации просто логирует через `AppLoggerService`.

---

### PaymentsScheduler

Планировщик задач на основе `@nestjs/schedule`, запускает проверки каждую минуту (`EVERY_MINUTE`).

| Метод                          | Cron         | Описание                                                                                     |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------- |
| `checkUpcomingPayments()`      | EVERY_MINUTE | Поиск подписок с автопродлением, истекающих через 24 часа, и отправка уведомлений            |
| `checkSubscriptionsExpiring()` | EVERY_MINUTE | Поиск подписок без автопродления, истекающих через 7 дней или 1 день, и отправка уведомлений |

**Логика `checkUpcomingPayments()`:**

1. Поиск подписок, где `autoRenewal = true` и `endDate` в диапазоне `[now, now + 24h]`
2. Для каждой подписки — отправка `createPaymentWarningNotification` через `NotificationsService`

**Логика `checkSubscriptionsExpiring()`:**

1. Поиск подписок, где `autoRenewal = false` и `endDate` в диапазоне `[now, now + 7 days]`
2. Для каждой — отправка `createSubscriptionExpiring7DaysNotification`
3. Поиск подписок, где `autoRenewal = false` и `endDate` в диапазоне `[now, now + 1 day]`
4. Для каждой — отправка `createSubscriptionExpiring1DayNotification`

---

## Репозитории (Infrastructure)

### SubscriptionRepository

Операции для подписок:

| Метод                                | Описание                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `createSubscription()`               | Создание подписки (с поддержкой транзакции)                                        |
| `findSubscriptionByProfileId()`      | Поиск подписки по ID профиля пользователя                                          |
| `updateSubscriptionWithNewPayment()` | Обновление подписки после нового платежа (с поддержкой транзакции)                 |
| `updateAutoRenewalById()`            | Обновление статуса автопродления                                                   |
| `deleteSubscription()`               | Удаление подписки (с поддержкой транзакции)                                        |
| `findSubscriptionsExpiring()`        | Поиск подписок, истекающих в заданном временном диапазоне (с учётом `autoRenewal`) |

### IdempotencyKeyRepository

Операции для ключей идемпотентности (таблица `IdempotencyKey`):

| Метод        | Описание                            |
| ------------ | ----------------------------------- |
| `findById()` | Поиск ключа по `messageId`          |
| `upsert()`   | Создание или обновление ключа с TTL |

---

## Константы

### AccountType

| Значение   | Описание                          |
| ---------- | --------------------------------- |
| `Business` | Аккаунт с активной подпиской      |
| `Personal` | Бесплатный аккаунт (без подписки) |

---

## SubscriptionEntity

Сущность подписки, реализующая интерфейс Prisma `Subscription`:

| Поле             | Тип                 | Описание                             |
| ---------------- | ------------------- | ------------------------------------ |
| `id`             | `number`            | Внутренний ID                        |
| `subscriptionId` | `string`            | Внешний ID от платежной системы      |
| `durationType`   | `string`            | Тип длительности подписки            |
| `startDate`      | `Date`              | Дата начала                          |
| `endDate`        | `Date`              | Дата окончания                       |
| `autoRenewal`    | `boolean`           | Автопродление (по умолчанию `false`) |
| `userProfileId`  | `number`            | ID профиля пользователя              |
| `userProfile`    | `UserProfileEntity` | Связанный профиль пользователя       |

---

## Модуль (PaymentsModule)

```typescript
@Module({
  imports: [
    UserAccountsModule,
    LoggerModule,
    CqrsModule,
    NotificationsModule,
    RabbitmqModule,
  ],
  controllers: [PaymentsController, PaymentsRabbitMQController],
  providers: [
    useCases, // Command handlers
    adapters, // PaymentsHttpAdapter
    repositories, // SubscriptionRepository, IdempotencyKeyRepository
    services, // DlqNotificationService, MessageProcessingService
    queryHandlers, // Query handlers
    schedulers, // PaymentsScheduler
  ],
})
export class PaymentsModule {}
```

**Зависимости:**

- `UserAccountsModule` — для работы с профилями пользователей
- `LoggerModule` — логирование
- `CqrsModule` — паттерн CQRS (CommandBus, QueryBus)
- `NotificationsModule` — отправка уведомлений пользователям
- `RabbitmqModule` — подключение к RabbitMQ для приёма событий

---

## Обработка ошибок

| Тип исключения              | Условие                                       | HTTP статус |
| --------------------------- | --------------------------------------------- | ----------- |
| `NotFoundDomainException`   | Профиль/подписка не найдены                   | 404         |
| `ForbiddenDomainException`  | Попытка изменить автопродление чужой подписки | 403         |
| `BadRequestDomainException` | Профиль пользователя не существует            | 400         |

---

## Ключевые особенности реализации

1. **CQRS** — все операции записи и чтения разделены на команды и запросы, выполняемые через `CommandBus` и `QueryBus`
2. **Идемпотентность** — `MessageProcessingService` предотвращает повторную обработку одного и того же RabbitMQ-сообщения через таблицу `IdempotencyKey` с TTL 24 часа
3. **Retry-механизм** — до 3 повторных попыток обработки сообщения при ошибке с инкрементом `x-retry-count`
4. **Dead Letter Queue** — после исчерпания попыток сообщение отклоняется без повторной постановки в очередь и логируется
5. **Транзакции Prisma** — создание/обновление подписки и обновление `accountType` профиля выполняются в единой транзакции
6. **Планировщик уведомлений** — запускается каждую минуту и проверяет приближающиеся даты списания/окончания подписки
7. **HTTP-прокси** — `PaymentsHttpAdapter` делегирует фактические платежные операции микросервису `payments` через внутренние API-запросы с аутентификацией
8. **Graceful handling** — при обработке событий `subscription.deleted` и `subscription.updated` отсутствие подписки не считается ошибкой
9. **Денормализация accountType** — тип аккаунта (`Business`/`Personal`) синхронизируется с подпиской через внешний репозиторий
10. **Swagger-документация** — эндпоинты декорированы Swagger-декораторами для автоматической генерации OpenAPI спецификации
