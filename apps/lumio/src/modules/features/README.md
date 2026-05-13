# Модуль Features (Системные возможности)

Модуль `features` содержит инфраструктурные и системные возможности микросервиса `lumio`. В отличие от бизнес-модулей (`posts`, `payments`, `notifications` и т.д.), данный модуль не реализует предметную логику, а предоставляет технические endpoint'ы и механизмы, необходимые для эксплуатации сервиса.

## Состав модуля

```
features/
├── health/                          # Health-check endpoint
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── health.service.ts
├── health-monitoring/               # Мониторинг внешних сервисов
│   ├── health-monitoring.module.ts
│   └── health-monitoring.scheduler.ts
├── tests/                           # Тестовые endpoint'ы (dev/QA)
│   ├── testing.module.ts
│   └── testing.controller.ts
└── throttler/                       # Конфигурация rate limiting
    └── throttler.module.ts
```

---

## 1. Health (`/health`)

### Назначение

Предоставляет endpoint для проверки работоспособности (health check) микросервиса `lumio`. Используется системами оркестрации (Kubernetes), балансировщиками нагрузки и мониторингом.

### API

| Метод | Путь      | Описание                                  |
| ----- | --------- | ----------------------------------------- |
| GET   | `/health` | Возвращает статус всех зависимых сервисов |

### Пример ответа

```json
{
  "status": "ok",
  "timestamp": "2026-05-13T08:44:00.000Z",
  "services": {
    "database": {
      "status": "up"
    },
    "rabbitmq": {
      "status": "up"
    }
  }
}
```

### Проверяемые сервисы

| Сервис       | Механизм проверки                                        |
| ------------ | -------------------------------------------------------- |
| **Database** | Выполняет `SELECT 1` через Prisma                        |
| **RabbitMQ** | Устанавливает и закрывает TCP-соединение через `amqplib` |

### Логика ответа

- `status: "ok"` — если все сервисы `up`
- `status: "degraded"` — если хотя бы один сервис `down`

### Примечания

- Эндпоинт пропускает throttling (декоратор `@SkipThrottle()`).
- Требует авторизации через `@UseGuards(ThrottlerGuard)` для защиты от DDoS.
- Swagger-документация добавляется через декоратор `@ApiHealth()`.

---

## 2. Health Monitoring

### Назначение

Периодически опрашивает health-эндпоинты других микросервисов (`files`, `payments`, `super-admin`, `chat`) и логирует их статус. Не предоставляет внешнего API, работает фоново.

### Механизм

- **Период**: Каждую минуту (`EVERY_MINUTE`)
- **Инструмент**: `@nestjs/schedule` (Cron)
- **HTTP-клиент**: `@nestjs/axios` (Axios)
- **Таймаут запроса**: 5000 мс

### Отслеживаемые сервисы

| Сервис          | URL конфигурации                  |
| --------------- | --------------------------------- |
| **files**       | `coreConfig.filesServiceUrl`      |
| **payments**    | `coreConfig.paymentsServiceUrl`   |
| **super-admin** | `coreConfig.superAdminServiceUrl` |
| **chat**        | `coreConfig.chatServiceUrl`       |

### Формат URL для проверки

```
{serviceUrl}/api/v1/health
```

Если `serviceUrl` уже оканчивается на `/api/v1`, то путь строится как `{serviceUrl}/health`.

### Логирование

| Уровень | Условие                                              |
| ------- | ---------------------------------------------------- |
| `warn`  | HTTP-статус не 2xx                                   |
| `warn`  | Ответ получен, но `status` не равен `"ok"`           |
| `error` | HTTP-запрос упал с исключением (таймаут, DNS, отказ) |

### Настройка

Модуль импортируется в `CoreModule` и не требует ручной конфигурации. URL сервисов берутся из `CoreConfig`.

---

## 3. Testing

### Назначение

Предоставляет endpoint для полной очистки данных во всех микросервисах. Используется **только в средах разработки и тестирования** (должен быть отключён в production).

### API

| Метод  | Путь                | Код ответа | Описание                            |
| ------ | ------------------- | ---------- | ----------------------------------- |
| DELETE | `/testing/all-data` | 204        | Удаляет все данные во всех сервисах |

### Процесс очистки

1. **HTTP-запрос к `files`**: `DELETE {filesFrontendUrl}/api/v1/testing/all-data`
2. **HTTP-запрос к `payments`**: `DELETE {paymentsFrontendUrl}/api/v1/testing/all-data`
3. **Транзакция в БД `lumio`**: удаление записей в порядке зависимостей (сначала дочерние, затем родительские):

```
subscription
session
emailConfirmation
yandex
postFile
post
userProfile
user
idempotencyKey
```

### Ошибки

- Если внешний сервис (`files`, `payments`) вернул статус, отличный от 204, выбрасывается `Error`.
- Если транзакция БД упала, ошибка логируется в `console.error` и также выбрасывается `Error`.

### Безопасность

**В production-среде данный контроллер должен быть отключён.** Рекомендуется:

- Исключить `TestingModule` из импорта `AppModule` в production-сборке.
- Или добавить Guard, проверяющий `NODE_ENV`.

---

## 4. Throttler

### Назначение

Конфигурирует глобальный rate limiting (ограничение частоты запросов) для микросервиса `lumio` на основе библиотеки `@nestjs/throttler`.

### Конфигурация

| Параметр   | Источник                    | Описание                                             |
| ---------- | --------------------------- | ---------------------------------------------------- |
| `ttl` (ms) | `coreConfig.throttlerTtl`   | Временное окно, в течение которого считаются запросы |
| `limit`    | `coreConfig.throttlerLimit` | Максимальное количество запросов за `ttl`            |

### Подключение

Модуль экспортируется как динамический и импортируется в корневой `AppModule`:

```typescript
@Module({
  imports: [throttlerModule],
})
export class AppModule {}
```

### Использование

- Глобальный `ThrottlerGuard` применяется на уровне контроллеров с помощью `@UseGuards(ThrottlerGuard)`.
- Для отдельных endpoint'ов можно пропустить throttling через `@SkipThrottle()`.

---

## Зависимости

| Модуль            | Внешние зависимости                             |
| ----------------- | ----------------------------------------------- |
| health            | `PrismaModule`, `amqplib`                       |
| health-monitoring | `HttpModule` (axios), `@nestjs/schedule` (Cron) |
| testing           | `axios`, `PrismaService`, `CoreConfig`          |
| throttler         | `@nestjs/throttler`, `CoreConfig`               |

---

## Интеграция

Все модули `features` импортируются в `CoreModule` микросервиса `lumio`:

```
CoreModule
 ├── HealthModule
 ├── HealthMonitoringModule
 ├── TestingModule
 └── throttlerModule
```
