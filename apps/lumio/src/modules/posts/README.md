# Модуль Posts (lumio)

## Общее описание

Модуль **Posts** является частью микросервиса `lumio` и отвечает за управление публикациями пользователей (постами), комментариями и реакциями (лайки/дизлайки). Реализован с использованием паттерна CQRS для разделения операций чтения и записи.

### Основные возможности

- **CRUD постов** — создание, обновление, удаление (soft delete) постов
- **Комментирование** — создание комментариев с поддержкой вложенности (reply через parentId/rootId)
- **Реакции на посты** — лайки/дизлайки постов
- **Реакции на комментарии** — лайки/дизлайки комментариев
- **Главная страница** — пагинированная лента постов с количеством зарегистрированных пользователей
- **Профильные посты** — получение поста по идентификатору профиля пользователя
- **Загрузка файлов** — интеграция с микросервисом `files` для хранения прикреплённых к посту файлов (через FilesHttpAdapter)
- **Публикация событий** — отправка события `post.created` в RabbitMQ exchange `lumio_events` для оповещения других микросервисов

---

## Архитектура модуля

```
modules/posts/
├── api/
│   ├── dto/
│   │   ├── input/
│   │   │   ├── create-post.input.dto.ts
│   │   │   ├── update-post.input.dto.ts
│   │   │   ├── create-comment.input.dto.ts          # (альтернативный файл, дублирует create-comment.input-dto.ts)
│   │   │   ├── get-all-user-posts.query.dto.ts
│   │   │   ├── get-main-page.input.dto.ts
│   │   │   ├── get-post-comments.query.dto.ts
│   │   │   ├── like-post.input.dto.ts
│   │   │   └── like-comment.input.dto.ts
│   │   ├── output/
│   │   │   ├── post.output.dto.ts
│   │   │   ├── comment.output.dto.ts
│   │   │   ├── main-page.output.dto.ts
│   │   │   └── posts.paginated.view-dto.ts
│   │   ├── transfer/
│   │   │   ├── create-post.transfer.dto.ts
│   │   │   └── update-post.transfer.dto.ts
│   │   └── create-comment.input-dto.ts              # Основной DTO для создания комментария
│   ├── main.controller.ts                            # Контроллер главной страницы
│   └── posts.controller.ts                           # Основной контроллер постов
├── application/
│   ├── commands/
│   │   ├── create-post.command-handler.ts
│   │   ├── update-post.command-handler.ts
│   │   ├── delete-post.command-handler.ts
│   │   ├── create-comment.command-handler.ts
│   │   ├── like-post.command-handler.ts
│   │   └── like-comment.command-handler.ts
│   ├── queries/
│   │   ├── get-main-page.query-handler.ts
│   │   ├── get-post-by-id.query-handler.ts
│   │   ├── get-post-with-comments.query-handler.ts
│   │   ├── get-all-user-posts.query-handler.ts
│   │   ├── get-by-id-create-post.query-handler.ts
│   │   ├── get-created-comment.query-handler.ts
│   │   └── get-profile-post.query-handler.ts
│   ├── files-http.adapter.ts                        # HTTP-адаптер для микросервиса files
│   └── post-events.publisher.ts                     # Публикатор событий в RabbitMQ
├── domain/
│   ├── entities/
│   │   ├── post.entity.ts
│   │   └── post-file.entity.ts
│   ├── events/
│   │   └── post-created.event.ts
│   └── infrastructure/
│       ├── post.repository.ts
│       ├── post.query.repository.ts
│       ├── post.external-query.repository.ts
│       ├── post-files.repository.ts
│       └── comment.repository.ts
└── posts.module.ts
```

---

## Модели данных (Prisma Schema)

### Post

| Поле           | Тип         | Описание                               |
| -------------- | ----------- | -------------------------------------- |
| `id`           | `String`    | UUID поста (генерируется через `uuid`) |
| `description`  | `String?`   | Описание/текст поста                   |
| `likeCount`    | `Int`       | Количество лайков (денормализовано)    |
| `dislikeCount` | `Int`       | Количество дизлайков (денормализовано) |
| `createdAt`    | `DateTime`  | Дата создания                          |
| `deletedAt`    | `DateTime?` | Дата soft-delete                       |
| `userId`       | `Int`       | ID автора поста                        |

**Индексы:** `[userId]`, `[deletedAt]`

### PostFile

| Поле        | Тип         | Описание                 |
| ----------- | ----------- | ------------------------ |
| `id`        | `Int`       | ID файла (автоинкремент) |
| `postId`    | `String`    | ID поста                 |
| `url`       | `String`    | URL файла в S3           |
| `createdAt` | `DateTime`  | Дата создания            |
| `deletedAt` | `DateTime?` | Дата soft-delete         |

### Comment

| Поле           | Тип         | Описание                                 |
| -------------- | ----------- | ---------------------------------------- |
| `id`           | `Int`       | ID комментария (автоинкремент)           |
| `content`      | `String`    | Текст комментария (макс. 300 символов)   |
| `likeCount`    | `Int`       | Количество лайков (денормализовано)      |
| `dislikeCount` | `Int`       | Количество дизлайков (денормализовано)   |
| `createdAt`    | `DateTime`  | Дата создания                            |
| `deletedAt`    | `DateTime?` | Дата soft-delete                         |
| `postId`       | `String`    | ID поста                                 |
| `userId`       | `Int`       | ID автора комментария                    |
| `parentId`     | `Int?`      | ID родительского комментария (для reply) |
| `rootId`       | `Int?`      | ID корневого комментария для группировки |

**Индексы:** `[postId]`, `[userId]`, `[deletedAt]`, `[parentId]`

### PostLike

| Поле      | Тип        | Описание                     |
| --------- | ---------- | ---------------------------- |
| `id`      | `Int`      | ID лайка (автоинкремент)     |
| `status`  | `String`   | Статус: `like` или `dislike` |
| `addedAt` | `DateTime` | Дата добавления              |
| `postId`  | `String`   | ID поста                     |
| `userId`  | `Int`      | ID пользователя              |

**Unique:** `@@unique([postId, userId])`

### CommentLike

| Поле        | Тип        | Описание                     |
| ----------- | ---------- | ---------------------------- |
| `id`        | `Int`      | ID лайка (автоинкремент)     |
| `status`    | `String`   | Статус: `like` или `dislike` |
| `addedAt`   | `DateTime` | Дата добавления              |
| `commentId` | `Int`      | ID комментария               |
| `userId`    | `Int`      | ID пользователя              |

**Unique:** `@@unique([commentId, userId])`

---

## API Endpoints

### PostsController (`/posts`)

| Метод  | Путь                        | Аутентификация  | Описание                                      |
| ------ | --------------------------- | --------------- | --------------------------------------------- | --- |
| GET    | `/:userId`                  | OptionalJwtAuth | Получение всех постов пользователя            |
| GET    | `/:profileId`               | OptionalJwtAuth | Получение поста из профиля                    |
| POST   | `/`                         | JwtAuth         | Создание поста (с файлами)                    |
| PUT    | `/:postId`                  | JwtAuth         | Обновление описания поста                     |
| DELETE | `/:postId`                  | JwtAuth         | Soft-delete поста (и файлов из S3)            |
| GET    | `/post/:postId`             | JwtAuth         | Получение поста по ID                         |
| POST   | `/:postId/comments`         | JwtAuth         | Создание комментария (с поддержкой reply)     |
| GET    | `/:postId/comments`         | OptionalJwtAuth | Получение комментариев к посту (с пагинацией) |     |
| POST   | `/comments/:commentId/like` | JwtAuth         | Лайк/дизлайк комментария                      |
| POST   | `/:postId/like`             | JwtAuth         | Лайк/дизлайк поста                            |

### MainController (`/`)

| Метод | Путь | Аутентификация  | Описание                                |
| ----- | ---- | --------------- | --------------------------------------- |
| GET   | `/`  | OptionalJwtAuth | Главная страница: пагинированный список |

---

## CQRS — Команды (Commands)

Команды используются для операций записи и выполняются через `CommandBus`.

### 1. CreatePostCommand

**Create a new post with file uploads.**

- **Вход:** `userId`, `description`, `files: Express.Multer.File[]`
- **Логика:**
  1. Проверка существования пользователя через `ExternalQueryUserAccountsRepository`
  2. Генерация UUID для `postId`
  3. Загрузка файлов в микросервис `files` через `FilesHttpAdapter.uploadFiles()`
  4. Создание записи `Post` и `PostFile[]` в транзакции Prisma
  5. Публикация события `post.created` в RabbitMQ
  6. При ошибке — очистка файлов из S3
- **Результат:** `{ files: OutputFileType[], postId: string }`

### 2. UpdatePostCommand

**Update post description.**

- **Вход:** `postId`, `userId`, `description`
- **Логика:**
  1. Проверка существования пользователя
  2. Проверка существования поста (не удалён)
  3. Проверка принадлежности поста пользователю (`ForbiddenDomainException`)
  4. Обновление описания
- **Результат:** `PostView`

### 3. DeletePostCommand

**Soft-delete a post and its files from S3.**

- **Вход:** `userId`, `postId`
- **Логика:**
  1. Проверка пользователя и поста
  2. Проверка принадлежности поста (`ForbiddenDomainException`)
  3. Soft-delete записи `Post` (установка `deletedAt`)
  4. Удаление файлов из S3 через `FilesHttpAdapter`
- **Результат:** `void`

### 4. CreateCommentCommand

**Create a comment on a post.**

- **Вход:** `userId`, `postId`, `content`, `parentId?`
- **Логика:**
  1. Проверка существования активного поста
  2. Если указан `parentId` — проверка существования родительского комментария и его принадлежности к тому же посту
  3. Создание комментария с вычислением `rootId` через `CommentRepository.resolveRootId()`
- **Результат:** `{ commentId: number }`

### 5. LikePostCommand

**Like/dislike/unlike a post.**

- **Вход:** `userId`, `postId`, `status: 'like' | 'dislike' | 'none'`
- **Логика:**
  1. Проверка существования активного поста
  2. Валидация статуса
  3. Upsert лайка в `PostLike` (или удаление при `none`)
  4. Обновление денормализованных счётчиков `likeCount` и `dislikeCount` в `Post`
  5. Всё выполняется в одной транзакции
- **Результат:** `void`

### 6. LikeCommentCommand

**Like/dislike/unlike a comment.**

- **Вход:** `userId`, `commentId`, `status: 'like' | 'dislike' | 'none'`
- **Логика:**
  1. Проверка существования активного комментария
  2. Валидация статуса
  3. Upsert лайка в `CommentLike` (или удаление при `none`)
  4. Обновление денормализованных счётчиков `likeCount` и `dislikeCount` в `Comment`
  5. Всё выполняется в одной транзакции
- **Результат:** `void`

---

## CQRS — Запросы (Queries)

Запросы используются для операций чтения и выполняются через `QueryBus`.

### 1. GetMainPageQuery

**Get paginated posts for the main page.**

- **Вход:** `currentUserId`, `paginationParams: GetMainPageInputDto`
- **Логика:**
  1. Получение пагинированных постов с учётом реакций текущего пользователя
  2. Получение общего количества зарегистрированных пользователей
  3. Формирование `MainPageView` с пагинированным списком постов
- **Результат:** `MainPageView`

### 2. GetPostByIdQuery

**Get a single post by its ID.**

- **Вход:** `postId`, `userId`
- **Логика:**
  1. Проверка существования пользователя
  2. Получение поста с файлами
  3. Получение реакции текущего пользователя на пост
  4. Получение 3-х последних лайков для отображения аватарок
- **Результат:** `PostView` (включает `postFiles`, `newestLikes`, `userReaction`)

### 3. GetPostWithCommentsQuery

**Get paginated comments for a post (with nested replies).**

- **Вход:** `postId`, `userId?`, `pagination?`
- **Логика:**
  1. Проверка существования поста
  2. Получение корневых комментариев с пагинацией
  3. Получение всех reply к корневым комментариям
  4. Получение реакций текущего пользователя на все комментарии
  5. Формирование вложенной структуры: `root -> replies`
- **Результат:** `PaginatedViewDto<CommentViewDto[]>`

### 4. GetAllUserPostsQuery

**Get paginated posts of a specific user.**

- **Вход:** `userId`, `query`, `userIdParam`
- **Логика:**
  1. Определение роли: `'author'` если запрашивающий пользователь является владельцем, иначе `'viewer'`
  2. Получение пагинированных постов с реакциями и последними лайками
  3. Формирование `PaginatedPostViewDto` с полем `role`
- **Результат:** `PaginatedPostViewDto`

### 5. GetCreatePostUserQuery

**Get the created post right after its creation.**

- **Вход:** `postId`, `files`
- **Логика:** Получение поста по ID и маппинг с загруженными файлами
- **Результат:** `PostView`

### 6. GetCreatedCommentQuery

**Get the created comment right after its creation.**

- **Вход:** `commentId`, `userId`
- **Логика:** Получение комментария по ID
- **Результат:** `CommentViewDto`

### 7. GetProfilePostQuery

**Get a post from a user's profile by profileId and postId.**

- **Вход:** `profileId`, `postId`, `currentUserId`
- **Логика:**
  1. Проверка существования профиля и пользователя
  2. Проверка принадлежности поста пользователю профиля
  3. Получение реакции текущего пользователя и последних лайков
- **Результат:** `PostView`

---

## Репозитории (Infrastructure)

### PostRepository

Операции записи для постов:

| Метод                  | Описание                                  |
| ---------------------- | ----------------------------------------- |
| `createPost()`         | Создание поста (с поддержкой транзакции)  |
| `findById()`           | Поиск поста по ID (включая user и files)  |
| `updateDescription()`  | Обновление описания поста                 |
| `softDeletePostById()` | Soft-delete поста (установка `deletedAt`) |
| `findActivePostById()` | Поиск активного (не удалённого) поста     |
| `updatePostLike()`     | Upsert лайка поста и обновление счётчиков |

### QueryPostRepository

Операции чтения для постов и комментариев:

| Метод                      | Описание                                            |
| -------------------------- | --------------------------------------------------- |
| `findById()`               | Поиск поста по ID                                   |
| `exists()`                 | Проверка существования активного поста              |
| `findCommentsByPostId()`   | Пагинированные комментарии с вложенными reply       |
| `findCommentById()`        | Поиск активного комментария по ID                   |
| `findUserPosts()`          | Пагинированные посты пользователя с реакциями       |
| `getPostsWithPagination()` | Пагинированные посты для главной страницы           |
| `findUserReactionToPost()` | Реакция пользователя на пост                        |
| `findNewestLikesForPost()` | Последние N лайков к посту для отображения аватарок |

### ExternalQueryPostsRepository

Внешние запросы для других модулей (экспортируется из `PostsModule`):

| Метод                     | Описание                          |
| ------------------------- | --------------------------------- |
| `getPostsByUserIds()`     | Посты по массиву ID пользователей |
| `getPostsCountByUserId()` | Количество постов пользователя    |

### CommentRepository

Операции для комментариев:

| Метод                         | Описание                                              |
| ----------------------------- | ----------------------------------------------------- |
| `findExistingAndActivePost()` | Проверка существования поста                          |
| `findActiveCommentById()`     | Поиск активного комментария                           |
| `resolveRootId()`             | Вычисление корневого ID для вложенных комментариев    |
| `createComment()`             | Создание комментария с поддержкой `parentId`/`rootId` |
| `updateCommentLike()`         | Upsert лайка комментария и обновление счётчиков       |

### PostFilesRepository

Операции для файлов поста:

| Метод                       | Описание                              |
| --------------------------- | ------------------------------------- |
| `createPostFiles()`         | Создание записей файлов (mass insert) |
| `deletePostFilesByPostId()` | Удаление всех файлов поста            |

---

## Адаптеры и интеграции

### FilesHttpAdapter

HTTP-адаптер для взаимодействия с микросервисом `files`. Использует `axios` для REST-запросов.

| Метод                | Endpoint                                             | Описание                   |
| -------------------- | ---------------------------------------------------- | -------------------------- |
| `uploadFiles()`      | `{filesUrl}/{GLOBAL_PREFIX}/files/upload-post-files` | Загрузка файлов поста      |
| `uploadUserAvatar()` | `{filesUrl}/{endpoint}`                              | Загрузка аватара           |
| `delete()`           | Произвольный endpoint                                | DELETE-запрос              |
| `deleteFile()`       | `/api/v1/files/delete-file/{key}`                    | Удаление одного файла      |
| `deletePostFiles()`  | `/api/v1/files/delete-post-files/{postId}`           | Удаление всех файлов поста |
| `deleteUserAvatar()` | `/api/v1/profile/{userId}`                           | Удаление аватара           |

Запросы аутентифицируются через `buildInternalApiHeaders()` с использованием `internalServiceName` и `internalApiKey`.

---

## События и RabbitMQ

### PostEventsPublisher

Публикует доменные события в RabbitMQ exchange `lumio_events` с типом `topic`.

| Событие        | Routing Key    | Описание          |
| -------------- | -------------- | ----------------- |
| `post.created` | `post.created` | Создан новый пост |

**Формат события `PostCreatedEvent`:**

```typescript
{
  id: string;
  description: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    isBlocked: boolean;
  }
  files: Array<{
    id: number;
    url: string;
    postId: string;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
}
```

---

## DTO — Входные данные (Input)

| DTO                       | Поля                                                     | Валидация                                       |
| ------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------- | ------- |
| `InputCreatePostDto`      | `description: string`                                    | `@IsString`, `@MaxLength(500)`                  |
| `InputUpdatePostDto`      | `description: string` (PickType из CreatePostDto)        |                                                 |
| `CreateCommentInputDto`   | `content: string`, `parentId?: number`                   | `@IsString`, `@MinLength(1)`, `@MaxLength(300)` |
| `GetPostsQueryParams`     | `sortBy: PostsSortBy` (наследует пагинацию)              | `@IsEnum`                                       |
| `GetMainPageInputDto`     | `pageSize: number` (по умолчанию 4)                      | `@IsOptional`, `@Transform`                     |
| `GetPostCommentsQueryDto` | `sortBy: CommentSortField`, `pageSize` (по умолчанию 20) | `@IsEnum`, `@Transform`                         |
| `LikePostInputDto`        | `status: 'like'                                          | 'dislike'                                       | 'none'` | `@IsIn` |
| `LikeCommentInputDto`     | `status: 'like'                                          | 'dislike'                                       | 'none'` | `@IsIn` |

## DTO — Выходные данные (Output)

### PostView

| Поле           | Тип                | Описание                         |
| -------------- | ------------------ | -------------------------------- | ------- | ----------------------------- |
| `id`           | `string`           | UUID поста                       |
| `description`  | `string`           | Текст поста                      |
| `createdAt`    | `Date`             | Дата создания                    |
| `userId`       | `number`           | ID автора                        |
| `likeCount`    | `number`           | Количество лайков                |
| `dislikeCount` | `number`           | Количество дизлайков             |
| `userReaction` | `'like'            | 'dislike'                        | 'none'` | Реакция текущего пользователя |
| `postFiles`    | `OutputFileType[]` | Прикреплённые файлы              |
| `newestLikes`  | `PostLikeView[]`   | Последние 3 лайка (для аватарок) |

### CommentViewDto

| Поле           | Тип                | Описание                 |
| -------------- | ------------------ | ------------------------ | ------------- | ----------------------------- |
| `id`           | `number`           | ID комментария           |
| `content`      | `string`           | Текст комментария        |
| `likeCount`    | `number`           | Количество лайков        |
| `dislikeCount` | `number`           | Количество дизлайков     |
| `createdAt`    | `Date`             | Дата создания            |
| `userId`       | `number`           | ID автора                |
| `username`     | `string`           | Username автора          |
| `avatarUrl`    | `string            | null`                    | Аватар автора |
| `userReaction` | `'none'            | 'like'                   | 'dislike'`    | Реакция текущего пользователя |
| `replies`      | `CommentViewDto[]` | Вложенные ответы (reply) |

### MainPageView

| Поле                      | Тип                            | Описание                       |
| ------------------------- | ------------------------------ | ------------------------------ |
| `posts`                   | `PaginatedViewDto<PostView[]>` | Пагинированный список постов   |
| `allRegisteredUsersCount` | `number`                       | Общее количество пользователей |

### PaginatedPostViewDto extends PaginatedViewDto<PostView[]>

| Поле         | Тип          | Описание                 |
| ------------ | ------------ | ------------------------ | -------------------------- |
| `items`      | `PostView[]` | Список постов            |
| `page`       | `number`     | Текущая страница         |
| `pageSize`   | `number`     | Размер страницы          |
| `pagesCount` | `number`     | Общее количество страниц |
| `totalCount` | `number`     | Общее количество постов  |
| `role`       | `'author'    | 'viewer'`                | Роль текущего пользователя |

---

## Модуль (PostsModule)

```typescript
@Module({
  imports: [UserAccountsModule, JwtModule, SessionsModule, LoggerModule],
  controllers: [PostsController, MainController],
  providers: [
    useCases, // Command/Query handlers
    adapters, // FilesHttpAdapter
    repositories, // PostRepository, PostFilesRepository, CommentRepository
    queryRepositories, // QueryPostRepository
    externalQueryRepositories, // ExternalQueryPostsRepository
    eventPublishers, // PostEventsPublisher
  ],
  exports: [ExternalQueryPostsRepository],
})
export class PostsModule {}
```

**Экспортируется** `ExternalQueryPostsRepository` для использования в других модулях (например, для получения количества постов пользователя).

---

## Обработка ошибок

| Тип исключения              | Условие                                       | HTTP статус |
| --------------------------- | --------------------------------------------- | ----------- |
| `NotFoundDomainException`   | Пользователь/пост/комментарий не найден       | 404         |
| `ForbiddenDomainException`  | Пост не принадлежит пользователю              | 403         |
| `BadRequestDomainException` | Некорректные данные или parentId не совпадает | 400         |

---

## Ключевые особенности реализации

1. **Транзакции** — создание поста и файлов выполняется в единой транзакции Prisma
2. **Денормализованные счётчики** — `likeCount` и `dislikeCount` хранятся в `Post` и `Comment` для быстрого чтения
3. **Soft delete** — посты и комментарии не удаляются физически, а помечаются `deletedAt`
4. **Вложенные комментарии** — через `parentId` и `rootId` для группировки reply под корневым комментарием
5. **Last-in-first-out cleanup** — при ошибке создания поста файлы удаляются из S3
6. **Reactions** — `upsert` для лайков, `deleteMany` для `none` статуса, всё в транзакции
7. **OptionalJwtAuth** — публичные эндпоинты (главная страница, профильные посты) работают как с аутентификацией, так и без неё
