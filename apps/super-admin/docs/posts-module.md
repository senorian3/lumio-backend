# Posts Module — Super Admin

## Обзор

Модуль **Posts** микросервиса **super-admin** предоставляет панель управления постами. Реализует **read-only** доступ к постам с пагинацией, сортировкой и поиском через GraphQL API, а также **real-time подписку** на создание новых постов через RabbitMQ.

Архитектура модуля построена на принципах **Clean Architecture / DDD** с использованием **CQRS** через `@nestjs/cqrs`.

---

## Структура модуля

```
apps/super-admin/src/modules/posts/
├── posts.module.ts                                    # NestJS модуль
├── api/
│   ├── posts.resolver.ts                              # GraphQL резолвер (query getPosts)
│   └── post-subscription.resolver.ts                   # GraphQL резолвер (subscription postCreated)
├── application/
│   ├── posts-subscription.service.ts                    # Подключение к RabbitMQ, pub/sub
│   └── queries/
│       └── get-posts.query-handler.ts                   # CQRS QueryHandler для getPosts
└── domain/
    ├── infrastructure/
    │   └── posts.query-repository.ts                    # Prisma репозиторий
    └── schema/
        └── post/
            ├── post.schema.ts                           # GraphQL ObjectType Post
            ├── post-file.schema.ts                      # GraphQL ObjectType PostFile
            ├── paginated-post.schema.ts                 # GraphQL ObjectType PaginatedPostResponse
            ├── post-created-subscription.schema.ts      # GraphQL типы для подписки
            └── post-sort-by.enum.ts                     # Enum сортировки PostSortBy
```

---

## GraphQL API

### Query `getPosts`

**Endpoint:** `POST /api/v1/graphql`

**Guard:** `@UseGuards(SuperAdminJwtGuard)` — требуется JWT токен.

Возвращает список постов с пагинацией, сортировкой и поиском.

#### Запрос

```graphql
query GetPosts(
  $pageNumber: Int = 1
  $pageSize: Int = 20
  $sortBy: PostSortBy = DATE_DESC
  $search: String
) {
  getPosts(
    pageNumber: $pageNumber
    pageSize: $pageSize
    sortBy: $sortBy
    search: $search
  ) {
    page
    pageSize
    pagesCount
    totalCount
    items {
      id
      description
      createdAt
      deletedAt
      userId
      user {
        id
        username
      }
      files {
        id
        url
        createdAt
      }
    }
  }
}
```

**Переменные:**

| Поле         | Тип          | По умолчанию | Обязательное | Описание                       |
| ------------ | ------------ | :----------: | :----------: | ------------------------------ |
| `pageNumber` | `Int`        |     `1`      |      ❌      | Номер страницы                 |
| `pageSize`   | `Int`        |     `20`     |      ❌      | Количество записей на странице |
| `sortBy`     | `PostSortBy` | `DATE_DESC`  |      ❌      | Тип сортировки (см. ниже)      |
| `search`     | `String`     |    `null`    |      ❌      | Поиск по username автора       |

#### Ответ

```json
{
  "data": {
    "getPosts": {
      "page": 1,
      "pageSize": 20,
      "pagesCount": 5,
      "totalCount": 100,
      "items": [
        {
          "id": "post_abc123",
          "description": "Description of the post",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "deletedAt": null,
          "userId": 42,
          "user": {
            "id": 42,
            "username": "john_doe"
          },
          "files": [
            {
              "id": 1,
              "url": "https://example.com/file.jpg",
              "createdAt": "2024-01-15T10:30:00.000Z"
            }
          ]
        }
      ]
    }
  }
}
```

---

### Subscription `postCreated`

**Endpoint:** WebSocket (GraphQL Subscriptions) `ws://host/api/v1/graphql`

Real-time подписка на создание новых постов. При создании поста в микросервисе **lumio** событие отправляется через RabbitMQ в exchange `lumio_events` с routing key `post.created`, и super-admin транслирует его через GraphQL Subscription.

#### Запрос

```graphql
subscription PostCreated {
  postCreated {
    id
    description
    createdAt
    deletedAt
    user {
      id
    }
    files {
      id
      url
      createdAt
    }
  }
}
```

#### Ответ (при получении события)

```json
{
  "data": {
    "postCreated": {
      "id": "post_def456",
      "description": "New post description",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "deletedAt": null,
      "user": {
        "id": 42
      },
      "files": [
        {
          "id": 1,
          "url": "https://example.com/new-file.jpg",
          "createdAt": "2024-01-15T12:00:00.000Z"
        }
      ]
    }
  }
}
```

#### Ошибки

Подписка не требует JWT токена. При ошибке парсинга события из RabbitMQ сообщение отправляется в **dead letter queue** (nack без requeue).

---

## Компоненты

### 1. PostsModule (`posts.module.ts`)

```typescript
@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [
    PostResolver,
    PostSubscriptionResolver,
    PostsQueryRepository,
    GetPostsQueryHandler,
    PostsSubscriptionService,
  ],
})
export class PostsModule {}
```

Модуль регистрирует:

- **2 резолвера** — PostResolver и PostSubscriptionResolver
- **1 репозиторий** — PostsQueryRepository
- **1 query handler** — GetPostsQueryHandler
- **1 сервис подписки** — PostsSubscriptionService

Импортирует `PrismaModule` для работы с БД и `CqrsModule` для CQRS.

---

### 2. PostResolver (`api/posts.resolver.ts`)

GraphQL резолвер с query `getPosts`. Защищён декоратором `@UseGuards(SuperAdminJwtGuard)`.

**Логика работы:**

1. Принимает параметры пагинации (`pageNumber`, `pageSize`), сортировки (`sortBy`) и поиска (`search`).
2. Создаёт экземпляр `GetPostsQuery` и отправляет его в `QueryBus`.
3. `GetPostsQueryHandler` обрабатывает запрос и возвращает `PaginatedPostResponse`.

**ResolveField:**

- `user` — возвращает автора поста (родительское поле из include).
- `files` — возвращает список файлов поста (родительское поле из include).

---

### 3. PostSubscriptionResolver (`api/post-subscription.resolver.ts`)

GraphQL резолвер с subscription `postCreated`.

**Логика работы:**

1. Декорирован `@Subscription(() => PostCreatedSubscription)` с name `postCreated`.
2. В `resolve` извлекает `value?.postCreated` для правильной структуры ответа.
3. Использует `PubSub` из сервиса `PostsSubscriptionService` для async-итерации.

---

### 4. PostsSubscriptionService (`application/posts-subscription.service.ts`)

Реализует `OnModuleInit` и `OnModuleDestroy`. Сервис отвечает за подключение к RabbitMQ и публикацию событий через `PubSub`.

**Логика работы:**

1. При инициализации модуля (`onModuleInit`) подключается к RabbitMQ.
2. Создаёт exchange `lumio_events` типа `topic` (durable).
3. Создаёт очередь `super-admin_posts_queue` (durable).
4. Привязывает очередь к exchange с routing key `post.created`.
5. Начинает consume сообщений из очереди.
6. При получении сообщения:
   - Парсит JSON из `msg.content`.
   - Маппит данные в `PostCreatedSubscription`.
   - Публикует через `pubSub.publish('postCreated', { postCreated: postData })`.
   - Подтверждает сообщение (`channel.ack`).
   - При ошибке — отклоняет без requeue (`channel.nack`).
7. При уничтожении модуля (`onModuleDestroy`) закрывает channel и connection.
8. При ошибке подключения — логирует warning и продолжает работу (без повторного подключения).

**Важно:** Сервис использует `graphql-subscriptions` библиотеку `PubSub` (in-memory), а не `@nestjs/graphql` встроенный pub/sub.

---

### 5. GetPostsQueryHandler (`application/queries/get-posts.query-handler.ts`)

CQRS QueryHandler для запроса `GetPostsQuery`.

**Класс запроса:**

```typescript
export class GetPostsQuery {
  constructor(
    public readonly pageNumber: number = 1,
    public readonly pageSize: number = 10,
    public readonly sortBy: PostSortBy = PostSortBy.DATE_DESC,
    public readonly search?: string,
  ) {}
}
```

**Логика обработки:**

1. Параллельно вызывает `postsQueryRepository.findPosts()` и `postsQueryRepository.countPosts()`.
2. Маппит Prisma-сущности в GraphQL-схемы (`Post[]`).
3. Вычисляет `pagesCount = Math.ceil(totalCount / pageSize)`.
4. Возвращает `PaginatedPostResponse`.

---

### 6. PostsQueryRepository (`domain/infrastructure/posts.query-repository.ts`)

Prisma-репозиторий для чтения постов из БД.

**Методы:**

#### `findPosts(page, pageSize, sortBy, search?)`

- Вычисляет `skip = (page - 1) * pageSize`.
- Если передан `search`:
  - Фильтр: `deletedAt: null` + `user.username contains search`.
- Без `search`:
  - Фильтр: только `deletedAt: null`.
- Сортировка через `getOrderBy()`.
- Include: `user` (весь объект) и `files` (только где `deletedAt: null`).

#### `countPosts(search?)`

- Аналогичный `where` фильтр как в `findPosts`.
- Возвращает количество записей.

#### `getOrderBy(sortBy)`

| Значение `sortBy` | Сортировка            |
| ----------------- | --------------------- |
| `DATE_ASC`        | `createdAt: asc`      |
| `DATE_DESC`       | `createdAt: desc`     |
| `USERNAME_ASC`    | `user.username: asc`  |
| `USERNAME_DESC`   | `user.username: desc` |

---

## GraphQL Схемы (ObjectType)

### Post (`post.schema.ts`)

```typescript
@ObjectType()
export class Post {
  id: string; // Уникальный идентификатор поста
  description: string; // Описание поста (nullable)
  createdAt: Date; // Дата создания
  deletedAt: Date; // Дата удаления (nullable, soft delete)
  userId: number; // ID автора поста
  user: User; // Автор поста
  files: PostFile[]; // Файлы поста
}
```

### PostFile (`post-file.schema.ts`)

```typescript
@ObjectType()
export class PostFile {
  id: number; // Уникальный идентификатор файла
  postId: string; // ID поста
  url: string; // URL файла
  createdAt: Date; // Дата создания
  deletedAt: Date; // Дата удаления (nullable)
  post?: Post; // Пост, к которому относится файл (nullable)
}
```

### PaginatedPostResponse (`paginated-post.schema.ts`)

```typescript
@ObjectType()
export class PaginatedPostResponse {
  page: number; // Текущая страница
  pageSize: number; // Количество записей на странице
  pagesCount: number; // Общее количество страниц
  totalCount: number; // Общее количество записей
  items: Post[]; // Список постов
}
```

### PostCreatedSubscription (`post-created-subscription.schema.ts`)

Содержит три ObjectType:

- **PostCreatedSubscription** — основная схема подписки:
  - `id` (string), `description` (string, nullable), `createdAt` (Date), `deletedAt` (Date, nullable)
  - `user` (PostCreatedUser) — вложенный объект с `id`
  - `files` (PostCreatedFile[]) — массив вложенных объектов

- **PostCreatedUser** — упрощённый пользователь:
  - `id` (number)

- **PostCreatedFile** — упрощённый файл:
  - `id` (number), `url` (string), `createdAt` (Date)

### PostSortBy Enum (`post-sort-by.enum.ts`)

| Значение        | Описание                            |
| --------------- | ----------------------------------- |
| `DATE_ASC`      | Сортировка по дате (сначала старые) |
| `DATE_DESC`     | Сортировка по дате (сначала новые)  |
| `USERNAME_ASC`  | Сортировка по username (A → Z)      |
| `USERNAME_DESC` | Сортировка по username (Z → A)      |

Зарегистрирован через `registerEnumType(PostSortBy, { name: 'PostSortBy' })`.

---

## Схема работы (Data Flow)

### Query `getPosts`

```
Client (Admin Panel)                 PostResolver              GetPostsQueryHandler        PostsQueryRepository        Prisma/DB
         │                                │                          │                           │                        │
         │ Query: getPosts(page, size,    │                          │                           │                        │
         │        sortBy, search)         │                          │                           │                        │
         │ ────────────────────────────>  │                          │                           │                        │
         │                                │  Execute GetPostsQuery   │                           │                        │
         │                                │ ──────────────────────>  │                           │                        │
         │                                │                          │  findPosts(count)         │                        │
         │                                │                          │ ────────────────────────> │                        │
         │                                │                          │                           │  Prisma query          │
         │                                │                          │                           │ ─────────────────────> │
         │                                │                          │                           │ <───────────────────── │
         │                                │                          │ <──────────────────────── │                        │
         │                                │  < PaginatedPostResponse │                           │                        │
         │                                │                          │                           │                        │
         │  < PaginatedPostResponse       │                          │                           │                        │
         │                                │                          │                           │                        │
```

### Subscription `postCreated`

```
Lumio Microservice    RabbitMQ                    PostsSubscriptionService        PubSub (in-memory)     Client (Admin Panel)
         │                │                                │                           │                        │
         │                │                                │  Subscribe: postCreated    │                        │
         │                │                                │ <────────────────────────────────────────────────── │
         │                │                                │                           │                        │
         │  Publish event │                                │                           │                        │
         │  (post.created)│                                │                           │                        │
         │ ─────────────> │                                │                           │                        │
         │                │  Consume super-admin_posts_q   │                           │                        │
         │                │ ────────────────────────────>  │                           │                        │
         │                │                                │  Parse JSON → PostCreated │                        │
         │                │                                │  pubSub.publish()         │                        │
         │                │                                │ ──────────────────────>  │                        │
         │                │                                │                           │  AsyncIterator next() │
         │                │                                │                           │ ─────────────────────> │
         │                │                                │                           │ <───────────────────── │
         │                │                                │  ack()                    │                        │
         │                │ <────────────────────────────  │                           │                        │
         │                │                                │                           │                        │
```

---

## Конфигурация (Env Variables)

Переменные окружения, используемые модулем posts:

| Переменная      | Тип      | По умолчанию | Описание                       |
| --------------- | -------- | :----------: | ------------------------------ |
| `RABBIT_MQ_URL` | `String` |      —       | URL для подключения к RabbitMQ |

URL RabbitMQ передаётся через `CoreConfig.rmqUrl`.

---

## Защищённые эндпоинты

| Эндпоинт                   | Guard                | Описание                    |
| -------------------------- | -------------------- | --------------------------- |
| `query getPosts`           | `SuperAdminJwtGuard` | Требуется JWT токен         |
| `subscription postCreated` | Не защищён           | Доступно без аутентификации |

---

## Обработка ошибок

### Query getPosts

При отсутствии JWT токена:

```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

### Subscription postCreated (RabbitMQ)

При ошибке парсинга сообщения из RabbitMQ:

- Сообщение отклоняется без повторной постановки в очередь (`channel.nack(msg, false, false)`).
- Ошибка логируется через `AppLoggerService`.
- Клиенту ошибка не возвращается (подписка продолжает работу).

---

## Примеры вызовов

### Запрос списка постов (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "query": "query GetPosts($pageNumber: Int, $pageSize: Int, $sortBy: PostSortBy, $search: String) { getPosts(pageNumber: $pageNumber, pageSize: $pageSize, sortBy: $sortBy, search: $search) { page pageSize pagesCount totalCount items { id description createdAt userId } } }",
    "variables": {
      "pageNumber": 1,
      "pageSize": 10,
      "sortBy": "DATE_DESC",
      "search": null
    }
  }'
```

### Поиск постов по username

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "query": "query GetPosts($search: String) { getPosts(search: $search) { items { id description user { username } } } }",
    "variables": {
      "search": "john"
    }
  }'
```

### Подписка на новые посты (WebSocket через graphql-ws)

```graphql
subscription {
  postCreated {
    id
    description
    createdAt
    user {
      id
    }
    files {
      url
    }
  }
}
```

---

## Отличия от других модулей super-admin

| Аспект          | Posts Module                                      | Auth Module                      |
| --------------- | ------------------------------------------------- | -------------------------------- |
| **Архитектура** | Clean Architecture + CQRS                         | Простой резолвер без CQRS        |
| **База данных** | Prisma (чтение), soft-delete                      | Не использует БД                 |
| **RabbitMQ**    | Да (подписка на post.created)                     | Нет                              |
| **Real-time**   | GraphQL Subscription (`postCreated`)              | Нет                              |
| **CQRS**        | Да (QueryBus + QueryHandler)                      | Нет                              |
| **Пагинация**   | Да (page, pageSize, pagesCount, totalCount)       | Нет                              |
| **Сортировка**  | Да (4 варианта: DATE_ASC/DESC, USERNAME_ASC/DESC) | Нет                              |
| **Поиск**       | Да (по username)                                  | Нет                              |
| **JWT Guard**   | Да (на query getPosts)                            | Да (на все защищённые эндпоинты) |

---

## Заметки

- **Read-only:** Модуль предоставляет только чтение постов. Создание, обновление и удаление происходит в микросервисе **lumio**.
- **Soft delete:** Посты с `deletedAt != null` не возвращаются в результатах query. Файлы также фильтруются по `deletedAt: null`.
- **RabbitMQ reconnection:** При потере соединения с RabbitMQ сервис логирует warning, но **не реализован механизм автоматического переподключения** — требуется рестарт модуля.
- **PubSub in-memory:** Используется `graphql-subscriptions` PubSub, который хранит подписки в памяти процесса. При горизонтальном масштабировании (несколько инстансов) потребуется замена на Redis PubSub.
- **GraphQL subscription не защищён JWT:** Подписка `postCreated` доступна без аутентификации.
