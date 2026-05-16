# Health Module — Super Admin

## Обзор

Модуль **health** микросервиса **super-admin** предоставляет эндпоинты для проверки работоспособности сервиса (health checks). Реализован в двух вариантах:

- **REST API** — `GET /health` — возвращает статус сервиса и его зависимостей (база данных).
- **GraphQL API** — запрос `health` — возвращает статус, время работы и состояние БД; запрос `version` — возвращает версию сервиса.

---

## Структура модуля

```
apps/super-admin/src/modules/health/
├── health.module.ts                    # NestJS модуль
├── health-rest.controller.ts           # REST контроллер (GET /health)
├── health-rest.service.ts              # Бизнес-логика проверки здоровья
├── health.resolver.ts                  # GraphQL резолвер (health, version)
└── schema/
    ├── health-response.schema.ts       # GraphQL тип HealthResponse
    └── database-health.schema.ts       # GraphQL тип DatabaseHealth
```

---

## REST API

### `GET /health`

Возвращает текущее состояние сервиса и всех зависимостей.

#### Ответ

```json
{
  "status": "ok",
  "timestamp": "2026-05-13T08:56:18.000Z",
  "services": {
    "database": {
      "status": "up"
    }
  }
}
```

| Поле        | Тип      | Описание                                          |
| ----------- | -------- | ------------------------------------------------- |
| `status`    | `String` | Общий статус: `"ok"` или `"degraded"`             |
| `timestamp` | `String` | Временная метка проверки (ISO 8601)               |
| `services`  | `Object` | Объект с результатами проверки каждой зависимости |

**Поле `services.database`:**

| Поле     | Тип      | Описание                                  |
| -------- | -------- | ----------------------------------------- |
| `status` | `String` | `"up"` — БД доступна; `"down"` — ошибка   |
| `error`  | `String` | Текст ошибки (только при status = "down") |

#### Пример cURL

```bash
curl http://localhost:3004/health
```

---

## GraphQL API

### Запрос `health`

**Endpoint:** `POST /api/v1/graphql`

Возвращает общий статус, время работы сервиса и информацию о состоянии базы данных.

#### Запрос

```graphql
query Health {
  health {
    status
    timestamp
    uptime
    database {
      status
      responseTime
    }
  }
}
```

#### Ответ

```json
{
  "data": {
    "health": {
      "status": "OK",
      "timestamp": "2026-05-13T08:56:18.000Z",
      "uptime": 12345.6,
      "database": {
        "status": "CONNECTED",
        "responseTime": 0
      }
    }
  }
}
```

| Поле                    | Тип              | Описание                        |
| ----------------------- | ---------------- | ------------------------------- |
| `status`                | `String`         | Статус сервиса (`"OK"`)         |
| `timestamp`             | `DateTime`       | Временная метка проверки        |
| `uptime`                | `Float`          | Время работы сервиса в секундах |
| `database`              | `DatabaseHealth` | Информация о состоянии БД       |
| `database.status`       | `String`         | Статус БД (`"CONNECTED"`)       |
| `database.responseTime` | `Float`          | Время ответа БД (мс)            |

---

### Запрос `version`

**Endpoint:** `POST /api/v1/graphql`

Возвращает версию сервиса super-admin.

#### Запрос

```graphql
query Version {
  version
}
```

#### Ответ

```json
{
  "data": {
    "version": "1.0.0"
  }
}
```

---

## Компоненты

### 1. HealthModule (`health.module.ts`)

```typescript
@Module({
  controllers: [HealthRestController],
  providers: [HealthResolver, HealthRestService],
})
export class HealthModule {}
```

Регистрирует REST контроллер, GraphQL резолвер и сервис проверки здоровья. Импортируется в `SuperAdminModule`.

### 2. HealthRestController (`health-rest.controller.ts`)

REST контроллер с единственным эндпоинтом `GET /health`.

- **Маршрут:** `/health`
- **Метод:** `check()`
- **Логика:** делегирует проверку сервису `HealthRestService.checkAll()`.
- **Не требует аутентификации** — эндпоинт публичный для accessibility мониторинга (Kubernetes liveness/readiness probes).

### 3. HealthRestService (`health-rest.service.ts`)

Сервис с методами проверки зависимостей.

**Методы:**

- `checkDatabase(): Promise<HealthCheckResult>` — выполняет сырой SQL-запрос `SELECT 1` через Prisma. При ошибке возвращает `{ status: 'down', error: '<message>' }`.
- `checkAll()` — агрегирует результаты всех проверок. Если БД доступна — общий статус `'ok'`, иначе `'degraded'`.

```typescript
type HealthCheckResult = { status: 'up' | 'down'; error?: string };
```

**Зависимости:**

- `PrismaService` — для проверки подключения к базе данных.

### 4. HealthResolver (`health.resolver.ts`)

GraphQL резолвер с двумя запросами.

- `health(): HealthResponse` — возвращает статический ответ со статусом `'OK'`, текущей временной меткой, `process.uptime()` и объектом `DatabaseHealth` со статусом `'CONNECTED'`.
- `version(): string` — возвращает строку `'1.0.0'`.

**Важно:** В отличие от REST-аналога, GraphQL запрос `health` **не выполняет реальную проверку БД** — поле `responseTime` всегда `0`, статус всегда `'CONNECTED'`. Это статический ответ.

### 5. HealthResponse (`schema/health-response.schema.ts`)

```typescript
@ObjectType()
export class HealthResponse {
  @Field({ description: 'Общий статус сервиса' })
  status: string;

  @Field({ description: 'Временная метка проверки' })
  timestamp: Date;

  @Field({ description: 'Время работы сервиса в секундах' })
  uptime: number;

  @Field(() => DatabaseHealth, { description: 'Информация о состоянии БД' })
  database: DatabaseHealth;
}
```

### 6. DatabaseHealth (`schema/database-health.schema.ts`)

```typescript
@ObjectType()
export class DatabaseHealth {
  @Field()
  status: string;

  @Field()
  responseTime: number;
}
```

---

## Тесты

### 1. HealthRestController (`test/unit/health-rest.controller.spec.ts`)

- Проверяет, что контроллер возвращает результат из сервиса.
- Использует mock для `HealthRestService`.

### 2. HealthResolver (`test/unit/health.resolver.spec.ts`)

- Проверяет, что резолвер создан.
- Проверяет структуру ответа `health()`:
  - `status` равен `'OK'`
  - `timestamp` является `Date`
  - `uptime` является числом
  - `database` определён, статус `'CONNECTED'`, `responseTime` — число
- Проверяет, что `version()` возвращает `'1.0.0'`.

---

## Отличия от REST и GraphQL реализации

| Аспект                   | REST (`GET /health`)                      | GraphQL (`health`, `version`)          |
| ------------------------ | ----------------------------------------- | -------------------------------------- |
| **Реальная проверка БД** | ✅ Да — выполняет `SELECT 1` через Prisma | ❌ Нет — возвращает статический ответ  |
| **Тип ответа**           | JSON (plain object)                       | GraphQL типы (HealthResponse)          |
| **Версия сервиса**       | ❌ Не возвращает                          | ✅ Через запрос `version`              |
| **Аутентификация**       | ❌ Публичный эндпоинт                     | ❌ Публичный запрос                    |
| **Uptime**               | ❌ Не возвращает                          | ✅ Возвращает через `process.uptime()` |

---

## Использование

### Kubernetes liveness/readiness probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3004
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3004
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Примеры вызовов

#### REST (cURL)

```bash
# Базовая проверка
curl http://localhost:3004/health

# Ответ при работающей БД
# {
#   "status": "ok",
#   "timestamp": "2026-05-13T08:56:18.000Z",
#   "services": {
#     "database": { "status": "up" }
#   }
# }
```

#### GraphQL (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ health { status timestamp uptime database { status responseTime } } }"
  }'

# Ответ
# {
#   "data": {
#     "health": {
#       "status": "OK",
#       "timestamp": "2026-05-13T08:56:18.000Z",
#       "uptime": 12345.6,
#       "database": { "status": "CONNECTED", "responseTime": 0 }
#     }
#   }
# }
```

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ version }" }'

# Ответ
# {
#   "data": {
#     "version": "1.0.0"
#   }
# }
```

---

## Заметки

- REST эндпоинт `GET /health` **не требует аутентификации** — предназначен для мониторинга инфраструктуры.
- GraphQL запросы `health` и `version` также **публичные** (не защищены `SuperAdminJwtGuard`).
- REST реализация выполняет реальную проверку подключения к БД через `PrismaService`.
- GraphQL реализация `health` возвращает **статический** ответ без реальной проверки зависимостей — это технический долг, который следует исправить для консистентности.
- Модуль не использует CQRS, RabbitMQ или внешние HTTP-клиенты.
- Версия сервиса (`'1.0.0'`) захардкожена в резолвере — рекомендуется вынести в переменную окружения или читать из `package.json`.
