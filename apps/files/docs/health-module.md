# Health Module — документация модуля проверки работоспособности

## Обзор

Модуль `health` в микросервисе `files` предоставляет эндпоинт для проверки работоспособности (health check) микросервиса. Используется для мониторинга и определения готовности сервиса принимать трафик (liveness/readiness probes).

Модуль проверяет состояние базы данных PostgreSQL через `PrismaService` и возвращает агрегированный статус.

---

## Архитектура модуля

```
modules/health/
├── health.controller.ts        # HTTP-контроллер
├── health.module.ts            # Модуль NestJS
└── health.service.ts            # Сервис проверки здоровья
```

### Зависимости модуля

- `PrismaService` — ORM для работы с PostgreSQL, используется для проверки соединения с БД

---

## API Endpoints

### Базовый путь: `/health`

> Эндпоинт не требует аутентификации и доступен без заголовков. Предназначен для внешних систем мониторинга (Kubernetes probes, load balancers).

---

### 1. Проверка работоспособности

**`GET /health`**

Возвращает агрегированный статус микросервиса и состояние всех зависимых сервисов.

#### Успешный ответ: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-05-13T09:27:43.000Z",
  "services": {
    "database": {
      "status": "up"
    }
  }
}
```

#### Ответ при деградации: `200 OK`

```json
{
  "status": "degraded",
  "timestamp": "2026-05-13T09:27:43.000Z",
  "services": {
    "database": {
      "status": "down",
      "error": "Error: connect ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```

> **Важно**: Эндпоинт возвращает статус `200 OK` даже при деградации одного из сервисов. Это позволяет системам мониторинга видеть детальную информацию о состоянии каждого компонента, а не получать ошибку HTTP.

#### Поля ответа

| Поле                       | Тип                 | Описание                                                                                                    |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `status`                   | `string`            | Агрегированный статус: `"ok"` — все сервисы работают, `"degraded"` — один или несколько сервисов недоступны |
| `timestamp`                | `string` (ISO 8601) | Время выполнения проверки в UTC                                                                             |
| `services`                 | `object`            | Объект с результатами проверки каждого зависимого сервиса                                                   |
| `services.database`        | `object`            | Результат проверки базы данных                                                                              |
| `services.database.status` | `string`            | Статус БД: `"up"` или `"down"`                                                                              |
| `services.database.error`  | `string` (optional) | Сообщение об ошибке, если БД недоступна                                                                     |

---

## Компоненты модуля

### Controller: `HealthController`

```typescript
@Controller('health')
export class HealthController
```

- Единственный эндпоинт `GET /health`
- Без защиты (public endpoint) — доступен для external health check систем
- Делегирует выполнение `HealthService.checkAll()`

### Service: `HealthService`

| Метод             | Описание                                                              | Возврат                                    |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| `checkDatabase()` | Проверяет соединение с PostgreSQL через `SELECT 1`                    | `Promise<HealthCheckResult>`               |
| `checkAll()`      | Агрегирует проверки всех зависимых сервисов и возвращает общий статус | `Promise<{ status, timestamp, services }>` |

#### Тип `HealthCheckResult`

```typescript
type HealthCheckResult = {
  status: 'up' | 'down';
  error?: string;
};
```

---

## Логика проверки

### `checkDatabase()`

1. Выполняет сырой SQL-запрос `SELECT 1` через `PrismaService.$queryRaw`
2. Если запрос успешен — возвращает `{ status: 'up' }`
3. Если запрос выбрасывает исключение — перехватывает ошибку и возвращает `{ status: 'down', error: '<error message>' }`

### `checkAll()`

1. Параллельно (или последовательно) запускает все проверки сервисов: на данный момент только `checkDatabase()`
2. Собирает результаты в объект `services`
3. Вычисляет агрегированный статус:
   - Если все сервисы `'up'` → общий статус `'ok'`
   - Если хотя бы один сервис `'down'` → общий статус `'degraded'`
4. Добавляет временную метку `timestamp` в формате ISO 8601
5. Возвращает объект с общим статусом, временем и детальными результатами

---

## Регистрация в модуле `FilesModule`

`HealthModule` импортируется в корневой модуль микросервиса:

```typescript
@Module({
  imports: [
    // ... другие модули
    HealthModule,
  ],
})
export class FilesModule {}
```

`HealthModule` самостоятельно регистрирует контроллер и сервис:

```typescript
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

---

## Тестирование

### Unit-тесты `HealthService`

Файл: `test/unit/modules/health/health.service.spec.ts`

Тесты проверяют два сценария:

| Сценарий      | Условие                                           | Ожидаемый результат                                                                    |
| ------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| БД доступна   | `$queryRaw` возвращает `[{ '?column?': 1 }]`      | `status: 'ok'`, `services.database.status: 'up'`                                       |
| БД недоступна | `$queryRaw` выбрасывает `Error('db unavailable')` | `status: 'degraded'`, `services.database: { status: 'down', error: 'db unavailable' }` |

#### Запуск тестов

```bash
# Все тесты files микросервиса
yarn test:unit:files

# Конкретный тест-сьют
npx jest apps/files/test/unit/modules/health/health.service.spec.ts
```

---

## Диаграмма последовательности

```
External System (Kubernetes/Monitoring) → GET /health
  │
  ├── HealthController.check()
  │   └── HealthService.checkAll()
  │       │
  │       └── HealthService.checkDatabase()
  │           ├── PrismaService.$queryRaw`SELECT 1`
  │           │   ├── ✅ Успех → { status: 'up' }
  │           │   └── ❌ Ошибка → { status: 'down', error: '...' }
  │           │
  │       ├── Агрегация результатов
  │       │   ├── Все 'up' → status: 'ok'
  │       │   └── Есть 'down' → status: 'degraded'
  │       │
  │       └── 🔄 Ответ: { status, timestamp, services }
  │
  └── 🔄 HTTP 200: JSON-ответ
```

---

## Возможные расширения (Future)

Модуль спроектирован с возможностью лёгкого добавления новых проверок:

- **S3/Объектное хранилище** — проверка доступности Yandex Object Storage (S3)
- **RabbitMQ** — проверка соединения с брокером сообщений
- **Redis** — проверка кэша (если будет добавлен)
- **Диск** — проверка свободного места на диске для загрузки файлов

Для добавления новой проверки необходимо:

1. Реализовать метод в `HealthService` (например, `checkS3(): Promise<HealthCheckResult>`)
2. Добавить вызов этого метода в `checkAll()`
3. Результат автоматически попадёт в ответ эндпоинта

---

## Конфигурация

Модуль не требует дополнительных переменных окружения. Для работы `checkDatabase()` используется стандартный `PrismaService`, который конфигурируется через переменную `DATABASE_URL`.

---

## Дополнительная информация

- Модуль следует принципу graceful degradation — недоступность одного сервиса не приводит к ошибке HTTP, а лишь меняет общий статус на `degraded`
- Эндпоинт не требует аутентификации, так как предназначен для внешних систем мониторинга, а не для пользовательских запросов
- Формат ответа совместим со стандартными HTTP health check провайдерами (Kubernetes, AWS ELB, Yandex Load Balancer)
