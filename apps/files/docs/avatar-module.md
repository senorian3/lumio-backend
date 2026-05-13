# Avatar Module — документация модуля аватаров

## Обзор

Модуль `avatar` в микросервисе `files` отвечает за загрузку, хранение и удаление аватаров пользователей. Аватар — это изображение профиля пользователя (JPEG/PNG), которое хранится в Object Storage (Yandex Cloud S3) с записью метаданных в базе данных PostgreSQL через Prisma ORM.

Модуль реализует **CQRS-паттерн**: каждый запрос проходит через Controller → Command Bus → Command Handler.

Все эндпоинты модуля — **внутренние** (Internal API), доступны только для доверенных микросервисов (например, `lumio`).

---

## Архитектура модуля

```
modules/avatar/
├── api/
│   └── avatar.controller.ts        # HTTP-контроллер
├── application/
│   └── commands/
│       ├── upload-user-avatar.command-handler.ts    # Хендлер загрузки
│       └── delete-user-avatar.command-handler.ts    # Хендлер удаления
└── domain/
    ├── dto/
    │   └── create-user-avatar.domain.dto.ts         # DTO для создания записи
    └── infrastructure/
        └── profile.repository.ts                    # Репозиторий для работы с БД
```

### Зависимости модуля (внешние)

- `S3FilesHttpAdapter` — адаптер для работы с Yandex Cloud Object Storage (S3)
- `InternalApiGuard` — Guard для защиты внутренних эндпоинтов
- Swagger-декораторы: `upload-user-avatar.decorator.ts`, `delete-user-avatar.decorator.ts`
- `PrismaService` — ORM для работы с PostgreSQL
- `ProfileRepository` — репозиторий для работы с таблицей `UserAvatar`

---

## Модель данных (Prisma)

```prisma
model UserAvatar {
  id        Int       @id @default(autoincrement())
  key       String    @unique                // Ключ объекта в S3
  url       String                            // Публичный URL аватара
  mimetype  String                            // MIME-тип (image/jpeg, image/png)
  size      Int                               // Размер файла в байтах
  createdAt DateTime  @default(now())         // Дата создания
  deletedAt DateTime?                         // Дата мягкого удаления
  userId    Int?      @unique                 // ID пользователя (уникальный — один аватар на пользователя)

  @@index([deletedAt])
}
```

🔑 Ограничения:

- `key` — уникален (один файл в S3)
- `userId` — уникален (один аватар на одного пользователя)
- `deletedAt` — индексирован для мягкого удаления

---

## API Endpoints

### Базовый путь: `/api/v1/files/profile`

> Фактический базовый путь в контроллере — `profile`. Полный путь формируется в route-конфигурации микросервиса (через `setGlobalPrefix`).

---

### 1. Загрузка аватара

**`POST /api/v1/files/profile/upload-user-avatar`**

Загружает новый аватар пользователя. Если у пользователя уже есть аватар — старый удаляется (из S3 и из БД).

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Body (multipart/form-data)

| Поле     | Тип             | Обязательное | Описание                                 |
| -------- | --------------- | :----------: | ---------------------------------------- |
| `avatar` | `file` (binary) |      ✅      | Изображение (JPEG/PNG, макс. 10MB)       |
| `userId` | `string`        |      ✅      | ID пользователя (конвертируется в число) |

#### Успешный ответ: `201 Created`

```json
{
  "url": "https://<bucket>.storage.yandexcloud.net/content/users/123/123_image_1_abc123.jpg"
}
```

#### Ошибки

| Статус | Описание               | Пример                                                                                     |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------ |
| `400`  | Неверный тип файла     | `File "avatar.gif" has invalid MIME type (image/gif). Only JPEG and PNG files are allowed` |
| `400`  | Файл превышает лимит   | `File "avatar.jpg" exceeds maximum size of 10MB`                                           |
| `400`  | Неверный userId        | `User ID must be a valid number`                                                           |
| `400`  | Аватар не предоставлен | `Avatar file is required`                                                                  |
| `404`  | Пользователь не найден | `User not found`                                                                           |

#### Логика работы

1. Валидация наличия файла — если `avatar` отсутствует, выбрасывается `BadRequestDomainException`
2. Загрузка файла в S3 через `S3FilesHttpAdapter.uploadFiles()` с типом `'users'`
3. Проверка существующего аватара пользователя через `ProfileRepository.getAvatarByUserId()`
4. Если старый аватар существует:
   - Удаление записи из БД (`ProfileRepository.deleteAvatar()`)
   - Удаление файла из S3 (`S3FilesHttpAdapter.deleteFile()`) — **критическая ошибка логируется, но не прерывает выполнение**
5. Создание новой записи в БД через `ProfileRepository.createUserAvatar()`
6. Возврат URL загруженного аватара

---

### 2. Удаление аватара

**`DELETE /api/v1/files/profile/:userId`**

Удаляет аватар пользователя (из БД и из S3).

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Path Parameters

| Параметр | Тип      | Обязательное | Описание        |
| -------- | -------- | :----------: | --------------- |
| `userId` | `number` |      ✅      | ID пользователя |

#### Успешный ответ: `204 No Content`

#### Ошибки

| Статус | Описание         | Пример                           |
| ------ | ---------------- | -------------------------------- |
| `400`  | Неверный userId  | `User ID must be a valid number` |
| `404`  | Аватар не найден | `Avatar is not found`            |

#### Логика работы

1. Поиск аватара по userId через `ProfileRepository.getAvatarByUserId()`
2. Если аватар не найден — `NotFoundDomainException`
3. Удаление записи из БД (`ProfileRepository.deleteAvatar()`)
4. Удаление файла из S3 (`S3FilesHttpAdapter.deleteFile()`) — **критическая ошибка S3 логируется, но не прерывает выполнение** (аватар из БД уже удалён)
5. Ответ `204 No Content`

---

## Компоненты модуля

### Controller: `AvatarController`

```typescript
@Controller('profile')
@UseGuards(InternalApiGuard)
@AllowInternalServices('lumio')
export class AvatarController
```

- Защищён `InternalApiGuard` — доступ только для внутренних микросервисов
- Ограничен вызовом только от микросервиса `lumio` через декоратор `@AllowInternalServices('lumio')`
- Использует `CommandBus` из @nestjs/cqrs для отправки команд

### Command Handlers

#### `UploadUserAvatarCommandHandler`

| Свойство    | Значение                                                      |
| ----------- | ------------------------------------------------------------- |
| Команда     | `UploadUserAvatarCommand`                                     |
| Возврат     | `string` (URL аватара)                                        |
| Зависимости | `S3FilesHttpAdapter`, `ProfileRepository`, `AppLoggerService` |

Обрабатывает полный цикл загрузки аватара с автоматической заменой старого.

#### `DeleteUserAvatarCommandHandler`

| Свойство    | Значение                                                      |
| ----------- | ------------------------------------------------------------- |
| Команда     | `DeleteUserAvatarCommand`                                     |
| Возврат     | `void`                                                        |
| Зависимости | `S3FilesHttpAdapter`, `ProfileRepository`, `AppLoggerService` |

---

### Repository: `ProfileRepository`

Набор методов для работы с таблицей `UserAvatar` в Prisma:

| Метод                                        | Описание                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| `createUserAvatar(dto: CreateUserAvatarDto)` | Создаёт запись аватара в БД                                |
| `deleteAvatar(id: number)`                   | Удаляет запись аватара по ID                               |
| `getAvatarByUserId(userId: number)`          | Ищет аватар пользователя (возвращает `UserAvatar \| null`) |

### Domain DTO: `CreateUserAvatarDto`

```typescript
export class CreateUserAvatarDto {
  constructor(
    public key: string, // Ключ в S3
    public url: string, // Публичный URL
    public mimetype: string, // MIME-тип
    public size: number, // Размер в байтах
    public userId?: number, // ID пользователя
  ) {}
}
```

---

## Безопасность (Internal API Guard)

Все эндпоинты модуля защищены `InternalApiGuard`:

1. Проверка наличия заголовка `x-service` — если отсутствует → `401 UnauthorizedDomainException`
2. Проверка наличия заголовка `x-api-key` — если отсутствует → `401 UnauthorizedDomainException`
3. Валидация API-ключа: сравнивает значение из заголовка с ключом для указанного сервиса в конфигурации (`coreConfig.internalApiKeys`)
4. Проверка, что вызывающий сервис (`lumio`) есть в списке разрешённых (`@AllowInternalServices('lumio')`)

---

## Интеграция с S3 (Yandex Cloud Object Storage)

`S3FilesHttpAdapter` используется для:

- **Загрузка файла**: `PutObjectCommand` → сохраняет по пути `content/users/{userId}/{fileName}`
- **Удаление файла**: `DeleteObjectCommand` → удаляет по S3-ключу

Формат ключа в S3:

```
content/users/{userId}/{userId}_image_{index}_{uuid}.{extension}
```

Пример:

```
content/users/123/123_image_1_a1b2c3.jpg
```

Публичный URL формируется как:

```
https://{bucketName}.storage.yandexcloud.net/{key}
```

---

## Регистрация в модуле `FilesModule`

В корневом модуле `files.module.ts` зарегистрированы:

| Компонент                        | Роль                       |
| -------------------------------- | -------------------------- |
| `AvatarController`               | Контроллер                 |
| `UploadUserAvatarCommandHandler` | Command handler (загрузка) |
| `DeleteUserAvatarCommandHandler` | Command handler (удаление) |
| `ProfileRepository`              | Repository (доступ к БД)   |
| `S3FilesHttpAdapter`             | Адаптер S3                 |

---

## Обработка ошибок

| Тип исключения                | Условие                                             | HTTP статус |
| ----------------------------- | --------------------------------------------------- | :---------: |
| `BadRequestDomainException`   | Отсутствует файл, неверный тип/размер/формат userId |     400     |
| `NotFoundDomainException`     | Аватар не найден при удалении                       |     404     |
| `UnauthorizedDomainException` | Неверный/отсутствующий API-ключ или сервис          |     401     |
| S3 `InternalServerError`      | Проблема с Object Storage                           |     500     |

### Graceful Degradation при ошибке S3

При удалении старого аватара во время загрузки нового:

- Удаление записи из БД — строгое (ошибка прерывает операцию)
- Удаление файла из S3 — мягкое (ошибка логируется, но не прерывает загрузку нового аватара)

Аналогично при удалении аватара:

- Удаление записи из БД — строгое
- Удаление файла из S3 — мягкое (аватар из БД уже удалён)

---

## Диаграмма последовательности

### Загрузка аватара

```
Client (lumio) → AvatarController.uploadUserAvatar()
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── CommandBus.execute(UploadUserAvatarCommand)
  │   └── UploadUserAvatarCommandHandler
  │       │
  │       ├── ✅ Валидация: файл существует
  │       │
  │       ├── S3FilesHttpAdapter.uploadFiles()
  │       │   └── ✅ Файл загружен в S3
  │       │
  │       ├── ProfileRepository.getAvatarByUserId()
  │       │   ├── ⬜ Аватара нет → пропуск
  │       │   └── ✅ Аватар есть:
  │       │       ├── ProfileRepository.deleteAvatar()
  │       │       └── S3FilesHttpAdapter.deleteFile() (мягкая ошибка)
  │       │
  │       └── ProfileRepository.createUserAvatar()
  │           └── ✅ Запись создана
  │
  └── 🔄 Ответ: { url: "https://..." } (201 Created)
```

### Удаление аватара

```
Client (lumio) → AvatarController.deleteUserAvatar()
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── CommandBus.execute(DeleteUserAvatarCommand)
  │   └── DeleteUserAvatarCommandHandler
  │       │
  │       ├── ProfileRepository.getAvatarByUserId()
  │       │   └── ✅ Аватар найден
  │       │
  │       ├── ProfileRepository.deleteAvatar()
  │       │   └── ✅ Запись удалена из БД
  │       │
  │       └── S3FilesHttpAdapter.deleteFile()
  │           └── ✅ Файл удалён из S3
  │
  └── 🔄 Ответ: 204 No Content
```

---

## Конфигурация (CoreConfig)

Модуль использует следующие переменные окружения через `CoreConfig`:

| Переменная             | Описание                                                  |
| ---------------------- | --------------------------------------------------------- |
| `S3_BUCKET_NAME`       | Название S3 bucket                                        |
| `S3_REGION`            | Регион S3 (например, `ru-central1`)                       |
| `S3_ENDPOINT`          | Endpoint S3 (например, `https://storage.yandexcloud.net`) |
| `S3_ACCESS_KEY_ID`     | Access Key ID для S3                                      |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key для S3                                  |
| `INTERNAL_API_KEYS`    | JSON-объект API-ключей для внутренних сервисов            |
| `DATABASE_URL`         | URL подключения к PostgreSQL                              |

---

## Дополнительная информация

- Модуль не имеет собственного модуля NestJS (`*.module.ts`) — компоненты регистрируются напрямую в `FilesModule`
- Для валидации буфера файла используется утилита `validateAndConvertBuffer()` из `@files/core/utils`
- Swagger-документация автоматически генерируется через декораторы `@ApiUploadUserAvatar()` и `@ApiDeleteUserAvatar()`
- Модуль использует `AppLoggerService` из `@libs/logger` для логирования критических ошибок S3
