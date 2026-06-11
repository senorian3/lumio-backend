# Модуль Sessions (Управление сессиями пользователей)

## Обзор

Модуль `Sessions` отвечает за управление пользовательскими сессиями в микросервисе `lumio`.  
Обеспечивает создание, обновление, получение и удаление (soft-delete) сессий, привязанных к устройству пользователя.

Каждая сессия однозначно идентифицируется парой `(userId, deviceId)` и содержит информацию об устройстве, IP-адресе и времени жизни JWT-токена.

---

## Структура модуля

```
sessions/
├── api/
│   ├── dto/
│   │   ├── output/
│   │   │   └── session.output.dto.ts     # Response DTO
│   │   └── transfer/
│   │       ├── delete-all-sessions.transfer.dto.ts
│   │       └── delete-session.dto.ts
│   └── sessions.controller.ts            # REST endpoints
├── application/
│   ├── commands/
│   │   ├── delete-all-sessions.command-handler.ts
│   │   └── delete-session.command-handler.ts
│   └── queries/
│       └── get-all-sessions.query-handler.ts
├── domain/
│   ├── dto/
│   │   ├── create-session.domain.dto.ts
│   │   ├── update-sesion.domain.dto.ts
│   │   ├── delete-session.domain.dto.ts
│   │   └── delete-all-sessions-exclude-current.domain.dto.ts
│   ├── infrastructure/
│   │   ├── session.repository.ts               # Write repository
│   │   ├── session.query.repository.ts          # Read repository
│   │   └── session.external-query.repository.ts # External read repository
│   └── session.entity.ts
├── sessions.module.ts
└── README.md
```

---

## Модель данных (Prisma)

```prisma
model Session {
  id           Int       @id @default(autoincrement())
  deletedAt    DateTime? @db.Timestamp(6)
  createdAt    DateTime  @default(now()) @db.Timestamp(6)
  expiresAt    DateTime  @db.Timestamp(6)
  deviceId     String    @db.VarChar(255)
  deviceName   String    @db.VarChar(255)
  ip           String    @db.VarChar(50)
  tokenVersion Int       @default(1)
  userId       Int
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([deletedAt])
}
```

### Поля

| Поле           | Тип       | Описание                                     |
| -------------- | --------- | -------------------------------------------- |
| `id`           | Int       | Первичный ключ                               |
| `deletedAt`    | DateTime? | Дата soft-delete сессии (`null` = активна)   |
| `createdAt`    | DateTime  | Дата создания сессии (соответствует `iat`)   |
| `expiresAt`    | DateTime  | Дата истечения сессии (соответствует `exp`)  |
| `deviceId`     | String    | Уникальный идентификатор устройства          |
| `deviceName`   | String    | Название устройства (User-Agent)             |
| `ip`           | String    | IP-адрес клиента                             |
| `tokenVersion` | Int       | Версия токена (используется для инвалидации) |
| `userId`       | Int       | Внешний ключ к `User`                        |

---

## API Endpoints

Базовый URL: `security/devices`

| Метод    | Path                          | Описание                                  | HTTP статус      |
| -------- | ----------------------------- | ----------------------------------------- | ---------------- |
| `GET`    | `/security/devices`           | Получить все активные сессии пользователя | `200 OK`         |
| `DELETE` | `/security/devices/:deviceId` | Удалить сессию по `deviceId`              | `204 No Content` |
| `DELETE` | `/security/devices`           | Удалить все сессии, кроме текущей         | `204 No Content` |

### Guards

- `ThrottlerGuard` — ограничение частоты запросов (rate limiting)
- `RefreshTokenGuard` — аутентификация по refresh-token (извлекает `userId` и `deviceId` из JWT)

---

## CQRS: Команды и Запросы

### GetAllSessionsQuery → GetAllSessionsQueryHandler

Возвращает список всех активных сессий пользователя.

```typescript
class GetAllSessionsQuery {
  constructor(public userId: number) {}
}
```

**Output:** `OutputSessionDto[]`

- `deviceName` — название устройства
- `ip` — IP-адрес
- `lastActiveDate` — дата последней активности (ISO string из `createdAt`)

### DeleteSessionCommand → DeleteSessionCommandHandler

Удаляет конкретную сессию по `deviceId` из параметра пути.

```typescript
class DeleteSessionCommand {
  constructor(public deleteSessionDto: DeleteSessionTransferDto) {}
}
```

**Transfer DTO:**

- `userId` — ID пользователя (из JWT)
- `userDeviceId` — `deviceId` текущей сессии (из JWT)
- `paramDeviceId` — `deviceId` из URL-параметра

**Бизнес-правила:**

1. Сессия с `paramDeviceId` должна существовать — иначе `NotFoundException`
2. Сессия должна принадлежать текущему пользователю — иначе `ForbiddenException`
3. Нельзя удалить свою текущую сессию — иначе `ForbiddenException`
4. При успехе — soft-delete (устанавливается `deletedAt`)

### DeleteAllSessionsCommand → DeleteAllSessionsCommandHandler

Удаляет все сессии пользователя, кроме текущей.

```typescript
class DeleteAllSessionsCommand {
  constructor(public deleteAllSessionsDto: DeleteAllSessionsTransferDto) {}
}
```

**Transfer DTO:**

- `userId` — ID пользователя (из JWT)
- `deviceId` — `deviceId` текущей сессии (из JWT)

**Бизнес-правила:**

1. Текущая сессия должна существовать — иначе `BadRequestException`
2. Всем остальным сессиям пользователя устанавливается `deletedAt`

---

## Domain DTO

| DTO                                        | Назначение                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `CreateSessionDomainDto`                   | Создание новой сессии (`userId`, `iat`, `exp`, `deviceId`, `ip`, `deviceName`) |
| `UpdateSessionDomainDto`                   | Обновление сессии (`sessionId`, `iat`, `exp`, `tokenVersion`)                  |
| `DeleteSessionDomainDto`                   | Удаление конкретной сессии (`deviceId`, `userId`, `sessionId`, `deletedAt`)    |
| `DeleteAllSessionsExcludeCurrentDomainDto` | Удаление всех сессий кроме текущей (`userId`, `sessionId`, `deletedAt`)        |

---

## Репозитории

### SessionRepository (Write)

| Метод                                   | Описание                                     |
| --------------------------------------- | -------------------------------------------- |
| `findSession(filters, tx?)`             | Поиск сессии по комбинации полей             |
| `createSession(dto, tx?)`               | Создание новой сессии                        |
| `updateSession(dto, tx?)`               | Обновление времени жизни и версии токена     |
| `deleteSession(dto)`                    | Soft-delete конкретной сессии                |
| `deleteAllSessionsExcludeCurrent(dto)`  | Soft-delete всех сессий кроме указанной      |
| `deleteAllSessionsForUser(userId, tx?)` | Физическое удаление всех сессий пользователя |

> Параметр `tx` опционален — позволяет выполнять операции в рамках Prisma-транзакции.

### QuerySessionsRepository (Read)

| Метод                    | Описание                                    |
| ------------------------ | ------------------------------------------- |
| `getAllSessions(userId)` | Получение всех активных сессий пользователя |

### ExternalQuerySessionsRepository (External Read)

| Метод                                           | Описание                                             |
| ----------------------------------------------- | ---------------------------------------------------- |
| `getSessionByUserAndDeviceId(userId, deviceId)` | Поиск одной активной сессии по `userId` и `deviceId` |

Используется другими модулями для проверки существования сессии.

---

## Жизненный цикл сессии

1. **Создание** — при успешной аутентификации (логин/регистрация) создаётся новая сессия с `tokenVersion = 1`
2. **Обновление** — при рефреше токена обновляются `createdAt`, `expiresAt` и инкрементируется `tokenVersion`
3. **Soft-delete** — при выходе (logout), удалении устройства или завершении всех сессий устанавливается `deletedAt`
4. **Физическое удаление** — при удалении пользователя (каскадно через Prisma)

---

## Безопасность

- Все endpoint'ы защищены `RefreshTokenGuard` и `ThrottlerGuard`
- `tokenVersion` позволяет инвалидировать старые refresh-токены
- Soft-delete сохраняет историю сессий для аудита

---

## Swagger

Swagger-декораторы находятся в `core/decorators/swagger/sessions/`:

| Декоратор                           | Описание                            |
| ----------------------------------- | ----------------------------------- |
| `ApiGetAllSessions`                 | Документация для GET endpoint       |
| `ApiDeleteSessionByDeviceId`        | Документация для DELETE по deviceId |
| `ApiDeleteAllSessionsExceptCurrent` | Документация для DELETE всех сессий |

---

## Тестирование

Unit-тесты расположены в `test/unit/modules/sessions/`:

| Файл                                          | Тестируемый компонент           |
| --------------------------------------------- | ------------------------------- |
| `sessions.controller.spec.ts`                 | SessionsController              |
| `get-all-sessions.query-handler.spec.ts`      | GetAllSessionsQueryHandler      |
| `delete-session.command-handler.spec.ts`      | DeleteSessionCommandHandler     |
| `delete-all-sessions.command-handler.spec.ts` | DeleteAllSessionsCommandHandler |
| `session.repository.spec.ts`                  | SessionRepository               |

---

## Зависимости модуля

- `@nestjs/cqrs` — CQRS паттерн (CommandBus, QueryBus)
- `@nestjs/jwt` — JWT-аутентификация
- `@generated/prisma-lumio` — Prisma-клиент
- `@lumio/prisma/prisma.service` — Сервис Prisma

Экспортирует: `SessionRepository` (используется модулем `UserAccounts` для создания/обновления сессий при аутентификации).

---

## Типовые ошибки

| HTTP статус | Код ошибки                  | Описание                                    |
| ----------- | --------------------------- | ------------------------------------------- |
| `400`       | `BadRequestDomainException` | Невозможно удалить все сессии (нет текущей) |
| `401`       | —                           | Нет или истёк refresh token                 |
| `403`       | `ForbiddenDomainException`  | Попытка удалить чужую или текущую сессию    |
| `404`       | `NotFoundDomainException`   | Устройство не найдено по `deviceId`         |
| `429`       | —                           | Превышен лимит запросов (ThrottlerGuard)    |
