# Модуль Subscriptions (Подписки)

## Обзор

Модуль `subscriptions` отвечает за управление подписками в микросервисе `payments`. Он обеспечивает полный цикл обработки платежей: от создания сессии оплаты через Stripe до обработки рекуррентных платежей, отмены подписки и синхронизации с основным микросервисом `lumio` через Outbox-паттерн.

## Структура модуля

```
subscriptions/
├── constants/                          # Константы
│   ├── outbox-constants.ts             # Статусы и типы Outbox-сообщений
│   └── stripe-constants.ts             # Конфигурация Stripe, статусы платежей
├── outbox/                             # Outbox-паттерн
│   ├── application/
│   │   ├── external-calls.processor.ts # Обработка внешних вызовов Stripe
│   │   ├── outbox.scheduler.ts         # Планировщик обработки сообщений
│   │   └── outbox.service.ts           # Сервис создания сообщений
│   └── domain/
│       └── outbox.repository.ts        # Репозиторий Outbox-сообщений
├── shared/
│   └── utils/
│       └── subscription-period.utils.ts # Утилиты расчёта периодов подписки
└── subscription-payments/               # Ядро модуля — управление платежами
    ├── api/
    │   ├── subscription-payments.controller.ts
    │   └── dto/
    │       ├── input/
    │       │   ├── input-create-subscription-payment-url.dto.ts
    │       │   ├── input-update-autorenewal.dto.ts
    │       │   └── get-all-payments.input.ts
    │       └── user-profile-payment.response.dto.ts
    ├── application/
    │   ├── commands/
    │   │   ├── create-payment.command-handler.ts
    │   │   ├── process-initial-payment.command-handler.ts
    │   │   ├── process-recurring-payment.command-handler.ts
    │   │   ├── process-subscription-deleted.command-handler.ts
    │   │   ├── change-subscription-autorenewal.command-handler.ts
    │   │   └── stripe-hook.command-handler.ts
    │   ├── queries/
    │   │   ├── get-all-payments.query-handler.ts
    │   │   └── get-user-profile-payments.query-handler.ts
    │   ├── stripe.adapter.ts
    │   ├── manual-review.service.ts
    │   └── retry.service.ts
    └── domain/
        ├── entities/
        │   └── payments.entity.ts
        ├── dto/
        │   ├── create-payment.domain.dto.ts
        │   └── update-payment.domain.dto.ts
        └── infrastructure/
            ├── payments.repository.ts
            └── payments.query-repository.ts
```

---

## 1. Constants (Константы)

### `outbox-constants.ts`

Определяет перечисления для Outbox-паттерна:

| Enum                  | Значения                             | Описание                                     |
| --------------------- | ------------------------------------ | -------------------------------------------- |
| `OutboxMessageStatus` | `PENDING`, `PROCESSING`, `COMPLETED` | Статусы Outbox-сообщения                     |
| `OutboxAggregateType` | `PAYMENT`, `SUBSCRIPTION`            | Тип агрегата, к которому относится сообщение |
| `OutboxEventType`     | См. таблицу ниже                     | Типы событий                                 |

**Типы событий (OutboxEventType):**

| Событие                                                   | Описание                                    |
| --------------------------------------------------------- | ------------------------------------------- |
| `PAYMENT_COMPLETED`                                       | Платёж завершён (первичный)                 |
| `PAYMENT_RECURRING_COMPLETED`                             | Рекуррентный платёж завершён                |
| `CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE`                  | Изменение автопродления в Stripe            |
| `UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_STRIPE`            | Обновление даты окончания подписки в Stripe |
| `UPDATE_SUBSCRIPTION_METADATA_STRIPE`                     | Обновление метаданных подписки в Stripe     |
| `CANCEL_SUBSCRIPTION_IMMEDIATELY_STRIPE`                  | Немедленная отмена подписки в Stripe        |
| `MANUAL_REVIEW_REQUIRED`                                  | Требуется ручная проверка (при ошибках)     |
| `FAILED_INITIAL_PAYMENT_PROCESSING`                       | Ошибка обработки первичного платежа         |
| `FAILED_RECURRING_PAYMENT_PROCESSING`                     | Ошибка обработки рекуррентного платежа      |
| `FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING`      | Ошибка изменения автопродления              |
| `FAILED_SUBSCRIPTION_DELETED_PROCESSING`                  | Ошибка при удалении подписки                |
| `FAILED_UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_PROCESSING` | Ошибка обновления даты окончания            |
| `FAILED_UPDATE_SUBSCRIPTION_METADATA_PROCESSING`          | Ошибка обновления метаданных                |
| `FAILED_CANCEL_SUBSCRIPTION_IMMEDIATELY_PROCESSING`       | Ошибка немедленной отмены                   |
| `SUBSCRIPTION_DELETED`                                    | Подписка удалена в Stripe                   |

### `stripe-constants.ts`

| Enum / Константа      | Описание                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `StripeEventType`     | Типы событий Stripe: `INVOICE_PAID`, `CHECKOUT_SESSION_COMPLETED`, `CUSTOMER_SUBSCRIPTION_DELETED` |
| `StripeBillingReason` | Причины биллинга: `SUBSCRIPTION_CREATE`, `SUBSCRIPTION_CYCLE`                                      |
| `PaymentStatus`       | Статусы платежа: `ACTIVE`, `CANCELLED`, `COMPLETED`, `EXTENSION`, `PENDING`                        |
| `subscriptionConfigs` | Конфигурация интервалов для каждого типа подписки (интервал и количество)                          |
| `SUBSCRIPTION_PRICES` | Цены для каждого типа подписки                                                                     |

**Типы подписок и цены:**

| Тип            | Цена   | Интервал        |
| -------------- | ------ | --------------- |
| `ONE_WEEK`     | $2.99  | Каждую неделю   |
| `TWO_WEEKS`    | $5.39  | Каждые 2 недели |
| `ONE_MONTH`    | $9.99  | Каждый месяц    |
| `THREE_MONTHS` | $23.99 | Каждые 3 месяца |
| `ONE_YEAR`     | $71.99 | Каждый год      |

---

## 2. Outbox-паттерн

Outbox-паттерн используется для гарантированной доставки событий в другие микросервисы (в первую очередь — `lumio`) и для выполнения операций в Stripe с возможностью повторных попыток.

### `outbox.repository.ts`

Репозиторий для работы с таблицей `OutboxMessage` в БД.

**Методы:**

| Метод                                     | Описание                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| `createOutboxMessage(data, tx?)`          | Создаёт новое Outbox-сообщение                         |
| `findPendingMessages(limit)`              | Находит ожидающие обработки сообщения (до 5 попыток)   |
| `markAsProcessing(messageId)`             | Помечает сообщение как обрабатываемое                  |
| `markAsCompleted(messageId, processedAt)` | Помечает сообщение как выполненное                     |
| `incrementRetryCount(messageId)`          | Увеличивает счётчик попыток и откладывает на 10 секунд |
| `cleanupExpiredMessages()`                | Удаляет сообщения с истёкшим TTL                       |

### `outbox.service.ts`

Сервис для создания Outbox-сообщений различных типов.

**Основные методы создания сообщений:**

| Метод                                                             | Событие                                        | Описание                     |
| ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| `createPaymentCompletedMessage(payload, tx?)`                     | `PAYMENT_COMPLETED`                            | Первичный платёж завершён    |
| `createSubscriptionUpdatedMessage(payload, tx?)`                  | `PAYMENT_RECURRING_COMPLETED`                  | Рекуррентный платёж завершён |
| `createChangeSubscriptionAutoRenewalStripe(id, autoRenewal, tx?)` | `CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE`       | Изменение автопродления      |
| `createSubscriptionDeletedMessage(payload, tx?)`                  | `SUBSCRIPTION_DELETED`                         | Подписка удалена             |
| `updateCustomerSubscriptionEndDateMessage(payload, tx?)`          | `UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_STRIPE` | Обновление даты окончания    |
| `createCancelSubscriptionImmediatelyMessage(payload, tx?)`        | `CANCEL_SUBSCRIPTION_IMMEDIATELY_STRIPE`       | Немедленная отмена           |
| `updateSubscriptionMetadataMessage(payload, tx?)`                 | `UPDATE_SUBSCRIPTION_METADATA_STRIPE`          | Обновление метаданных        |
| `createManualReviewTask(payload, aggregateId, aggregateType)`     | `MANUAL_REVIEW_REQUIRED`                       | Ручная проверка              |

**Приватные методы (создание сообщений об ошибках):**

- `createFailedInitialPaymentProcessingMessage`
- `createFailedRecurringPaymentCompleteMessage`
- `createFailedSubscriptionChangeAutoRenewalStripe`
- `createFailedSubscriptionDeletedMessage`
- `createFailedUpdateCustomerSubscriptionEndDateMessage`
- `createFailedCancelSubscriptionImmediatelyMessage`
- `createFailedUpdateSubscriptionMetadataMessage`

Каждый метод `create*Message` имеет встроенный механизм отказоустойчивости: при ошибке создания основного сообщения автоматически создаётся сообщение об ошибке соответствующего типа.

### `outbox.scheduler.ts`

Планировщик, который обрабатывает Outbox-сообщения по расписанию.

**Cron-задачи:**

| Cron-выражение  | Метод                             | Описание                                                |
| --------------- | --------------------------------- | ------------------------------------------------------- |
| Каждые 5 секунд | `processOutboxMessages()`         | Выбирает до 100 ожидающих сообщений и обрабатывает их   |
| Каждые 10 минут | `cleanupExpiredPendingPayments()` | Удаляет просроченные Pending-платежи (старше 61 минуты) |
| Каждый час      | `cleanupExpiredMessages()`        | Удаляет Outbox-сообщения с истёкшим TTL                 |

**Логика обработки сообщений:**

1. Выбираются сообщения со статусом `PENDING`, у которых наступило время `scheduledAt` и количество попыток < 5
2. Сообщение помечается как `PROCESSING`
3. В зависимости от `eventType`:
   - **Stripe-операции** → `ExternalCallsProcessor` (выполнение в Stripe через API)
   - **Уведомления для lumio** → `sendMessageToLumio()` (отправка через RabbitMQ)
   - **Ошибки/ручная проверка** → обработка в `ExternalCallsProcessor`
4. При успехе → помечается `COMPLETED`
5. При неудаче → увеличивается `retryCount`, сообщение откладывается на повтор

**Routing keys для RabbitMQ:**

| Событие                       | Routing Key                   |
| ----------------------------- | ----------------------------- |
| `PAYMENT_COMPLETED`           | `payment.completed`           |
| `PAYMENT_RECURRING_COMPLETED` | `payment.recurring.completed` |
| `SUBSCRIPTION_DELETED`        | `subscription.deleted`        |

### `external-calls.processor.ts`

Обработчик внешних вызовов. Выполняет операции в Stripe на основе Outbox-сообщений.

| Метод                                                 | Описание                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `processChangeSubscriptionAutoRenewal(message)`       | Изменяет `cancel_at_period_end` в Stripe                                  |
| `processFailedInitialPayment(message)`                | Логика обработки неудачного первичного платежа                            |
| `processFailedRecurringPayment(message)`              | Логика обработки неудачного рекуррентного платежа                         |
| `processFailedSubscriptionChangeAutoRenewal(message)` | Логика обработки ошибки изменения автопродления                           |
| `processFailedSubscriptionDeleted(message)`           | Логика обработки ошибки удаления подписки                                 |
| `processManualReviewRequired(message)`                | Создание задачи для ручной проверки                                       |
| `processUpdateCustomerSubscriptionEndDate(message)`   | Обновление даты окончания подписки в Stripe через trial_end или cancel_at |
| `processCancelSubscriptionImmediately(message)`       | Немедленная отмена подписки в Stripe                                      |
| `processUpdateSubscriptionMetadata(message)`          | Обновление метаданных подписки в Stripe                                   |

---

## 3. Shared Utils

### `subscription-period.utils.ts`

Утилиты для расчёта периодов подписки.

| Метод                                                             | Описание                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `calculatePeriodDuration(subscriptionType)`                       | Возвращает длительность периода в мс                                 |
| `calculatePeriodEnd(startDate, subscriptionType, extraTime?)`     | Рассчитывает дату окончания периода с учётом дополнительного времени |
| `calculateNextPaymentDate(currentPeriodEnd, subscriptionType)`    | Рассчитывает дату следующего платежа                                 |
| `calculatePeriodDates(periodStart, subscriptionType, extraTime?)` | Возвращает объект `{ periodStart, periodEnd }`                       |

**Поддерживаемые типы подписок:**

- `week` / `2week` / `two week` → 7 / 14 дней
- `month` / `3month` / `three month` → 30 / 90 дней
- `year` → 365 дней

---

## 4. Subscription Payments (Ядро модуля)

### 4.1 API (Controllers)

#### `subscription-payments.controller.ts`

**Базовый путь:** `SUBSCRIPTION_PAYMENTS_BASE` (конфигурируется в routes)

| Endpoint             | HTTP  | Guard                                   | Описание                              |
| -------------------- | ----- | --------------------------------------- | ------------------------------------- |
| `PROFILE_PAYMENTS`   | GET   | `InternalApiGuard` (lumio, super-admin) | Получить платежи профиля с пагинацией |
| `SUCCESS`            | GET   | —                                       | Страница успешного платежа            |
| `ERROR`              | GET   | —                                       | Страница ошибки платежа               |
| `CREATE_PAYMENT_URL` | POST  | `InternalApiGuard` (lumio)              | Создать URL для оплаты подписки       |
| `STRIPE_HOOK`        | POST  | `StripeWebhookGuard`                    | Webhook от Stripe                     |
| `CHANGE_AUTORENEWAL` | PATCH | `InternalApiGuard` (lumio)              | Изменить автопродление подписки       |
| `ALL_PAYMENTS`       | GET   | `InternalApiGuard` (super-admin)        | Получить все платежи (админка)        |

### 4.2 DTOs

#### Input DTOs

**`InputCreateSubscriptionPaymentUrlDto`** — создание URL оплаты:

- `profileId: string` (number string) — ID профиля
- `currency: string` — валюта
- `subscriptionType: SubscriptionType` — тип подписки
- `paymentProvider: string` — провайдер платежей

**`InputChangeAutorenewalSubscriptionPaymentDto`** — изменение автопродления:

- `profileId: string` (number string)
- `autoRenewal: boolean`
- `subscriptionId: string`

**`GetAllPaymentsQueryDto`** — пагинация и фильтрация платежей:

- `profileIds?: number[]` — фильтр по профилям
- `skip?: number` — смещение (default: 0)
- `take?: number` — лимит (default: 10, max: 100)
- `sortBy?: string` — поле сортировки (default: `createdAt`)
- `sortOrder?: 'asc' | 'desc'` — направление (default: `desc`)
- `search?: string` — поиск по `subscriptionType`, `status`, `paymentProvider`

#### Output DTOs

**`UserProfilePaymentResponseDto`** — ответ с платежами профиля:

- `id: number`
- `datePayment: string` (ISO)
- `endDate: string` (ISO)
- `amount: number`
- `currency: string`
- `paymentProvider: string`
- `subscriptionType: string | null`

Имеет статические методы `mapToView()` и `mapManyToView()` для маппинга из Entity.

### 4.3 Commands (CQRS)

#### `CreateSubscriptionPaymentCommand` / `CreateSubscriptionPaymentCommandHandler`

Создаёт URL для оплаты подписки через Stripe Checkout Session.

**Логика:**

1. Проверяет, есть ли уже Pending-платёж у профиля → возвращает существующий URL
2. Если есть активная подписка — передаёт её ID как `mainSubscriptionId` (продление)
3. Создаёт Stripe Checkout Session с конфигурацией подписки (интервал, цена)
4. Сохраняет запись о платеже со статусом `PENDING`
5. При ошибке создания в БД — отменяет Stripe Session

#### `StripeHookCommand` / `StripeHookCommandHandler`

Обработчик входящих Webhook-событий от Stripe.

**Обрабатываемые события:**

| Событие Stripe                                           | Обработчик                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `checkout.session.completed`                             | `handleInitialPayment()` → `ProcessInitialPaymentCommand`           |
| `invoice.paid` (с `billing_reason = subscription_cycle`) | `handleRecurringPayment()` → `ProcessRecurringPaymentCommand`       |
| `customer.subscription.deleted`                          | `handleSubscriptionDeleted()` → `ProcessSubscriptionDeletedCommand` |

**Защита от повторной обработки:**

- Для `checkout.session.completed`: проверяет статус платежа по `customPaymentId`
- Для `invoice.paid`: проверяет `billing_reason` (только `subscription_cycle`) и статус инвойса (`paid`)

#### `ProcessInitialPaymentCommand` / `ProcessInitialPaymentCommandHandler`

Обрабатывает первичный платёж после успешной оплаты через Stripe Checkout.

**Логика (в транзакции):**

1. Находит платёж по `customPaymentId`
2. Проверяет наличие активной подписки у профиля
3. Получает детали подписки из Stripe
4. Рассчитывает даты периода (с учётом остатка времени от предыдущей подписки, если есть)
5. Обновляет запись платежа: присваивает `subscriptionId`, `stripeSubscriptionId`, статус (`ACTIVE` или `EXTENSION`)
6. Если была предыдущая активная подписка:
   - Создаёт сообщение на обновление даты окончания старой подписки в Stripe
   - Создаёт сообщение на немедленную отмену старой подписки в Stripe
7. Создаёт Outbox-сообщение `PAYMENT_COMPLETED` для уведомления lumio
8. Real-проверка идемпотентности через `checkIdempotencyAndHandle()`

**Дополнительное время (extraTime):**
Если у пользователя есть активная подписка с остатком времени, это время добавляется к новому периоду (продление со смещением).

#### `ProcessRecurringPaymentCommand` / `ProcessRecurringPaymentCommandHandler`

Обрабатывает рекуррентный платёж (автопродление).

**Логика (в транзакции):**

1. Проверяет, что инвойс не от `subscription_create` и имеет статус `paid`
2. Проверяет, что подписка не отменена и не помечена как `extensionSub`
3. Находит последний платёж по `stripeSubscriptionId` или активную подписку профиля
4. Рассчитывает новый период
5. Создаёт новый платёж со статусом `ACTIVE`
6. Помечает предыдущую основную подписку как `COMPLETED`
7. Создаёт Outbox-сообщение `PAYMENT_RECURRING_COMPLETED` для уведомления lumio
8. При ошибке — создаёт задачу на ручную проверку

#### `ProcessSubscriptionDeletedCommand` / `ProcessSubscriptionDeletedCommandHandler`

Обрабатывает удаление подписки в Stripe (уведомление `customer.subscription.deleted`).

**Логика (в транзакции):**

1. Проверяет метаданные подписки: если `cancelled_by = 'system'` — игнорирует (отмена была инициирована системой)
2. Находит активный платёж по `stripeSubscriptionId`
3. Отмечает платёж как `CANCELLED`
4. Создаёт Outbox-сообщение `SUBSCRIPTION_DELETED` для уведомления lumio
5. При ошибке — создаёт задачу на ручную проверку

#### `ChangeAutoRenewalSubscriptionCommand` / `ChangeAutoRenewalSubscriptionCommandHandler`

Изменяет флаг автопродления подписки.

**Логика (в транзакции):**

1. Находит активную подписку по `profileId` и `subscriptionId`
2. Если есть `mainSubscription` — обновляет и её
3. Обновляет флаг `autoRenewal` в БД для обеих подписок
4. Создаёт Outbox-сообщение на изменение `cancel_at_period_end` в Stripe
5. Если флаг не изменился — выходит без изменений

### 4.4 Queries (CQRS)

#### `GetUserProfilePaymentsQuery` / `GetUserProfilePaymentsQueryHandler`

Возвращает платежи конкретного профиля с пагинацией и сортировкой.

- Исключает платежи со статусом `PENDING`
- Поддерживает сортировку: `date_desc`, `date_asc`, `amount_desc`, `amount_asc`
- Маппит результат через `UserProfilePaymentResponseDto.mapManyToView()`

#### `GetAllPaymentsQuery` / `GetAllPaymentsHandler`

Возвращает все платежи для админ-панели с фильтрацией, пагинацией и поиском.

- Фильтрация по `profileIds`
- Поиск по `subscriptionType`, `status`, `paymentProvider` (case-insensitive)
- Сортировка по любому полю

### 4.5 Domain Layer

#### `PaymentEntity`

Сущность платежа, реализующая интерфейс `Payment` из Prisma.

**Поля:**

| Поле                     | Тип     | Описание                                                  |
| ------------------------ | ------- | --------------------------------------------------------- |
| `id`                     | number  | ID записи                                                 |
| `customPaymentId`        | string  | Уникальный ID платежа (формат: `{profileId}-{timestamp}`) |
| `paymentProvider`        | string  | Провайдер (Stripe)                                        |
| `currency`               | string  | Валюта                                                    |
| `amount`                 | number  | Сумма                                                     |
| `status`                 | string  | Статус (pending, active, completed, cancelled, extension) |
| `subscriptionId`         | string  | UUID подписки                                             |
| `periodStart`            | Date    | Начало периода                                            |
| `periodEnd`              | Date    | Конец периода                                             |
| `nextPaymentDate`        | Date    | Дата следующего платежа                                   |
| `subscriptionType`       | string  | Тип подписки                                              |
| `profileId`              | number  | ID профиля                                                |
| `paymentsUrl`            | string  | URL оплаты Stripe Checkout                                |
| `autoRenewal`            | boolean | Автопродление                                             |
| `cancelledAt`            | Date    | Дата отмены                                               |
| `stripePaymentCreatedAt` | Date    | Дата создания платежа в Stripe                            |
| `stripeSubscriptionId`   | string  | ID подписки в Stripe                                      |
| `mainSubscriptionId`     | string  | ID основной подписки (для расширений)                     |

#### `CreatePaymentDomainDto`

DTO для создания нового платежа в БД. Содержит все поля, необходимые для создания записи.

#### `UpdatePaymentDomainDto`

DTO для обновления платежа после успешной оплаты. Содержит:

- `customPaymentId`
- `subscriptionId`
- `stripeSubscriptionId`
- `mainSubscriptionId`
- `status`
- `periodStart`, `periodEnd`
- `nextPaymentDate`
- `autoRenewal`

### 4.6 Infrastructure

#### `PaymentsRepository`

Основной репозиторий для операций записи/чтения платежей.

**Основные методы:**

| Метод                                                                                     | Описание                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `createPayment(data, tx?)`                                                                | Создать платёж                                          |
| `findPendingPaymentByProfileId(profileId)`                                                | Найти Pending-платёж профиля                            |
| `findByCustomPaymentId(customPaymentId, tx?)`                                             | Найти платёж по customPaymentId                         |
| `findPaymentForIdempotencyCheck(customPaymentId, tx?)`                                    | Проверка идемпотентности                                |
| `updateCustomPaymentId(data, tx?)`                                                        | Обновить платёж после оплаты                            |
| `completePayment(customPaymentId, status, cancelledAt, tx?)`                              | Завершить платёж                                        |
| `cancelPayment(customPaymentId, cancelledAt, tx?)`                                        | Отменить платёж                                         |
| `findActiveSubscriptionPaymentByProfileId(profileId)`                                     | Найти активную подписку профиля                         |
| `findActiveSubscriptionPaymentByStripeSubscriptionId(stripeSubscriptionId)`               | Найти активную подписку по Stripe ID                    |
| `findBySubscriptionId(subscriptionId)`                                                    | Найти платёж по UUID подписки                           |
| `findByProfileAndSubscriptionId(profileId, subscriptionId)`                               | Найти платёж по профилю и UUID                          |
| `findLastActiveSubscriptionByProfileId(profileId, nowDate, customPaymentId)`              | Найти последнюю активную подписку для расчёта extraTime |
| `findLastSubscriptionPaymentByStripeSubscriptionId(stripeSubscriptionId)`                 | Последний платёж по Stripe ID                           |
| `updatePaymentSubscriptionAutoRenewal(subscriptionId, customPaymentId, autoRenewal, tx?)` | Обновить автопродление                                  |
| `updatePaymentSubscriptionPeriodDate(customPaymentId, periodEnd, tx?)`                    | Обновить дату периода                                   |
| `deleteExpiredPendingPayments(createdBefore)`                                             | Удалить просроченные Pending-платежи                    |
| `findAllUserProfilePayments(profileId, page, limit, sortBy)`                              | Все платежи профиля с пагинацией                        |

#### `QueryPaymentsRepository`

Репозиторий только для чтения (админ-панель).

| Метод                                                                  | Описание                            |
| ---------------------------------------------------------------------- | ----------------------------------- |
| `findAllPayments(profileIds?, skip, take, sortBy, sortOrder, search?)` | Все платежи с фильтрацией и поиском |

### 4.7 Services

#### `StripeAdapter`

Адаптер для взаимодействия с Stripe API.

| Метод                                                                                 | Описание                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `createPaymentSession(subscriptionType, amount, profileId, currency, subscriptionId)` | Создать Checkout Session                          |
| `verify(rawBody, signature)`                                                          | Проверить подпись Webhook                         |
| `getSubscriptionDetails(subscriptionId)`                                              | Получить детали подписки                          |
| `changeSubscriptionAutoRenewal(subscriptionId, autoRenewal)`                          | Изменить `cancel_at_period_end`                   |
| `cancelSession(sessionId)`                                                            | Отменить/истечь Session                           |
| `cancelSubscriptionImmediately(subscriptionId)`                                       | Немедленно отменить подписку                      |
| `updateCustomerSubscriptionEndDate(subscriptionId, customPeriodDateEnd, autoRenewal)` | Обновить дату окончания (trial_end или cancel_at) |
| `updateSubscriptionMetadata(subscriptionId, metadata)`                                | Обновить метаданные подписки                      |

#### `ManualReviewService`

Сервис для создания задач ручной проверки при ошибках.

| Метод                                                                       | Описание                       |
| --------------------------------------------------------------------------- | ------------------------------ |
| `createFailedInitialPaymentTask(session, error)`                            | Ошибка первичного платежа      |
| `createFailedRecurringPaymentTask(invoice, error)`                          | Ошибка рекуррентного платежа   |
| `createFailedAutoRenewalChangeTask(subscriptionId, customPaymentId, error)` | Ошибка изменения автопродления |
| `createFailedSubscriptionDeletedTask(subscriptionId, error)`                | Ошибка при удалении подписки   |

#### `RetryService`

Сервис для повторных попыток выполнения операций с экспоненциальной задержкой.

| Параметр     | Значение по умолчанию |
| ------------ | --------------------- |
| `maxRetries` | 5                     |
| `baseDelay`  | 1000 ms               |
| `maxDelay`   | 16000 ms              |

Формула задержки: `min(baseDelay × 2^retryCount, maxDelay)`

---

## 5. Модели БД (Prisma Schema)

### `Payment`

Основная таблица платежей (см. поля в `PaymentEntity`).

**Индексы:**

- `profileId`
- `[status, profileId]`
- `subscriptionId`
- `status`

**Уникальные:**

- `customPaymentId`

### `OutboxMessage`

Таблица для Outbox-паттерна.

| Поле            | Тип          | Описание                              |
| --------------- | ------------ | ------------------------------------- |
| `id`            | Int (PK)     | ID                                    |
| `aggregateId`   | String       | ID агрегата                           |
| `aggregateType` | String (50)  | Тип агрегата (payment/subscription)   |
| `eventType`     | String (100) | Тип события                           |
| `payload`       | Json         | Данные события                        |
| `status`        | String (20)  | Статус (pending/processing/completed) |
| `createdAt`     | DateTime     | Дата создания                         |
| `processedAt`   | DateTime     | Дата обработки                        |
| `scheduledAt`   | DateTime     | Запланированное время                 |
| `retryCount`    | Int          | Количество попыток                    |
| `maxRetries`    | Int          | Максимум попыток (default: 3)         |
| `ttl`           | DateTime     | Время жизни сообщения                 |

**Индексы:**

- `[status, scheduledAt]`
- `ttl`

---

## 6. Потоки данных (Data Flow)

### 6.1 Создание подписки (Initial Payment)

```
[Lumio] → POST /payments/create → CreateSubscriptionPaymentCommand
                                         ↓
                               StripeAdapter.createPaymentSession()
                                         ↓
                               Payment (status: PENDING)
                                         ↓
                               Return Checkout URL → [Lumio]

[User] → Оплачивает через Stripe Checkout
                                         ↓
[Stripe] → Webhook: checkout.session.completed
                                         ↓
                               StripeHookCommandHandler
                                         ↓
                               ProcessInitialPaymentCommandHandler
                                         ↓ (транзакция)
                               Update Payment → status: ACTIVE/EXTENSION
                               Create Outbox: PAYMENT_COMPLETED
                               (Если было продление: update end date + cancel old)
                                         ↓
                               ExternalCallsProcessor → Stripe API
                               OutboxScheduler → RabbitMQ → [Lumio]
```

### 6.2 Рекуррентный платёж (Recurring Payment)

```
[Stripe] → Webhook: invoice.paid (subscription_cycle)
                                         ↓
                               StripeHookCommandHandler
                                         ↓
                               ProcessRecurringPaymentCommandHandler
                                         ↓ (транзакция)
                               Create new Payment (status: ACTIVE)
                               Complete old main Payment (status: COMPLETED)
                               Create Outbox: PAYMENT_RECURRING_COMPLETED
                                         ↓
                               OutboxScheduler → RabbitMQ → [Lumio]
```

### 6.3 Отмена подписки

```
[Lumio] → PATCH /change-autorenewal → ChangeAutoRenewalSubscriptionCommand
                                         ↓ (транзакция)
                               Update autoRenewal in DB
                               Create Outbox: CHANGE_SUBSCRIPTION_AUTORENEWAL
                                         ↓
                               ExternalCallsProcessor → Stripe: update cancel_at_period_end

(Когда период истекает, Stripe присылает customer.subscription.deleted)
                                         ↓
                               ProcessSubscriptionDeletedCommandHandler
                                         ↓ (транзакция)
                               Cancel Payment (status: CANCELLED)
                               Create Outbox: SUBSCRIPTION_DELETED
```

### 6.4 Немедленная отмена/обновление подписки (extension)

```
(При покупке новой подписки при наличии активной)
                                         ↓
                               Outbox: UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE
                               Outbox: CANCEL_SUBSCRIPTION_IMMEDIATELY
                                         ↓
                               ExternalCallsProcessor:
                                 - Stripe: update trial_end или cancel_at
                                 - Stripe: cancel subscription immediately (с пометкой cancelled_by=system)
```

---

## 7. Обработка ошибок и отказоустойчивость

1. **Retry-паттерн** — `RetryService` выполняет операции с экспоненциальной задержкой (до 5 попыток)
2. **Outbox-паттерн** — гарантирует доставку событий даже при временных сбоях
3. **Manual Review** — если все попытки исчерпаны, создаётся задача для ручной проверки
4. **Идемпотентность** — проверка статуса платежа перед обработкой (защита от дублирования Webhook)
5. **Отмена Stripe Session** — если создание платежа в БД не удалось, Stripe Session отменяется
6. **Expired Pending Payments** — автоматическая очистка просроченных `PENDING` платежей каждые 10 минут
7. **Expired Outbox Messages** — автоматическое удаление просроченных Outbox-сообщений каждый час

---

## 8. Участвующие модули и сервисы

| Компонент                    | Роль                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **RabbitMQ (lumio_service)** | Отправка событий в микросервис lumio (`payment.completed`, `payment.recurring.completed`, `subscription.deleted`) |
| **Stripe API**               | Платёжный провайдер (Checkout Sessions, Subscriptions, Invoices, Webhooks)                                        |
| **PostgreSQL (payments)**    | Хранение данных о платежах и Outbox-сообщениях                                                                    |
| **Микросервис lumio**        | Инициирует создание платежа, получает уведомления о статусе                                                       |
| **Микросервис super-admin**  | Получает доступ к данным всех платежей через админ-панель                                                         |

---

## 9. Конфигурация

Основные настройки (через `CoreConfig`):

| Переменная             | Описание                             |
| ---------------------- | ------------------------------------ |
| `stripeApiKey`         | API ключ Stripe                      |
| `stripeEndpointSecret` | Секрет для проверки Webhook-подписей |
| `stripeSuccessUrl`     | URL успешной оплаты                  |
| `stripeCancelUrl`      | URL отмены оплаты                    |

---

## 10. Swagger Decorators

Для каждого эндпоинта контроллера определён Swagger-декоратор в `core/decorators/swagger/subscription-payments/`:

| Файл                                       | Описание                |
| ------------------------------------------ | ----------------------- |
| `create-subscription-payment.decorator.ts` | Создание URL оплаты     |
| `change-autorenewal.decorator.ts`          | Изменение автопродления |
| `stripe-hook.decorator.ts`                 | Webhook Stripe          |
| `payment-success.decorator.ts`             | Страница успеха         |
| `payment-error.decorator.ts`               | Страница ошибки         |
| `get-all-payments.decorator.ts`            | Все платежи             |
| `get-user-profile-payments.decorator.ts`   | Платежи профиля         |
