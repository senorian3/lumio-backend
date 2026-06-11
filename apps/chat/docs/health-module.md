# Health Module — Документация

## Обзор

Модуль **health** микросервиса `chat` предоставляет эндпоинт для проверки состояния (health check) микросервиса. Используется для мониторинга жизнеспособности сервиса, в частности — доступности базы данных PostgreSQL.

### Основные возможности

- Проверка подключения к базе данных (Prisma / PostgreSQL)
- Агрегированный статус сервиса (`ok` / `degraded`)
- Timestamp проверки

---

## Архитектура модуля

Модуль организован по стандартной NestJS-структуре:

```
modules/health/
├── health.controller.ts    # HTTP-контроллер
├── health.module.ts        # Модуль NestJS
└── health.service.ts       # Бизнес-логика проверок
```

### Слои

| Компонент            | Ответственность                                   |
| -------------------- | ------------------------------------------------- |
| **HealthController** | Обработка HTTP-запроса `GET /health`              |
| **HealthService**    | Реализация проверок (БД и расширяемые в будущем)  |
| **HealthModule**     | Регистрация контроллера и сервиса в DI-контейнере |

---

## REST API

Базовый URL: `/health`

### 1. Проверка состояния сервиса

**`GET /health`**

Возвращает агрегированное состояние микросервиса `chat`.

#### Ответ (статус `ok`):

```json
{
  "status": "ok",
  "timestamp": "2026-05-13T12:00:00.000Z",
  "services": {
    "database": {
      "status": "up"
    }
  }
}
```

#### Ответ (статус `degraded` — БД недоступна):

```json
{
  "status": "degraded",
  "timestamp": "2026-05-13T12:00:00.000Z",
  "services": {
    "database": {
      "status": "down",
      "error": "Connection refused"
    }
  }
}
```

---

## Детали реализации

### HealthController

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.checkAll();
  }
}
```

- Простой контроллер без guards (доступен всем — используется балансировщиками / Kubernetes probes)
- Делегирует всю логику в `HealthService.checkAll()`

### HealthService

```typescript
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<HealthCheckResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkAll() {
    const database = await this.checkDatabase();

    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database,
      },
    };
  }
}
```

#### Методы сервиса

| Метод             | Описание                                                                                                                                           | Возврат                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `checkDatabase()` | Выполняет сырой SQL-запрос `SELECT 1` через Prisma. Если запрос успешен — БД доступна. При ошибке возвращает статус `down` с сообщением об ошибке. | `{ status: 'up' }` или `{ status: 'down', error: string }` |
| `checkAll()`      | Агрегирует результаты всех проверок (сейчас только БД). Определяет общий статус: `ok` если все сервисы `up`, `degraded` если хотя бы один `down`.  | `{ status, timestamp, services }`                          |

#### Тип HealthCheckResult

```typescript
type HealthCheckResult = {
  status: 'up' | 'down';
  error?: string;
};
```

---

## Поля ответа `GET /health`

| Поле                       | Тип                 | Описание                                                                                                 |
| -------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `status`                   | `string`            | Общий статус сервиса: `ok` — все проверки пройдены, `degraded` — одна или несколько проверок не пройдены |
| `timestamp`                | `string` (ISO 8601) | Время выполнения проверки                                                                                |
| `services`                 | `object`            | Объект с результатами проверок каждого компонента                                                        |
| `services.database`        | `object`            | Результат проверки базы данных                                                                           |
| `services.database.status` | `string`            | `up` — БД доступна, `down` — БД недоступна                                                               |
| `services.database.error`  | `string`            | Сообщение об ошибке (только при `status: 'down'`)                                                        |

---

## Расширяемость

Модуль спроектирован так, чтобы легко добавлять новые проверки. Для добавления новой проверки:

1. Создайте метод в `HealthService`, аналогичный `checkDatabase()`, возвращающий `HealthCheckResult`.
2. Добавьте вызов этого метода в `checkAll()` и включите результат в возвращаемый объект `services`.

Пример добавления проверки Redis:

```typescript
async checkRedis(): Promise<HealthCheckResult> {
  try {
    await this.redis.ping();
    return { status: 'up' };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async checkAll() {
  const [database, redis] = await Promise.all([
    this.checkDatabase(),
    this.checkRedis(),
  ]);

  const allUp = database.status === 'up' && redis.status === 'up';

  return {
    status: allUp ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database,
      redis,
    },
  };
}
```

---

## Использование в инфраструктуре

### Kubernetes Probes

Эндпоинт `/health` может использоваться для **liveness probe** и **readiness probe** в Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3004
  initialDelaySeconds: 10
  periodSeconds: 15
```

### Load Balancer

Балансировщики нагрузки могут проверять `/health` перед направлением трафика на инстанс.

---

## Конфигурация

Модуль health не требует дополнительных переменных окружения. Использует стандартный `PrismaService`, который уже сконфигурирован через `DATABASE_URL`.

---

## Зависимости

| Зависимость     | Назначение                                        |
| --------------- | ------------------------------------------------- |
| `PrismaService` | Выполнение ping-запроса к PostgreSQL (`SELECT 1`) |

---

## Для разработчика

### Быстрый старт

Модуль health не требует отдельной настройки. Он автоматически регистрируется в корневом модуле (`ChatModule`) и доступен после запуска микросервиса:

```bash
# Запуск микросервиса
yarn start:chat:dev

# Проверка health check
curl http://localhost:3004/health
```

### Добавление новой проверки

1. Откройте `health.service.ts`
2. Создайте метод с сигнатурой `async methodName(): Promise<HealthCheckResult>`
3. Вызовите его в `checkAll()` и добавьте в объект `services`

---

## Покрытие проверок

| Компонент  | Тип проверки | Что проверяется                    |
| ---------- | ------------ | ---------------------------------- |
| PostgreSQL | Ping         | Выполнение `SELECT 1` через Prisma |

Будущие возможные проверки:

- RabbitMQ (доступность message broker)
- Redis (доступность кэша)
- Внешние сервисы (files, lumio)
- Дисковое пространство
