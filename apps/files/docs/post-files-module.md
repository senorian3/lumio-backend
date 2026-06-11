# Post Files Module — документация модуля файлов постов

## Обзор

Модуль `post-files` в микросервисе `files` отвечает за загрузку, получение и удаление файлов, прикреплённых к постам пользователей. Файлы хранятся в Object Storage (Yandex Cloud S3) с записью метаданных в базе данных PostgreSQL через Prisma ORM.

Модуль реализует **CQRS-паттерн**: запросы на чтение проходят через Controller → QueryBus → QueryHandler, запросы на запись — через Controller → CommandBus → CommandHandler.

Все эндпоинты модуля — **внутренние** (Internal API), доступны только для доверенных микросервисов (например, `lumio`, `super-admin`).

---

## Архитектура модуля

```
modules/post-files/
├── api/
│   ├── dto/
│   │   └── input/
│   │       ├── get-user-post.input.dto.ts      # DTO для получения файлов по ID постов
│   │       └── upload-files.input.dto.ts        # DTO для загрузки файлов
│   └── post-files.controller.ts                 # HTTP-контроллер
├── application/
│   ├── commands/
│   │   ├── upload-post-file.command-handler.ts           # Загрузка файлов поста
│   │   ├── deleted-post-files.command-handler.ts         # Удаление всех файлов поста
│   │   └── delete-file-by-key.command-handler.ts         # Удаление одного файла по S3-ключу
│   └── queries/
│       ├── get-all-files-by-post.query-handler.ts        # Получение файлов по ID поста
│       ├── get-all-files-by-post-ids.query-handler.ts    # Получение файлов по массиву ID постов
│       └── get-all-files-by-user-id.query-handler.ts     # Получение файлов пользователя (с пагинацией)
└── domain/
    ├── dto/
    │   └── create-file.domain.dto.ts            # DTO для создания записи файла
    ├── entities/
    │   └── post-file.entity.ts                  # Entity файла
    └── infrastructure/
        ├── file.repository.ts                   # Репозиторий для записи (создание, удаление)
        └── file.query.repository.ts             # Репозиторий для чтения (запросы)
```

### Зависимости модуля (внешние)

- `S3FilesHttpAdapter` — адаптер для работы с Yandex Cloud Object Storage (S3)
- `InternalApiGuard` — Guard для защиты внутренних эндпоинтов
- Swagger-декораторы: `get-post-files.decorator.ts`, `upload-post-files.decorator.ts`, `delete-post-files.decorator.ts`, `delete-file-by-key.decorator.ts`, `get-user-files.decorator.ts`
- `PrismaService` — ORM для работы с PostgreSQL
- `FileRepository` — репозиторий для операций записи (таблица `PostFile`)
- `QueryFileRepository` — репозиторий для операций чтения (таблица `PostFile`)
- `AppLoggerService` — сервис логирования из `@libs/logger`

---

## Модель данных (Prisma)

```prisma
model PostFile {
  id        Int       @id @default(autoincrement())
  key       String    @unique                    // Ключ объекта в S3
  url       String                                // Публичный URL файла
  mimetype  String                                // MIME-тип (image/jpeg, image/png, video/mp4, etc.)
  size      Int                                   // Размер файла в байтах
  createdAt DateTime  @default(now())             // Дата создания
  deletedAt DateTime?                             // Дата мягкого удаления
  postId    String?                               // ID поста
  userId    Int?                                  // ID пользователя-владельца

  @@index([postId])
  @@index([deletedAt])
  @@index([userId])
}
```

🔑 Ограничения:

- `key` — уникален (один файл в S3)
- `postId` — не обязателен (`String?`), индексирован для быстрого поиска файлов по посту
- `deletedAt` — индексирован для мягкого удаления
- `userId` — индексирован для поиска файлов пользователя

---

## API Endpoints

### Базовый путь: `/api/v1/files`

---

### 1. Получение файлов по ID постов

**`GET /api/v1/files`**

Возвращает файлы для указанных ID постов.

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Body (JSON)

| Поле      | Тип        | Обязательное | Описание         |
| --------- | ---------- | :----------: | ---------------- |
| `postIds` | `string[]` |      ✅      | Массив ID постов |

#### Пример запроса

```json
{
  "postIds": ["post-uuid-1", "post-uuid-2"]
}
```

#### Успешный ответ: `200 OK`

```json
[
  {
    "id": 1,
    "url": "https://<bucket>.storage.yandexcloud.net/content/posts/post-uuid-1/post-uuid-1_image_1_a1b2c3.jpg",
    "postId": "post-uuid-1",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
]
```

#### Ошибки

| Статус | Описание                              |
| ------ | ------------------------------------- |
| `400`  | Невалидный формат postIds (не массив) |
| `401`  | Отсутствует или неверный API-ключ     |

#### Логика работы

1. Валидация входных данных через `InputGetUserPostsDto` (массив строк)
2. Вызов команды `GetAllFilesByPostIdsQuery` через QueryBus
3. `GetAllFilesByPostIdsQueryHandler` обращается к `QueryFileRepository.getAllFilesByPostIds()`
4. Возвращает массив `PostFileEntity`, отфильтрованных по `postId`
5. Маппинг в `OutputFileType` (id, url, postId, createdAt)
6. Если `postIds` пустой или `null` — возвращается пустой массив

---

### 2. Загрузка файлов поста

**`POST /api/v1/files/upload-post-files`**

Загружает один или несколько файлов для указанного поста.

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Body (multipart/form-data)

| Поле     | Тип                 | Обязательное | Описание                                  |
| -------- | ------------------- | :----------: | ----------------------------------------- |
| `files`  | `file[]` (multiple) |      ✅      | Массив файлов (изображения, видео и т.д.) |
| `postId` | `string`            |      ✅      | ID поста                                  |
| `userId` | `number`            |      ✅      | ID пользователя-владельца                 |

> Поле `files` обрабатывается через `FilesInterceptor('files')` из `@nestjs/platform-express`.

#### Успешный ответ: `201 Created`

```json
[
  {
    "id": 1,
    "url": "https://<bucket>.storage.yandexcloud.net/content/posts/post-uuid-1/post-uuid-1_image_1_a1b2c3.jpg",
    "postId": "post-uuid-1",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
]
```

> Ответ содержит актуальный список всех файлов поста после загрузки.

#### Ошибки

| Статус | Описание                                 |
| ------ | ---------------------------------------- |
| `400`  | Невалидные данные (postId, userId)       |
| `401`  | Отсутствует или неверный API-ключ        |
| `500`  | Ошибка S3 при загрузке или БД при записи |

#### Логика работы

1. `@UploadedFiles()` получает массив файлов от `FilesInterceptor`
2. Вызов команды `UploadFilesCreatedPostCommand` через CommandBus
3. `UploadFilesCreatedPostCommandHandler`:
   - Загружает каждый файл в S3 через `S3FilesHttpAdapter.uploadFiles()` с типом `'posts'`
   - Создаёт записи в БД через `FileRepository.createFiles()`
4. После успешной загрузки — запрос `GetAllFilesByPostUserQuery` для получения актуального списка файлов
5. Ответ содержит все файлы поста после загрузки

**Транзакционная безопасность:**

- Если запись в БД не удалась — запускается `cleanupS3Files()` для удаления уже загруженных в S3 файлов
- Ошибка `cleanupS3Files()` логируется как критическая, но не вызывает повторного исключения

---

### 3. Удаление всех файлов поста

**`DELETE /api/v1/files/delete-post-files/:postId`**

Мягко удаляет все файлы указанного поста (проставляет `deletedAt`).

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Path Parameters

| Параметр | Тип      | Обязательное | Описание |
| -------- | -------- | :----------: | -------- |
| `postId` | `string` |      ✅      | ID поста |

#### Успешный ответ: `200 OK`

> Тело ответа отсутствует.

#### Ошибки

| Статус | Описание                          |
| ------ | --------------------------------- |
| `401`  | Отсутствует или неверный API-ключ |
| `500`  | Ошибка БД при мягком удалении     |

#### Логика работы

1. Вызов команды `DeletedPostFilesCommand` через CommandBus
2. `DeletedPostFilesCommandHandler`:
   - Поиск всех не удалённых файлов поста через `FileRepository.findFilesByPostId()`
   - Если файлы не найдены — выход без ошибки (идепотентность)
   - **Жёсткий шаг**: `FileRepository.softDeleteFilesByPostId()` — проставляет `deletedAt` для всех файлов поста
   - **Мягкий шаг**: Для каждого файла — `S3FilesHttpAdapter.deleteFile()` для удаления из S3
3. Ошибка S3 логируется, но не прерывает выполнение (старые файлы в S3 могут остаться)

---

### 4. Удаление одного файла по S3-ключу

**`DELETE /api/v1/files/delete-file/:key`**

Удаляет один файл из S3 по его полному пути (ключу).

#### Заголовки

| Header      | Значение             | Описание                           |
| ----------- | -------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>` | Ключ для внутренней аутентификации |
| `x-service` | `lumio`              | Имя вызывающего микросервиса       |

#### Path Parameters

| Параметр | Тип      | Обязательное | Описание                           |
| -------- | -------- | :----------: | ---------------------------------- |
| `key`    | `string` |      ✅      | Полный S3-ключ файла (URL-encoded) |

> ⚠️ Параметр передаётся в URL, поэтому ключ должен быть закодирован (`encodeURIComponent`).

#### Пример

```
DELETE /api/v1/files/delete-file/content%2Fposts%2Fpost-uuid-1%2Fpost-uuid-1_image_1_a1b2c3.jpg
```

#### Успешный ответ: `200 OK`

> Тело ответа отсутствует.

#### Ошибки

| Статус | Описание                          |
| ------ | --------------------------------- |
| `401`  | Отсутствует или неверный API-ключ |
| `500`  | Ошибка S3 при удалении            |

#### Логика работы

1. Вызов команды `DeleteFileByKeyCommand` через CommandBus
2. `DeleteFileByKeyCommandHandler`:
   - Вызов `S3FilesHttpAdapter.deleteFile(key)`
3. При ошибке — исключение пробрасывается дальше

> ⚠️ Данный эндпоинт **не удаляет запись из БД**, а только файл из S3. Используется для точечного удаления.

---

### 5. Получение файлов пользователя (с пагинацией)

**`GET /api/v1/files/user/:userId/files`**

Возвращает список файлов конкретного пользователя с пагинацией и сортировкой.

#### Заголовки

| Header      | Значение                  | Описание                           |
| ----------- | ------------------------- | ---------------------------------- |
| `x-api-key` | `<internal-api-key>`      | Ключ для внутренней аутентификации |
| `x-service` | `lumio` или `super-admin` | Имя вызывающего микросервиса       |

#### Path Parameters

| Параметр | Тип      | Обязательное | Описание        |
| -------- | -------- | :----------: | --------------- |
| `userId` | `number` |      ✅      | ID пользователя |

#### Query Parameters

| Параметр | Тип      | Обязательное | По умолчанию | Описание                                              |
| -------- | -------- | :----------: | :----------: | ----------------------------------------------------- |
| `page`   | `number` |      ❌      |     `1`      | Номер страницы                                        |
| `limit`  | `number` |      ❌      |     `50`     | Количество элементов на странице (макс. не ограничен) |
| `sortBy` | `string` |      ❌      | `date_desc`  | Сортировка: `date_desc` (новые), `date_asc` (старые)  |

#### Успешный ответ: `200 OK`

```json
[
  {
    "id": 1,
    "url": "https://<bucket>.storage.yandexcloud.net/content/posts/post-uuid-1/post-uuid-1_image_1_a1b2c3.jpg",
    "postId": "post-uuid-1",
    "createdAt": "2026-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "url": "https://<bucket>.storage.yandexcloud.net/content/posts/post-uuid-2/post-uuid-2_image_1_d4e5f6.png",
    "postId": "post-uuid-2",
    "createdAt": "2026-01-14T09:20:00.000Z"
  }
]
```

#### Ошибки

| Статус | Описание                          |
| ------ | --------------------------------- |
| `400`  | Невалидный userId (не число)      |
| `401`  | Отсутствует или неверный API-ключ |

#### Логика работы

1. `@Param('userId', ParseIntPipe)` — строгая валидация, что userId — число
2. `@Query()` параметры с значениями по умолчанию (page=1, limit=50, sortBy='date_desc')
3. Вызов команды `GetAllFilesByUserIdQuery` через QueryBus
4. `GetAllFilesByUserIdQueryHandler`:
   - `QueryFileRepository.getAllFilesByUserId()` с пагинацией (`skip`/`take`) и сортировкой
   - Фильтр: только не удалённые файлы (`deletedAt: null`)
5. Маппинг в `OutputFileType`

> Эндпоинт доступен для сервисов `lumio` и `super-admin` (через `@AllowInternalServices('lumio', 'super-admin')`).

---

## Компоненты модуля

### Controller: `PostFilesController`

```typescript
@Controller('files')
@UseGuards(InternalApiGuard)
@AllowInternalServices('lumio')
export class PostFilesController
```

- Базовый путь: `files` (константа `POST_FILES_BASE` из `post-files-routes.ts`)
- Защищён `InternalApiGuard` — доступ только для внутренних микросервисов
- По умолчанию доступен для сервиса `lumio` (кроме `/user/:userId/files` — также для `super-admin`)
- Использует `CommandBus` и `QueryBus` из `@nestjs/cqrs`

#### Роуты (константы из `post-files-routes.ts`)

| Константа           | Путь                        | Метод  | Описание              |
| ------------------- | --------------------------- | :----: | --------------------- |
| `POST_FILES_BASE`   | `files`                     |   —    | Базовый путь          |
| `UPLOAD_POST_FILES` | `upload-post-files`         |  POST  | Загрузка файлов       |
| `DELETE_POST_FILES` | `delete-post-files/:postId` | DELETE | Удаление файлов поста |
| `DELETE_FILE`       | `delete-file/:key`          | DELETE | Удаление одного файла |
| `GET_USER_FILES`    | `user/:userId/files`        |  GET   | Файлы пользователя    |

---

### Command Handlers

#### `UploadFilesCreatedPostCommandHandler`

| Свойство    | Значение                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- |
| Команда     | `UploadFilesCreatedPostCommand`                                                              |
| Параметры   | `postId: string`, `userId: number`, `files: Array<{ buffer: Buffer, originalname: string }>` |
| Возврат     | `void`                                                                                       |
| Зависимости | `S3FilesHttpAdapter`, `FileRepository`, `AppLoggerService`                                   |

Обрабатывает загрузку файлов с компенсационными действиями при ошибке БД (cleanup S3).

#### `DeletedPostFilesCommandHandler`

| Свойство    | Значение                                                   |
| ----------- | ---------------------------------------------------------- |
| Команда     | `DeletedPostFilesCommand`                                  |
| Параметры   | `postId: string`                                           |
| Возврат     | `void`                                                     |
| Зависимости | `S3FilesHttpAdapter`, `FileRepository`, `AppLoggerService` |

Мягкое удаление (soft-delete) всех файлов поста с последующим удалением из S3.

#### `DeleteFileByKeyCommandHandler`

| Свойство    | Значение                 |
| ----------- | ------------------------ |
| Команда     | `DeleteFileByKeyCommand` |
| Параметры   | `key: string`            |
| Возврат     | `void`                   |
| Зависимости | `S3FilesHttpAdapter`     |

Прямое удаление одного файла из S3 без взаимодействия с БД.

---

### Query Handlers

#### `GetAllFilesByPostUserQueryHandler`

| Свойство    | Значение                     |
| ----------- | ---------------------------- |
| Запрос      | `GetAllFilesByPostUserQuery` |
| Параметры   | `postId: string`             |
| Возврат     | `OutputFileType[]`           |
| Зависимости | `QueryFileRepository`        |

#### `GetAllFilesByPostIdsQueryHandler`

| Свойство    | Значение                    |
| ----------- | --------------------------- |
| Запрос      | `GetAllFilesByPostIdsQuery` |
| Параметры   | `postIds: string[]`         |
| Возврат     | `OutputFileType[]`          |
| Зависимости | `QueryFileRepository`       |

#### `GetAllFilesByUserIdQueryHandler`

| Свойство    | Значение                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Запрос      | `GetAllFilesByUserIdQuery`                                             |
| Параметры   | `userId: number`, `page?: number`, `limit?: number`, `sortBy?: string` |
| Возврат     | `OutputFileType[]`                                                     |
| Зависимости | `QueryFileRepository`                                                  |

---

### Repositories

#### `FileRepository` (запись)

Набор методов для операций записи с таблицей `PostFile`:

| Метод                                      | Описание                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `createFiles(dtos: CreateFileDomainDto[])` | Массовое создание записей файлов (через `Promise.all`)          |
| `softDeleteFilesByPostId(postId: string)`  | Мягкое удаление (проставляет `deletedAt`) для всех файлов поста |
| `findFilesByPostId(postId: string)`        | Поиск не удалённых файлов поста (с лимитом 10)                  |

#### `QueryFileRepository` (чтение)

Набор методов для запросов к таблице `PostFile`:

| Метод                                              | Описание                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `getAllFilesByPostId(postId: string)`              | Все файлы поста (сортировка по `createdAt ASC`)                                                          |
| `getAllFilesByPostIds(postIds: string[])`          | Файлы для нескольких постов (сортировка по `createdAt ASC`). Если массив пуст — пустой результат         |
| `getAllFilesByUserId(userId, page, limit, sortBy)` | Файлы пользователя с пагинацией и сортировкой (`date_asc`/`date_desc`). Фильтр: только `deletedAt: null` |

---

### Domain Entity: `PostFileEntity`

```typescript
export class PostFileEntity implements PostFile {
  id: number;
  key: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: Date;
  deletedAt: Date | null;
  postId: string;
  userId: number;
}
```

Имплементирует интерфейс Prisma-модели `PostFile` из `@generated/prisma-files`.

### Domain DTO: `CreateFileDomainDto`

```typescript
export class CreateFileDomainDto {
  constructor(
    public key: string, // Ключ в S3
    public url: string, // Публичный URL
    public mimetype: string, // MIME-тип
    public size: number, // Размер в байтах
    public postId: string, // ID поста
    public userId: number, // ID пользователя
  ) {}
}
```

### API DTOs (Input)

#### `InputUploadFilesDto`

```typescript
export class InputUploadFilesDto {
  @IsString()
  postId: string;

  @Type(() => Number)
  @IsNumber()
  userId: number;
}
```

#### `InputGetUserPostsDto`

```typescript
export class InputGetUserPostsDto {
  @IsArray()
  @IsString({ each: true })
  postIds: string[];
}
```

---

## Output DTO: `OutputFileType` (из `@libs/dto`)

```typescript
export class OutputFileType {
  constructor(
    public id: number, // ID записи файла
    public url: string, // Публичный URL
    public postId: string, // ID поста
    public createdAt: Date, // Дата создания
  ) {}
}
```

Ответ содержит только публичную информацию о файле (без key, mimetype, size, userId, deletedAt).

---

## Безопасность (Internal API Guard)

Все эндпоинты модуля защищены `InternalApiGuard`:

1. Проверка наличия заголовка `x-service` — если отсутствует → `401 UnauthorizedDomainException`
2. Проверка наличия заголовка `x-api-key` — если отсутствует → `401 UnauthorizedDomainException`
3. Валидация API-ключа: сравнивает значение из заголовка с ключом для указанного сервиса в конфигурации (`coreConfig.internalApiKeys`)
4. Проверка, что вызывающий сервис есть в списке разрешённых (`@AllowInternalServices('lumio')`)

---

## Интеграция с S3 (Yandex Cloud Object Storage)

`S3FilesHttpAdapter` используется для:

- **Загрузка файла**: `PutObjectCommand` → сохраняет по пути `content/posts/{postId}/{fileName}`
- **Удаление файла**: `DeleteObjectCommand` → удаляет по S3-ключу

Формат ключа в S3:

```
content/posts/{postId}/{postId}_image_{index}_{uuid}.{extension}
```

Пример:

```
content/posts/post-uuid-1/post-uuid-1_image_1_a1b2c3.jpg
```

Публичный URL формируется как:

```
https://{bucketName}.storage.yandexcloud.net/{key}
```

---

## Регистрация в модуле `FilesModule`

В корневом модуле `files.module.ts` зарегистрированы следующие компоненты модуля post-files:

| Компонент                              | Роль                                |
| -------------------------------------- | ----------------------------------- |
| `PostFilesController`                  | Контроллер                          |
| `UploadFilesCreatedPostCommandHandler` | Command handler (загрузка)          |
| `DeletedPostFilesCommandHandler`       | Command handler (удаление поста)    |
| `DeleteFileByKeyCommandHandler`        | Command handler (удаление по ключу) |
| `GetAllFilesByPostUserQueryHandler`    | Query handler (файлы поста)         |
| `GetAllFilesByPostIdsQueryHandler`     | Query handler (файлы по IDs)        |
| `GetAllFilesByUserIdQueryHandler`      | Query handler (файлы пользователя)  |
| `FileRepository`                       | Repository (запись)                 |
| `QueryFileRepository`                  | Repository (чтение)                 |

Модуль не имеет собственного NestJS-модуля (`*.module.ts`) — все компоненты регистрируются напрямую в `FilesModule`.

---

## Обработка ошибок

| Тип исключения                  | Условие                                             | HTTP статус |
| ------------------------------- | --------------------------------------------------- | :---------: |
| `BadRequestDomainException`     | Невалидные входные данные (postIds, userId, postId) |     400     |
| `UnauthorizedDomainException`   | Неверный/отсутствующий API-ключ или сервис          |     401     |
| Prisma/S3 `InternalServerError` | Проблема с БД или Object Storage                    |     500     |

### Graceful Degradation при ошибке S3

При удалении файлов поста (`DeletedPostFilesCommandHandler`):

- **Мягкое удаление из БД** (`softDeleteFilesByPostId`) — строгое (ошибка прерывает)
- **Удаление из S3** (`S3FilesHttpAdapter.deleteFile()`) — мягкое (ошибка логируется, но не прерывает). Файлы остаются в S3, помеченные как удалённые в БД

При загрузке файлов (`UploadFilesCreatedPostCommandHandler`):

- **Загрузка в S3** — строгое (ошибка прерывает)
- **Запись в БД** — строгое (ошибка прерывает и запускает cleanup S3)
- **Cleanup S3** при ошибке БД — мягкое (ошибка логируется). Файлы остаются в S3 без записи в БД

---

## Диаграммы последовательности

### Загрузка файлов

```
Client (lumio) → PostFilesController.uploadPostFiles(files, dto)
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── CommandBus.execute(UploadFilesCreatedPostCommand)
  │   └── UploadFilesCreatedPostCommandHandler
  │       │
  │       ├── S3FilesHttpAdapter.uploadFiles('posts', postId, files)
  │       │   ├── upload file 1 → content/posts/{postId}/{fileName}
  │       │   ├── upload file 2 → content/posts/{postId}/{fileName}
  │       │   └── ✅ Все файлы загружены
  │       │
  │       ├── FileRepository.createFiles(fileDtos)
  │       │   ├── ✅ Все записи созданы → continue
  │       │   └── ⚠️ Ошибка БД:
  │       │       └── cleanupS3Files() → удаление из S3 (мягкая ошибка)
  │       │
  │       └── ✅ Команда выполнена
  │
  ├── QueryBus.execute(GetAllFilesByPostUserQuery)
  │   └── GetAllFilesByPostUserQueryHandler
  │       └── QueryFileRepository.getAllFilesByPostId(postId)
  │           └── ✅ Список файлов
  │
  └── 🔄 Ответ: OutputFileType[] (201 Created)
```

### Удаление файлов поста

```
Client (lumio) → PostFilesController.deletePostFiles(postId)
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── CommandBus.execute(DeletedPostFilesCommand)
  │   └── DeletedPostFilesCommandHandler
  │       │
  │       ├── FileRepository.findFilesByPostId(postId)
  │       │   ├── ⬜ Файлов нет → return (идепотентность)
  │       │   └── ✅ Файлы найдены
  │       │
  │       ├── FileRepository.softDeleteFilesByPostId(postId)
  │       │   └── ✅ deletedAt проставлен
  │       │
  │       └── Для каждого файла: S3FilesHttpAdapter.deleteFile(key)
  │           ├── ✅ Удалён
  │           ├── ✅ Удалён
  │           └── ⚠️ Ошибка → логируется (продолжаем)
  │
  └── 🔄 Ответ: 200 OK
```

### Получение файлов по ID постов

```
Client (lumio) → PostFilesController.getAllUserPostsFiles(data)
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── Валидация InputGetUserPostsDto
  │   └── ✅ postIds — массив строк
  │
  ├── QueryBus.execute(GetAllFilesByPostIdsQuery)
  │   └── GetAllFilesByPostIdsQueryHandler
  │       │
  │       ├── postIds.length === 0 → return []
  │       └── QueryFileRepository.getAllFilesByPostIds(postIds)
  │           └── ✅ Все файлы для указанных постов
  │
  └── 🔄 Ответ: OutputFileType[] (200 OK)
```

### Получение файлов пользователя (с пагинацией)

```
Client (lumio/super-admin) → PostFilesController.getUserFiles(userId, page, limit, sortBy)
  │
  ├── InternalApiGuard (валидация API-ключа)
  │   └── ✅ Успех
  │
  ├── ParseIntPipe → валидация userId
  │   └── ✅ Число
  │
  ├── DefaultValuePipe → page=1, limit=50, sortBy='date_desc'
  │
  ├── QueryBus.execute(GetAllFilesByUserIdQuery)
  │   └── GetAllFilesByUserIdQueryHandler
  │       └── QueryFileRepository.getAllFilesByUserId(userId, page, limit, sortBy)
  │           ├── Фильтр: deletedAt: null
  │           ├── Сортировка: по createdAt (date_asc / date_desc)
  │           └── Пагинация: skip / take
  │
  └── 🔄 Ответ: OutputFileType[] (200 OK)
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

- **Модуль без собственного NestJS-файла**: компоненты модуля регистрируются напрямую в корневом `FilesModule`, аналогично модулю `avatar`
- **CQRS-разделение**: операции записи (команды) и чтения (запросы) разделены на уровне хендлеров и репозиториев
- **Два репозитория**: `FileRepository` для записи/изменения данных, `QueryFileRepository` для чтения — следует принципу разделения ответственности (CQRS)
- **Пагинация**: для эндпоинта `/user/:userId/files` реализована пагинация через `skip`/`take` с сортировкой по дате
- **Мягкое удаление**: файлы не удаляются физически из БД, а помечаются `deletedAt` (soft-delete)
- **S3 cleanup**: при ошибках БД во время загрузки — автоматический откат загруженных в S3 файлов
- **Идепотентность удаления**: при попытке удалить файлы поста, у которого нет файлов — операция завершается без ошибки
- **Swagger-документация**: автоматически генерируется через декораторы `@ApiGetPostFiles()`, `@ApiUploadPostFiles()`, `@ApiDeletePostFiles()`, `@ApiDeleteFileByKey()`, `@ApiGetUserFiles()`
- **Логирование**: критические ошибки S3 логируются через `AppLoggerService` из `@libs/logger`
- **Тип файлов**: загружаемые файлы не валидируются по MIME-типу на уровне контроллера (в отличие от модуля avatar)
- **Формат postId**: может быть UUID или Slug ID (строка) — ограничение снято в миграции `20260213161718`
- **userId**: опциональный (`Int?`) в Prisma — может быть `null` для обратной совместимости
- **Ограничение findFilesByPostId**: возвращает максимум 10 записей (`take: 10`) — важно при удалении большого количества файлов
