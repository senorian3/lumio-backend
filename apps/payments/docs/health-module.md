# Модуль Health (Payments Microservice)

## Обзор

Модуль **Health** предоставляет endpoint для проверки работоспособности (health check) микросервиса Payments. Он проверяет доступность критически важных внешних зависимостей сервиса — базы данных (PostgreSQL через Prisma) и RabbitMQ.

---

## Структура модуля

```
modules/health/
├── health.controller.ts   # HTTP-контроллер
├── health.module.ts       # Модуль NestJS
└── health.service.ts      # Сервис с логикой проверок
```

Тесты:

```
test/unit/modules/health/
└── health.service.spec.ts  # Unit-тесты сервиса
```

---

## Компоненты

### 1. HealthModule (`health.module.ts`)

Стандартный NestJS-модуль, регистрирующий контроллер и сервис.

```typescript
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

---

### 2. HealthController (`health.controller.ts`)

Обрабатывает HTTP GET-запросы на маршрут `/health`.

- **Endpoint**: `GET /health`
- **Аутентификация**: отсутствует (публичный endpoint)
- **Ответ**: результат проверки всех зависимостей

Инжектирует `HealthService` и `CoreConfig` для получения URL RabbitMQ.

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Get()
  async check() {
    return this.healthService.checkAll(this.coreConfig.rmqUrl);
  }
}
```

---

### 3. HealthService (`health.service.ts`)

Содержит основную логику проверки состояния зависимостей.

**Тип результата проверки:**

```typescript
type HealthCheckResult = { status: 'up' | 'down'; error?: string };
```

#### Методы:

| Метод                                                       | Описание                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `checkDatabase(): Promise<HealthCheckResult>`               | Проверяет соединение с PostgreSQL, выполняя `SELECT 1` через Prisma      |
| `checkRabbitMQ(rmqUrl: string): Promise<HealthCheckResult>` | Проверяет соединение с RabbitMQ, создавая и закрывая AMQP-подключение    |
| `checkAll(rmqUrl: string): Promise<HealthAggregateResult>`  | Запускает все проверки параллельно и возвращает агрегированный результат |

**Формат агрегированного ответа (`checkAll`):**

```json
{
  "status": "ok" | "degraded",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": {
      "status": "up" | "down",
      "error": "string (optional)"
    },
    "rabbitmq": {
      "status": "up" | "down",
      "error": "string (optional)"
    }
  }
}
```

- `status: "ok"` — когда все сервисы `up`
- `status: "degraded"` — когда хотя бы один сервис `down`
- `timestamp` — ISO-дата и время выполнения проверки

---

## Зависимости

| Зависимость                       | Назначение                                             |
| --------------------------------- | ------------------------------------------------------ |
| `@payments/prisma/prisma.service` | Prisma-клиент для проверки PostgreSQL                  |
| `@payments/core/core.config`      | Конфигурация (чтение `rmqUrl` из переменных окружения) |
| `amqplib`                         | AMQP-клиент для проверки RabbitMQ                      |

---

## Переменные окружения

Для работы модуля необходима переменная окружения, определённая в `CoreConfig`:

| Переменная | Пример значения         | Описание                   |
| ---------- | ----------------------- | -------------------------- |
| `RMQ_URL`  | `amqp://localhost:5672` | URL подключения к RabbitMQ |

---

## Обработка ошибок

- При недоступности базы данных метод `checkDatabase` возвращает `{ status: 'down', error: '<сообщение>' }`, а не выбрасывает исключение.
- При недоступности RabbitMQ метод `checkRabbitMQ` аналогично возвращает статус `down` с сообщением об ошибке.
- Исключения перехватываются и преобразуются в строку ошибки: `error instanceof Error ? error.message : String(error)`.

---

## Тестирование

Файл: `test/unit/modules/health/health.service.spec.ts`

**Проверяемые сценарии:**

1. **Happy path** — база данных и RabbitMQ отвечают → возвращается `status: "ok"`.
2. **RabbitMQ недоступен** — база данных отвечает, RabbitMQ падает → возвращается `status: "degraded"` с детальной ошибкой в `services.rabbitmq`.

**Моки:**

- `PrismaService.$queryRaw` — мокируется для имитации ответа БД
- `amqp.connect` — мокируется для имитации успешного/неуспешного подключения к RabbitMQ

---

## Использование

```bash
# Проверить состояние микросервиса Payments
curl http://localhost:3002/health
```

Пример успешного ответа:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": { "status": "up" },
    "rabbitmq": { "status": "up" }
  }
}
```

Пример ответа при недоступном RabbitMQ:

```json
{
  "status": "degraded",
  "timestamp": "2024-01-01T12:00:05.000Z",
  "services": {
    "database": { "status": "up" },
    "rabbitmq": { "status": "down", "error": "connect ECONNREFUSED ::1:5672" }
  }
}
```
