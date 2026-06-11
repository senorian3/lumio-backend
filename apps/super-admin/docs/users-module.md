# Users Module — Super Admin

## Обзор

Модуль **users** микросервиса **super-admin** предоставляет панель администратора для управления пользователями основного приложения (lumio). Реализует CRUD-операции через **GraphQL API** с использованием **CQRS паттерна**.

**Ключевые возможности:**

- Просмотр списка пользователей с пагинацией, поиском, сортировкой и фильтрацией по статусу блокировки
- Просмотр детальной информации о пользователе (с профилем)
- Мягкое удаление пользователя (`soft delete`)
- Бан / разбан пользователя
- Просмотр платежей пользователя (через интеграцию с payments-микросервисом)
- Просмотр файлов пользователя (через интеграцию с files-микросервисом)

---

## Структура модуля

```
apps/super-admin/src/modules/users/
├── users.module.ts                                      # NestJS модуль
├── api/
│   ├── users.resolver.ts                                # GraphQL резолвер
│   └── dto/
│       ├── input/
│       │   └── find-many-options.input.dto.ts            # DTO для пагинации и фильтрации
│       ├── output/
│       │   └── user-with-profile.output.dto.ts           # DTO пользователя с профилем
│       └── transfer/
│           └── ban-user.transfer.dto.ts                  # Transfer DTO для статуса бана
├── application/
│   ├── commands/
│   │   ├── ban-user.command-handler.ts                   # Бан пользователя
│   │   ├── deleted-user.command-handler.ts               # Мягкое удаление
│   │   └── unban-user.command-handler.ts                 # Разбан
│   ├── mappers/
│   │   └── user.mapper.ts                                # Маппер DTO → GraphQL schema
│   └── queries/
│       ├── get-user.query-handler.ts                     # Получение одного пользователя
│       ├── get-users.query-handler.ts                    # Список пользователей
│       └── get-payments.query-handler.ts                 # Список всех платежей
├── domain/
│   ├── infrastructure/
│   │   ├── user.query-repository.ts                      # Query-репозиторий (чтение)
│   │   └── user.repository.ts                            # Command-репозиторий (запись)
│   ├── schema/
│   │   └── user/
│   │       ├── user.schema.ts                            # GraphQL ObjectType "User"
│   │       ├── user-profile.schema.ts                    # GraphQL ObjectType "UserProfile"
│   │       ├── paginated-user.entity.ts                  # GraphQL ObjectType пагинации
│   │       └── account-type.enum.ts                      # Enum "AccountType"
│   └── types/
│       └── user.types.ts                                 # TypeScript типы (Prisma)
```

---

## GraphQL API

**Endpoint:** `POST /api/v1/graphql`

**Аутентификация:** Все запросы защищены `@UseGuards(SuperAdminJwtGuard)` — требуется JWT токен в заголовке `Authorization: Bearer <token>`.

---

### Запрос `user`

Получение одного пользователя по ID.

```graphql
query GetUser($id: Int!) {
  user(id: $id) {
    id
    username
    email
    createdAt
    isBlocked
    bannedAt
    banReason
    profile {
      id
      firstName
      lastName
      aboutMe
      avatarUrl
      accountType
    }
  }
}
```

**Параметры:**

| Поле | Тип    | Обязательное | Описание                              |
| ---- | ------ | :----------: | ------------------------------------- |
| `id` | `Int!` |      ✅      | Уникальный идентификатор пользователя |

**Ответ:** `User` или `null`.

---

### Запрос `users`

Получение списка пользователей с пагинацией, поиском, сортировкой и фильтрацией.

```graphql
query GetUsers(
  $pageNumber: Int = 1
  $pageSize: Int = 10
  $search: String
  $sortBy: UserSortBy = CREATED_AT_DESC
  $blockedFilter: UserBlockedFilter
) {
  users(
    pageNumber: $pageNumber
    pageSize: $pageSize
    search: $search
    sortBy: $sortBy
    blockedFilter: $blockedFilter
  ) {
    page
    pageSize
    pagesCount
    totalCount
    items {
      id
      username
      email
      isBlocked
      profile {
        firstName
        lastName
        accountType
      }
    }
  }
}
```

**Параметры:**

| Поле            | Тип                 |   По умолчанию    | Обязательное | Описание                             |
| --------------- | ------------------- | :---------------: | :----------: | ------------------------------------ |
| `pageNumber`    | `Int`               |        `1`        |      ❌      | Номер страницы                       |
| `pageSize`      | `Int`               |       `10`        |      ❌      | Количество записей на странице       |
| `search`        | `String`            |      `null`       |      ❌      | Поиск по username (case-insensitive) |
| `sortBy`        | `UserSortBy`        | `CREATED_AT_DESC` |      ❌      | Тип сортировки                       |
| `blockedFilter` | `UserBlockedFilter` |      `null`       |      ❌      | Фильтр по статусу блокировки         |

**Ответ:** `PaginatedUserResponse`.

---

### Мутация `deleteUser`

Мягкое удаление пользователя (устанавливает `deletedAt`).

```graphql
mutation DeleteUser($id: Int!) {
  deleteUser(id: $id)
}
```

**Параметры:**

| Поле | Тип    | Обязательное | Описание        |
| ---- | ------ | :----------: | --------------- |
| `id` | `Int!` |      ✅      | ID пользователя |

**Ответ:** `Boolean` — `true` при успехе.

**Ошибки:**
| Код | Описание |
|:------------:|:-------------------------------:|
| `Not found` | Пользователь с указанным ID не найден |

---

### Мутация `banUser`

Блокировка пользователя.

```graphql
mutation BanUser($id: Int!, $banReason: String!) {
  banUser(id: $id, banReason: $banReason)
}
```

**Параметры:**

| Поле        | Тип       | Обязательное | Описание           |
| ----------- | --------- | :----------: | ------------------ |
| `id`        | `Int!`    |      ✅      | ID пользователя    |
| `banReason` | `String!` |      ✅      | Причина блокировки |

**Ответ:** `Boolean` — `true` при успехе.

**Ошибки:**
| Код | Описание |
|:------------:|:-------------------------------:|
| `Not found` | Пользователь с указанным ID не найден |

---

### Мутация `unbanUser`

Снятие блокировки пользователя.

```graphql
mutation UnbanUser($id: Int!) {
  unbanUser(id: $id)
}
```

**Параметры:**

| Поле | Тип    | Обязательное | Описание        |
| ---- | ------ | :----------: | --------------- |
| `id` | `Int!` |      ✅      | ID пользователя |

**Ответ:** `Boolean` — `true` при успехе.

**Ошибки:**
| Код | Описание |
|:------------:|:-------------------------------:|
| `Not found` | Пользователь с указанным ID не найден |

---

### Запрос `getPayments`

Получение списка всех платежей с возможностью поиска по пользователям.

```graphql
query GetPayments(
  $pageNumber: Int! = 1
  $pageSize: Int! = 6
  $search: String
  $sortBy: PaymentSortBy! = DATE_DESC
) {
  getPayments(
    pageNumber: $pageNumber
    pageSize: $pageSize
    search: $search
    sortBy: $sortBy
  ) {
    page
    pageSize
    pagesCount
    totalCount
    items {
      id
      amount
      currency
      status
      username
      createdAt
    }
  }
}
```

**Ответ:** `PaginatedPaymentResponse`.

---

### ResolveField `payments` (на объекте User)

Получение платежей конкретного пользователя (по `profile.id`).

```graphql
query {
  user(id: 1) {
    payments(page: 1, limit: 20, sortBy: DATE_DESC) {
      id
      amount
      currency
      status
      createdAt
    }
  }
}
```

**Параметры:**

| Поле     | Тип             | По умолчанию | Обязательное | Описание           |
| -------- | --------------- | :----------: | :----------: | ------------------ |
| `page`   | `Int`           |     `1`      |      ❌      | Номер страницы     |
| `limit`  | `Int`           |     `20`     |      ❌      | Количество записей |
| `sortBy` | `PaymentSortBy` | `DATE_DESC`  |      ❌      | Тип сортировки     |

**Ответ:** `[PaymentDto]`.

---

### ResolveField `files` (на объекте User)

Получение файлов конкретного пользователя.

```graphql
query {
  user(id: 1) {
    files(page: 1, limit: 20, sortBy: DATE_DESC) {
      id
      originalName
      size
      mimeType
      createdAt
    }
  }
}
```

**Параметры:**

| Поле     | Тип          | По умолчанию | Обязательное | Описание           |
| -------- | ------------ | :----------: | :----------: | ------------------ |
| `page`   | `Int`        |     `1`      |      ❌      | Номер страницы     |
| `limit`  | `Int`        |     `20`     |      ❌      | Количество записей |
| `sortBy` | `FileSortBy` | `DATE_DESC`  |      ❌      | Тип сортировки     |

**Ответ:** `[FileDto]`.

---

## Компоненты

### 1. UsersModule (`users.module.ts`)

```typescript
@Module({
  imports: [PrismaModule, CqrsModule, HttpModule, IntegrationModule],
  providers: [
    PaymentsHttpClient,
    UsersResolver,
    UserRepository,
    UserQueryRepository,
    GetUserHandler,
    GetUsersHandler,
    GetPaymentsHandler,
    DeletedUserCommandHandler,
    BanUserCommandHandler,
    UnBanUserCommandHandler,
  ],
  exports: [UserRepository, UserQueryRepository],
})
export class UsersModule {}
```

Регистрирует CQRS обработчики, репозитории, резолвер и HTTP-клиенты. Экспортирует репозитории для возможного использования в других модулях.

---

### 2. UsersResolver (`api/users.resolver.ts`)

GraphQL резолвер, защищённый `@UseGuards(SuperAdminJwtGuard)`. Предоставляет:

- **Queries:** `user`, `users`, `getPayments`
- **Mutations:** `deleteUser`, `banUser`, `unbanUser`
- **ResolveFields:** `payments`, `files` на объекте `User`

Использует `QueryBus` и `CommandBus` из `@nestjs/cqrs` для делегирования логики обработчикам.

Для полей `payments` и `files` напрямую вызывает HTTP-клиенты (`PaymentsHttpClient`, `FilesHttpClient`) для получения данных из соответствующих микросервисов.

---

### 3. DTO слой (`api/dto/`)

#### Input DTO (`find-many-options.input.dto.ts`)

```typescript
export class FindManyOptionsInputDto {
  skip: number;
  take: number;
  orderBy: SortOrder;
  search?: string;
  sortBy?: UserSortBy;
  blockedFilter?: UserBlockedFilter;
}
```

Валидируется через `class-validator`: `@IsNumber()`, `@Min()`, `@IsEnum()`, `@IsOptional()`, `@IsString()`.

#### Output DTO (`user-with-profile.output.dto.ts`)

Содержит:

- `UserProfileOutputDto` — поля профиля: `firstName`, `lastName`, `dateOfBirth`, `country`, `city`, `aboutMe`, `avatarUrl`, `profileFilled`, `profileFilledAt`, `profileUpdatedAt`, `accountType`
- `UserWithProfileOutputDto` — поля пользователя: `id`, `username`, `email`, `createdAt`, `isBlocked`, `bannedAt`, `banReason`, `profile` (опционально)

Использует `class-transformer` (`@Expose()`, `@Type()`).

#### Transfer DTO (`ban-user.transfer.dto.ts`)

```typescript
export class UpdateBanStatusDto {
  constructor(
    public isBlocked: boolean,
    public bannedAt: Date | null,
    public banReason: string | null,
  ) {}
}
```

Используется для передачи данных о статусе бана между слоями.

---

### 4. Application Layer (`application/`)

#### Queries

| Query Class        | Handler Class        | Описание                                           |
| ------------------ | -------------------- | -------------------------------------------------- |
| `GetUserQuery`     | `GetUserHandler`     | Получение пользователя по ID через QueryRepository |
| `GetUsersQuery`    | `GetUsersHandler`    | Пагинированный список с фильтрацией и сортировкой  |
| `GetPaymentsQuery` | `GetPaymentsHandler` | Список всех платежей с поиском по пользователям    |

**GetUsersHandler** — обрабатывает пагинацию, поиск (username, case-insensitive), сортировку (`UserSortBy`) и фильтр по блокировке (`UserBlockedFilter`). При ошибке логирует и возвращает пустой результат (не выбрасывает исключение).

**GetPaymentsHandler** — сложный запрос, который:

1. При наличии `search` — сначала ищет пользователей по username (до 500 записей)
2. Извлекает `profileIds` найденных пользователей
3. Передаёт `profileIds` в `PaymentsHttpClient` для фильтрации платежей
4. Обогащает платежи данными пользователей (username, avatarUrl, firstName, lastName)
5. Поддерживает сортировку по полям: `DATE`, `AMOUNT`, `PAYMENT_METHOD`, `USERNAME`

#### Commands

| Command Class        | Handler Class               | Описание                                             |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| `DeletedUserCommand` | `DeletedUserCommandHandler` | Мягкое удаление (установка `deletedAt`)              |
| `BanUserCommand`     | `BanUserCommandHandler`     | Бан (установка `isBlocked`, `bannedAt`, `banReason`) |
| `UnBanUserCommand`   | `UnBanUserCommandHandler`   | Разбан (сброс `isBlocked`, `bannedAt`, `banReason`)  |

Все command handlers:

1. Проверяют существование пользователя через `UserRepository.findById()`
2. При отсутствии выбрасывают `GraphQLError` с кодом `Not found`
3. Выполняют операцию через `UserRepository`

#### Mapper (`application/mappers/user.mapper.ts`)

```typescript
export class UserMapper {
  mapFromDto(dto: UserWithProfileOutputDto): User;
  mapFromDtoArray(dtos: UserWithProfileOutputDto[]): User[];
}
```

Преобразует `UserWithProfileOutputDto` (из QueryRepository) в GraphQL `User` schema. `undefined` значения обрабатываются как отсутствующие поля.

---

### 5. Domain Layer (`domain/`)

#### GraphQL Schemas (`domain/schema/user/`)

**User**

```graphql
type User {
  id: Int! # Уникальный идентификатор пользователя
  username: String! # Имя пользователя
  email: String! # Email
  createdAt: Date # Дата регистрации
  isBlocked: Boolean # Заблокирован ли
  bannedAt: Date # Дата блокировки
  banReason: String # Причина блокировки
  profile: UserProfile # Профиль пользователя
}
```

**UserProfile**

```graphql
type UserProfile {
  id: Int!
  firstName: String
  lastName: String
  dateOfBirth: Date
  country: String
  city: String
  aboutMe: String
  avatarUrl: String
  profileFilled: Boolean!
  profileFilledAt: Date
  profileUpdatedAt: Date
  accountType: AccountType!
}
```

**PaginatedUserResponse**

```graphql
type PaginatedUserResponse {
  page: Int!
  pageSize: Int!
  pagesCount: Int!
  totalCount: Int!
  items: [User!]!
}
```

**AccountType**

|  Значение  |    Описание    |
| :--------: | :------------: |
| `Personal` | Личный аккаунт |
| `Business` | Бизнес-аккаунт |

#### Infrastructure (`domain/infrastructure/`)

**UserQueryRepository** — чтение данных через Prisma:

- `findById(id)` — поиск по ID с включением `profile`
- `findByProfileIds(profileIds[])` — поиск по ID профилей
- `findByIds(ids[])` — поиск по нескольким ID
- `findMany(options)` — пагинированный поиск с фильтрацией (search, blockedFilter, sortBy)
- `count(options)` — подсчёт количества записей с учётом фильтров

**UserRepository** — запись данных через Prisma:

- `findById(id)` — поиск по ID (исключая мягко удалённых: `deletedAt: null`)
- `findMany(options)` — пагинированный поиск
- `count()` — общее количество
- `softDeletedUserById(userId)` — мягкое удаление
- `updateBanStatus(userId, dto)` — обновление статуса бана

Оба репозитория работают с таблицами `User` и `UserProfile` через `PrismaService` из `@generated/prisma-lumio`.

---

## Enums

### UserSortBy (core/schema/)

|     Значение      |                    Описание                     |
| :---------------: | :---------------------------------------------: |
|  `USERNAME_ASC`   |         Сортировка по username (A → Z)          |
|  `USERNAME_DESC`  |         Сортировка по username (Z → A)          |
| `CREATED_AT_ASC`  | Сортировка по дате регистрации (сначала старые) |
| `CREATED_AT_DESC` | Сортировка по дате регистрации (сначала новые)  |

### UserBlockedFilter (core/schema/)

|   Значение    |         Описание         |
| :-----------: | :----------------------: |
|     `ALL`     |     Все пользователи     |
|   `BLOCKED`   |  Только заблокированные  |
| `NOT_BLOCKED` | Только незаблокированные |

---

## Интеграции

### Payments микросервис

- **Клиент:** `PaymentsHttpClient` (`core/integration/payments-http.client.ts`)
- **Методы:**
  - `getAllPayments(params)` — получение всех платежей (с фильтрацией по profileIds, пагинацией, сортировкой)
  - `getUserPayments(profileId, page, limit, sortBy)` — получение платежей конкретного профиля
- **Используется в:** `GetPaymentsHandler`, `UsersResolver.payments()`

### Files микросервис

- **Клиент:** `FilesHttpClient` (`core/integration/files-http.client.ts`)
- **Метод:** `getUserFiles(userId, page, limit, sortBy)` — получение файлов пользователя
- **Используется в:** `UsersResolver.files()`

---

## Схема работы (Sequence Diagram)

```
Admin (GraphQL)          UsersResolver           QueryBus/CommandBus       Handler           Prisma/HTTP
      │                       │                        │                    │                  │
      │  Query: user(id)      │                        │                    │                  │
      │ ──────────────────>   │                        │                    │                  │
      │                       │  GetUserQuery(id)      │                    │                  │
      │                       │ ──────────────────>    │                    │                  │
      │                       │                        │  GetUserHandler    │                  │
      │                       │                        │ ─────────────────> │                  │
      │                       │                        │                    │  prisma.user      │
      │                       │                        │                    │ ───────────────>  │
      │                       │                        │                    │ <───────────────  │
      │                       │                        │  <──────────────── │                  │
      │                       │  <──────────────────   │                    │                  │
      │  < User (or null)     │                        │                    │                  │
      │ ──────────────────    │                        │                    │                  │
      │                       │                        │                    │                  │
      │                       │                        │                    │                  │
      │  Mutation: banUser(id, reason)                  │                    │                  │
      │ ──────────────────>   │                        │                    │                  │
      │                       │  BanUserCommand(id,     │                    │                  │
      │                       │  reason)                │                    │                  │
      │                       │ ──────────────────>    │                    │                  │
      │                       │                        │  BanUserHandler    │                  │
      │                       │                        │ ─────────────────> │                  │
      │                       │                        │                    │  UserRepository   │
      │                       │                        │                    │  .findById()      │
      │                       │                        │                    │ ───────────────>  │
      │                       │                        │                    │ <───────────────  │
      │                       │                        │                    │  .updateBanStatus │
      │                       │                        │                    │ ───────────────>  │
      │                       │                        │                    │ <───────────────  │
      │                       │                        │  <──────────────── │                  │
      │                       │  <──────────────────   │                    │                  │
      │  < true               │                        │                    │                  │
      │ ──────────────────    │                        │                    │                  │
```

---

## Обработка ошибок

|           Сценарий           |   Тип ошибки   | HTTP статус |                      Сообщение                      |
| :--------------------------: | :------------: | :---------: | :-------------------------------------------------: |
|    Пользователь не найден    | `GraphQLError` |     200     |        `User not found` (code: `Not found`)         |
|     Ошибка БД при чтении     |   Логируется   |     200     | Возвращается `null` или пустой пагинированный ответ |
| Ошибка интеграции (payments) |   Логируется   |     200     |      Возвращается пустой пагинированный ответ       |

Все ошибки обрабатываются и логируются через `AppLoggerService`. Администратору возвращается безопасный ответ (без stack trace).

---

## Конфигурация (Env Variables)

| Переменная             | Тип      | По умолчанию | Описание                                  |
| ---------------------- | -------- | :----------: | ----------------------------------------- |
| `SUPER_ADMIN_SECRET`   | `String` |      —       | Секретный ключ для JWT (через auth guard) |
| `PAYMENTS_SERVICE_URL` | `String` |      —       | URL микросервиса payments                 |
| `FILES_SERVICE_URL`    | `String` |      —       | URL микросервиса files                    |

---

## Примеры вызовов

### Получение списка пользователей (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "query GetUsers($pageNumber: Int, $pageSize: Int, $sortBy: UserSortBy) { users(pageNumber: $pageNumber, pageSize: $pageSize, sortBy: $sortBy) { page pageSize pagesCount totalCount items { id username email isBlocked createdAt } } }",
    "variables": {
      "pageNumber": 1,
      "pageSize": 5,
      "sortBy": "CREATED_AT_DESC"
    }
  }'
```

### Бан пользователя (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "mutation BanUser($id: Int!, $banReason: String!) { banUser(id: $id, banReason: $banReason) }",
    "variables": {
      "id": 1,
      "banReason": "Нарушение правил использования"
    }
  }'
```

### Удаление пользователя (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "mutation DeleteUser($id: Int!) { deleteUser(id: $id) }",
    "variables": {
      "id": 1
    }
  }'
```

### Получение платежей пользователя (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "query { user(id: 1) { payments(page: 1, limit: 5) { id amount currency status createdAt } } }",
    "variables": {}
  }'
```

---

## Заметки

- Модуль использует **CQRS паттерн** — операции разделены на команды (запись) и запросы (чтение).
- **UserQueryRepository** (чтение) и **UserRepository** (запись) разделены, следуя принципу CQRS.
- Мягкое удаление реализовано через поле `deletedAt` — запись физически не удаляется из БД.
- Все query handlers при ошибках логируют через `AppLoggerService` и возвращают безопасные значения (не выбрасывают исключений).
- Command handlers при ошибках выбрасывают `GraphQLError` с кодом `Not found`.
- Поле `profile` у `User` опционально — у пользователя может не быть профиля.
- Интеграция с платежами использует двухэтапный подход: поиск пользователей по username → передача profileIds в payments микросервис.
- ResolveField `payments` вызывается напрямую через HTTP-клиент (не через CQRS).
- Все тесты модуля расположены в `apps/super-admin/test/unit/` (файлы: `user.mapper.spec.ts`, `user.query-repository.spec.ts`, `user.repository.spec.ts`, `users.resolver.spec.ts`, `ban-user.command-handler.spec.ts`, `unban-user.command-handler.spec.ts`, `deleted-user.command-handler.spec.ts`, `get-users.query-handler.spec.ts`, `get-user.query-handler.spec.ts`, `get-payments.query-handler.spec.ts`).
