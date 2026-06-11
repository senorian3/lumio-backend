# Модуль User Follows

## Обзор

Модуль `UserFollows` отвечает за систему подписок между пользователями (follow/unfollow). Реализует социальный граф, ленту постов от подписок, поиск пользователей и просмотр профилей.

**Архитектурный паттерн:** CQRS (Command Query Responsibility Segregation)

---

## Структура модуля

```
user-follows/
├── api/
│   ├── dto/
│   │   ├── input/
│   │   │   ├── get-feed.input-dto.ts
│   │   │   ├── search-users.input-dto.ts
│   │   │   └── user-follow-query.input-dto.ts
│   │   └── output/
│   │       ├── follow-status.view-dto.ts
│   │       ├── follower.view-dto.ts
│   │       ├── followers.paginated.view-dto.ts
│   │       ├── following.paginated.view-dto.ts
│   │       ├── following.view-dto.ts
│   │       ├── user-profile.view-dto.ts
│   │       ├── user-search.paginated.view-dto.ts
│   │       └── user-search.view-dto.ts
│   └── user-follows.controller.ts
├── application/
│   ├── commands/
│   │   ├── follow-user.command-handler.ts
│   │   └── unfollow-user.command-handler.ts
│   └── queries/
│       ├── get-feed.query-handler.ts
│       ├── get-followers.query-handler.ts
│       ├── get-following.query-handler.ts
│       ├── get-user-profile.query-handler.ts
│       └── search-users.query-handler.ts
├── domain/
│   └── infrastructure/
│       ├── user-follow.query-repository.ts
│       └── user-follow.repository.ts
├── user-follows.module.ts
└── README.md
```

---

## API Endpoints

**Базовый путь:** `users`

| Метод  | Путь                       | Описание                                   | Аутентификация |
| ------ | -------------------------- | ------------------------------------------ | -------------- |
| GET    | `/users/search`            | Поиск пользователей по username            | JWT            |
| GET    | `/users/:userId/profile`   | Профиль пользователя                       | JWT            |
| POST   | `/users/:userId/follow`    | Подписаться на пользователя                | JWT            |
| DELETE | `/users/:userId/follow`    | Отписаться от пользователя                 | JWT            |
| GET    | `/users/feed`              | Лента постов от подписок                   | JWT            |
| GET    | `/users/followers`         | Список подписчиков текущего пользователя   | JWT            |
| GET    | `/users/following`         | Список подписок текущего пользователя      | JWT            |
| GET    | `/users/:userId/followers` | Список подписчиков указанного пользователя | JWT            |
| GET    | `/users/:userId/following` | Список подписок указанного пользователя    | JWT            |

Все эндпоинты защищены `ThrottlerGuard` (ограничение запросов) и `JwtAuthGuard` (кроме ThrottlerGuard).

---

## Database Schema

### Таблица `UserFollow`

| Поле        | Тип                    | Описание                   |
| ----------- | ---------------------- | -------------------------- |
| id          | SERIAL                 | Primary key                |
| followerId  | INTEGER (FK → User.id) | Кто подписывается          |
| followingId | INTEGER (FK → User.id) | На кого подписываются      |
| createdAt   | TIMESTAMP              | Дата подписки              |
| deletedAt   | TIMESTAMP?             | Soft delete (дата отписки) |

**Индексы:**

- `followerId`
- `followingId`
- `deletedAt`
- Уникальный составной индекс: `(followerId, followingId)`

**Cascade:** `ON DELETE CASCADE` по обоим внешним ключам

### Модификации `UserProfile`

Добавлены поля для кэширования счетчиков:

- `followersCount` — количество подписчиков (INTEGER, DEFAULT 0)
- `followingCount` — количество подписок (INTEGER, DEFAULT 0)

---

## Архитектура и бизнес-логика

### Команды (Commands) — мутации

#### `FollowUserCommand`

Валидация:

- Запрещено подписываться на самого себя (`BadRequestDomainException`)
- Запрещена повторная подписка (`BadRequestDomainException`)
- Профиль подписчика должен быть заполнен (`ForbiddenDomainException`)
- Целевой пользователь должен существовать (`NotFoundDomainException`)

Транзакция:

- Создаёт запись в `UserFollow`
- Увеличивает `followingCount` у подписчика
- Увеличивает `followersCount` у целевого пользователя

#### `UnfollowUserCommand`

Валидация:

- Запрещено отписываться от самого себя (`BadRequestDomainException`)
- Подписка должна существовать (`BadRequestDomainException`)
- Профиль должен быть заполнен (`ForbiddenDomainException`)
- Целевой пользователь должен существовать (`NotFoundDomainException`)

Транзакция:

- Удаляет запись из `UserFollow` (физическое удаление)
- Уменьшает `followingCount` у подписчика
- Уменьшает `followersCount` у целевого пользователя

### Запросы (Queries) — чтение

#### `SearchUsersQuery`

- Поиск пользователей по username (case-insensitive, contains)
- Исключает заблокированных/удалённых пользователей
- Исключает текущего пользователя из результатов
- Показывает статус `isFollowing` для каждого результата
- Пагинированный ответ

#### `GetUserProfileQuery`

- Возвращает полный профиль пользователя
- Включает: username, avatar, aboutMe, followersCount, followingCount, postsCount
- Показывает `isFollowing` (подписан ли текущий пользователь)
- Показывает `isCurrentUser` (свой ли это профиль)

#### `GetFollowersQuery`

- Список пользователей, подписанных на указанного пользователя
- Пагинированный, сортировка по дате подписки (новые сверху)
- DTO содержит: id, username, avatarUrl, followedAt

#### `GetFollowingQuery`

- Список пользователей, на которых подписан указанный пользователь
- Пагинированный, сортировка по дате подписки (новые сверху)
- DTO содержит: id, username, avatarUrl, followedAt

#### `GetFeedQuery`

- Лента постов от пользователей, на которых подписан текущий пользователь
- Если подписок нет — возвращает пустой массив
- Делегирует получение постов внешнему репозиторию `ExternalQueryPostsRepository`
- Пагинированный ответ с DTO `PostView`

---

## Репозитории

### `UserFollowRepository` (мутации)

| Метод                                                                | Описание                                           |
| -------------------------------------------------------------------- | -------------------------------------------------- |
| `isAlreadyFollowing(followerId, followingId)`                        | Проверка существующей подписки                     |
| `createFollow(followerId, followingId, tx?)`                         | Создание записи подписки (с поддержкой транзакции) |
| `deleteFollow(followId, tx?)`                                        | Удаление записи подписки                           |
| `isFollowing(followerId, followingId)`                               | Проверка активной подписки                         |
| `updateProfileCounters(userId, followersDelta, followingDelta, tx?)` | Обновление счетчиков в профиле                     |
| `getFollowingIds(userId)`                                            | Получение списка ID на кого подписан пользователь  |
| `checkUserExists(userId)`                                            | Проверка существования активного пользователя      |
| `createFollowWithCounters(followerId, followingId)`                  | Транзакция: подписка + обновление счетчиков        |
| `deleteFollowWithCounters(followerId, followingId, followId)`        | Транзакция: отписка + обновление счетчиков         |

### `UserFollowQueryRepository` (чтение)

| Метод                                             | Описание                                 |
| ------------------------------------------------- | ---------------------------------------- |
| `searchUsers(currentUserId, query, followingIds)` | Поиск пользователей с пагинацией         |
| `getFollowingIds(userId)`                         | Получение списка ID подписок             |
| `isFollowing(followerId, followingId)`            | Проверка статуса подписки                |
| `getProfileCounters(userId)`                      | Получение счетчиков подписок/подписчиков |
| `getFollowers(userId, page, limit)`               | Список подписчиков с пагинацией          |
| `getFollowing(userId, page, limit)`               | Список подписок с пагинацией             |

---

## DTO (Data Transfer Objects)

### Input DTOs

| DTO                   | Наследует от       | Поля                               |
| --------------------- | ------------------ | ---------------------------------- |
| `SearchUsersInputDto` | `PaginationParams` | `username: string` (3-40 символов) |
| `GetFeedInputDto`     | `PaginationParams` | —                                  |
| `UserFollowQueryDto`  | `PaginationParams` | `userId?: number`                  |

### Output DTOs

| DTO                          | Поля                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `FollowStatusViewDto`        | `isFollowing`, `followersCount`, `followingCount`                                                                            |
| `FollowerViewDto`            | `id`, `username`, `avatarUrl?`, `followedAt`                                                                                 |
| `FollowingViewDto`           | `id`, `username`, `avatarUrl?`, `followedAt`                                                                                 |
| `PaginatedFollowersViewDto`  | extends `PaginatedViewDto<FollowerViewDto[]>`                                                                                |
| `PaginatedFollowingViewDto`  | extends `PaginatedViewDto<FollowingViewDto[]>`                                                                               |
| `UserProfileViewDto`         | `id`, `username`, `avatarUrl?`, `aboutMe?`, `followersCount`, `followingCount`, `postsCount`, `isFollowing`, `isCurrentUser` |
| `UserSearchViewDto`          | `id`, `username`, `avatarUrl?`, `isFollowing`                                                                                |
| `PaginatedUserSearchViewDto` | extends `PaginatedViewDto<UserSearchViewDto[]>`                                                                              |

---

## Зависимости модуля

| Модуль               | Назначение                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `UserAccountsModule` | Получение информации о пользователях и профилях через `ExternalQueryUserAccountsRepository` |
| `JwtModule`          | Аутентификация через JWT                                                                    |
| `SessionsModule`     | Управление сессиями                                                                         |
| `LoggerModule`       | Логирование                                                                                 |
| `PrismaModule`       | Доступ к базе данных                                                                        |
| `PostsModule`        | Получение постов для ленты через `ExternalQueryPostsRepository`                             |

---

## Безопасность и валидация

1. **ThrottlerGuard** — защита от DDoS на уровне контроллера
2. **JwtAuthGuard** — все эндпоинты требуют JWT-токен
3. **Domain Exceptions**:
   - `BadRequestDomainException` — невалидные данные (подписка на себя, повторная подписка, отсутствие подписки)
   - `ForbiddenDomainException` — незаполненный профиль
   - `NotFoundDomainException` — пользователь не найден
4. **ParseIntPipe** — валидация числовых параметров пути
5. **class-validator** — валидация DTO (SearchUsersInputDto: `@IsString`, `@MinLength(3)`, `@MaxLength(40)`)

---

## Примечания

- **Soft delete:** В таблице `UserFollow` используется поле `deletedAt`. При отписке запись удаляется физически (метод `deleteFollow`), а не через soft delete. Поле `deletedAt` предусмотрено для будущих сценариев.
- **Счетчики:** `followersCount` и `followingCount` хранятся в `UserProfile` для быстрого доступа без подсчёта каждый раз. Обновляются в транзакции вместе с созданием/удалением подписки.
- **Лента:** Посты для ленты запрашиваются из модуля `Posts` через внешний репозиторий. Если у пользователя нет подписок, возвращается пустой массив без запроса к БД.
- **Поиск пользователей:** Использует `mode: 'insensitive'` для регистронезависимого поиска. Исключает заблокированных, удалённых и самого текущего пользователя.
