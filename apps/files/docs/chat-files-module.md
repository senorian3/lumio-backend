# Chat Files Module — Документация

## Обзор

Модуль `ChatFilesModule` отвечает за загрузку, получение и удаление файлов, прикреплённых к сообщениям в чатах. Он является внутренним микросервисом и доступен только для других внутренних сервисов (через `InternalApiGuard` и декоратор `@AllowInternalServices('chat')`).

Файлы загружаются в S3-совместимое объектное хранилище (Yandex Object Storage), а метаданные сохраняются в БД (таблица `ChatFile`).

---

## Архитектура

Модуль организован по **CQRS-паттерну** с разделением на слои:

```
chat-files/
├── api/
│   ├── dto/
│   │   └── input/
│   │       └── upload-chat-file.input.dto.ts
│   └── chat-files.controller.ts
├── application/
│   └── commands/
│       ├── upload-chat-file.command-handler.ts
│       └── delete-chat-file.command-handler.ts
├── domain/
│   ├── dto/
│   │   └── create-chat-file.domain.dto.ts
│   ├── entities/
│   │   └── chat-file.entity.ts
│   └── infrastructure/
│       └── chat-file.repository.ts
└── chat-files.module.ts
```

### Слои

| Слой                         | Компонент                                                      | Назначение                                                 |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| **API (Controller)**         | `ChatFilesController`                                          | Обрабатывает HTTP-запросы, делегирует логику в Command Bus |
| **Application**              | `UploadChatFileCommandHandler`, `DeleteChatFileCommandHandler` | CQRS-хендлеры: валидация, вызов S3, сохранение в БД        |
| **Domain**                   | `ChatFileEntity`, `CreateChatFileDomainDto`                    | Доменные модели и DTO                                      |
| **Infrastructure**           | `ChatFileRepository`                                           | Работа с БД через Prisma                                   |
| **Infrastructure (Adapter)** | `S3FilesHttpAdapter`                                           | Загрузка/удаление файлов в S3 (Yandex Object Storage)      |

---

## Модуль (DI)

**Файл:** `chat-files.module.ts`

```typescript
@Module({
  imports: [CqrsModule],
  controllers: [ChatFilesController],
  providers: [
    UploadChatFileCommandHandler,
    DeleteChatFileCommandHandler,
    ChatFileRepository,
    S3FilesHttpAdapter,
  ],
  exports: [ChatFileRepository],
})
export class ChatFilesModule {}
```

- **Imports:** `CqrsModule` — для работы с Command Bus.
- **Providers:** зарегистрированы команды-хендлеры, репозиторий и S3-адаптер.
- **Exports:** `ChatFileRepository` — для возможного использования в других модулях.

---

## API Endpoints

### Базовый путь: `/chat-files`

Константы роутов объявлены в `core/routes/chat-files-routes.ts`:

```typescript
export const FILES_BASE = 'chat-files';
export const FILES_ROUTES = {
  UPLOAD: 'upload',
};
```

### 1. POST `/chat-files/upload` — Загрузка файла чата

- **Guard:** `InternalApiGuard` + `@AllowInternalServices('chat')`
- **Content-Type:** `multipart/form-data`

#### Параметры (body)

| Поле        | Тип      | Обязательный | Описание                                |
| ----------- | -------- | ------------ | --------------------------------------- |
| `file`      | `binary` | ✅           | Файл для загрузки                       |
| `userId`    | `number` | ✅           | ID пользователя (положительное число)   |
| `chatId`    | `number` | ✅           | ID чата (положительное число)           |
| `messageId` | `string` | ✅           | UUID сообщения чата                     |
| `fileType`  | `enum`   | ✅           | Тип файла: `IMAGE`, `VOICE`, `DOCUMENT` |
| `text`      | `string` | ❌           | Опциональный текст медиасообщения       |
| `duration`  | `number` | ❌           | Длительность медиа (сек), для VOICE     |
| `width`     | `number` | ❌           | Ширина изображения/видео                |
| `height`    | `number` | ❌           | Высота изображения/видео                |

#### Ответ (201)

```json
{
  "fileKey": "content/chats/123/1_image_a1b2c.png",
  "url": "https://lumio-files-photo.storage.yandexcloud.net/content/chats/123/1_image_a1b2c.png",
  "type": "IMAGE",
  "size": 482391,
  "createdAt": "2026-02-19T21:17:16.278Z"
}
```

#### Ошибки (400)

- `File is required` — файл отсутствует
- `The "userId" must be a positive number` — невалидный userId
- `The "chatId" must be a positive number` — невалидный chatId
- `The "messageId" field cannot be empty` — пустой messageId
- `The "fileType" must be one of: IMAGE, VOICE, DOCUMENT` — неверный тип
- `Failed to upload file to S3` — ошибка при загрузке в S3

---

### 2. DELETE `/chat-files/:fileKey` — Удаление файла чата

- **Guard:** `InternalApiGuard` + `@AllowInternalServices('chat')`

#### Параметры (path)

| Поле      | Тип      | Описание                                                               |
| --------- | -------- | ---------------------------------------------------------------------- |
| `fileKey` | `string` | Ключ файла (путь в S3), например `content/chats/123/1_image_a1b2c.png` |

#### Ответ (200)

```json
{
  "success": true,
  "message": "Chat file deleted successfully",
  "fileKey": "content/chats/123/1_image_a1b2c.png"
}
```

#### Ошибки (404)

- `Chat file not found` — файл с указанным ключом не найден

**Логика удаления:**

1. Проверка существования файла в БД (с учётом `deletedAt IS NULL`)
2. Удаление объекта из S3
3. Soft-delete в БД (установка `deletedAt`)

---

### 3. GET `/chat-files/:fileKey` — Получение файла чата

- **Guard:** `InternalApiGuard` + `@AllowInternalServices('chat')`

#### Параметры (path)

| Поле      | Тип      | Описание               |
| --------- | -------- | ---------------------- |
| `fileKey` | `string` | Ключ файла (путь в S3) |

#### Ответ (200)

```json
{
  "fileKey": "content/chats/123/1_image_a1b2c.png",
  "url": "https://s3.amazonaws.com/bucket/content/chats/123/1_image_a1b2c.png"
}
```

> ⚠️ **Примечание:** На данный момент endpoint возвращает заглушку (формирует URL на лету, не обращаясь к БД). В будущем планируется интеграция с генерацией подписанных (presigned) URL.

---

## Логика загрузки файла (UploadChatFileCommandHandler)

1. **Валидация** — проверяется наличие `file.buffer`
2. **Загрузка в S3** — через `S3FilesHttpAdapter.uploadFiles()`:
   - Формируется ключ: `content/chats/{chatId}/{chatId}_image_{index}_{uuid}.{ext}`
   - Файл отправляется в Yandex Object Storage
3. **Сохранение в БД** — через `ChatFileRepository.create()`:
   - Сохраняются: key, url, type, size, userId, chatId, messageId, originalName, mimeType
4. **Возврат результата** — `{ fileKey, url, type, size, createdAt }`

---

## Логика удаления файла (DeleteChatFileCommandHandler)

1. **Поиск в БД** — `ChatFileRepository.findByKey(fileKey)` с фильтром `deletedAt: null`
2. **Если не найден** — `NotFoundDomainException`
3. **Удаление из S3** — `S3FilesHttpAdapter.deleteFile(fileKey)`
4. **Soft-delete в БД** — `ChatFileRepository.softDeleteByKey(fileKey)` (устанавливается `deletedAt`)

---

## ChatFileType

```typescript
enum ChatFileType {
  IMAGE = 'IMAGE', // Изображение
  VOICE = 'VOICE', // Голосовое сообщение
  DOCUMENT = 'DOCUMENT', // Документ
}
```

---

## База данных (Prisma — Model ChatFile)

**Файл:** `prisma/schema.prisma`

```prisma
model ChatFile {
  id           Int       @id @default(autoincrement())
  key          String    @unique
  url          String
  type         String    // IMAGE, VOICE, DOCUMENT
  size         Int
  originalName String
  mimeType     String
  createdAt    DateTime  @default(now())
  deletedAt    DateTime?
  userId       Int?
  chatId       Int?
  messageId    String?

  @@index([deletedAt])
  @@index([userId])
  @@index([chatId])
  @@index([messageId])
}
```

### Поля

| Поле           | Тип                    | Описание                                            |
| -------------- | ---------------------- | --------------------------------------------------- |
| `id`           | `Int` (auto-increment) | Первичный ключ                                      |
| `key`          | `String @unique`       | Уникальный ключ-путь в S3                           |
| `url`          | `String`               | Полный URL файла в Object Storage                   |
| `type`         | `String`               | Тип файла: `IMAGE`, `VOICE`, `DOCUMENT`             |
| `size`         | `Int`                  | Размер файла в байтах                               |
| `originalName` | `String`               | Оригинальное имя файла                              |
| `mimeType`     | `String`               | MIME-тип файла (например, `image/png`, `audio/ogg`) |
| `createdAt`    | `DateTime`             | Дата создания записи                                |
| `deletedAt`    | `DateTime?`            | Дата мягкого удаления (NULL — активная запись)      |
| `userId`       | `Int?`                 | ID пользователя-владельца                           |
| `chatId`       | `Int?`                 | ID чата                                             |
| `messageId`    | `String?`              | ID сообщения чата (UUID)                            |

### Индексы

- `deletedAt` — для фильтрации неудалённых записей
- `userId` — поиск файлов пользователя
- `chatId` — поиск файлов чата
- `messageId` — поиск файлов по сообщению

### Soft Delete

Все операции удаления — мягкие: запись помечается `deletedAt: new Date()`. Физического удаления из БД не происходит. Репозиторий всегда фильтрует записи с `deletedAt: null`.

---

## Репозиторий (ChatFileRepository)

**Файл:** `domain/infrastructure/chat-file.repository.ts`

| Метод                              | Параметры                 | Возврат                  | Описание                              |
| ---------------------------------- | ------------------------- | ------------------------ | ------------------------------------- |
| `create(dto)`                      | `CreateChatFileDomainDto` | `ChatFileEntity`         | Создание записи в БД                  |
| `findByKey(key)`                   | `string`                  | `ChatFileEntity \| null` | Поиск по ключу (только активные)      |
| `findByMessageId(messageId)`       | `string`                  | `ChatFileEntity[]`       | Поиск по ID сообщения                 |
| `findByChatId(chatId)`             | `number`                  | `ChatFileEntity[]`       | Поиск по ID чата                      |
| `softDeleteByKey(key)`             | `string`                  | `void`                   | Мягкое удаление по ключу              |
| `softDeleteByMessageId(messageId)` | `string`                  | `void`                   | Мягкое удаление всех файлов сообщения |

---

## Зависимости

- **@nestjs/cqrs** — CQRS (Command Bus, CommandHandler)
- **@aws-sdk/client-s3** — S3-клиент для работы с Yandex Object Storage
- **class-validator / class-transformer** — валидация DTO
- **multer** — обработка multipart/form-data (через `FileInterceptor`)

---

## Безопасность

- Все эндпоинты защищены `InternalApiGuard`, который пропускает только запросы от внутренних сервисов (chat-сервис через `@AllowInternalServices('chat')`).
- Валидация входных данных через DTO с `class-validator`.
- Проверка наличия файла перед загрузкой.
- Мягкое удаление для предотвращения случайной потери данных.

---

## Возможные улучшения

1. **Presigned URLs** — заменить заглушку GET-эндпоинта на генерацию подписанных URL для безопасного скачивания.
2. **Массовая загрузка** — поддержка загрузки нескольких файлов за один запрос.
3. **Валидация размера/типа** — ограничение максимального размера и разрешённых MIME-типов на уровне контроллера.
4. **Обработка ошибок S3** — ретраи при временных сбоях S3.
5. **Thumbnail/превью** — генерация миниатюр для изображений.
6. **Очистка S3 при soft-delete** — фоновый джоб для физического удаления из S3 записей, помеченных `deletedAt`.
