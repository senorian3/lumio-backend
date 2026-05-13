# Модуль User Accounts (Учётные записи пользователей)

## Обзор

Модуль `UserAccountsModule` отвечает за аутентификацию, регистрацию, управление профилями пользователей и работу с учётными записями в микросервисе **lumio**. Модуль реализован с использованием CQRS-паттерна (Command & Query Bus) и NestJS.

**Импорт:** `@lumio/modules/user-accounts/user-accounts.module`  
**Базовый путь в API:**

- `auth/` — аутентификация
- `profile/` — профили

---

## Структура модуля

```
user-accounts/
├── auth/                               # Аутентификация и авторизация
│   ├── api/
│   │   └── auth.controller.ts         # REST-эндпоинты аутентификации
│   └── application/
│       ├── auth.service.ts            # Сервис проверки учётных данных
│       ├── commands/                   # CQRS Command Handlers
│       │   ├── register-user.command-handler.ts
│       │   ├── registration-confirmation.command-handler.ts
│       │   ├── login-user.command-handler.ts
│       │   ├── login-user-yandex.command-handler.ts
│       │   ├── logout-user.command-handler.ts
│       │   ├── refresh-token.command-handler.ts
│       │   ├── password-recovery.command-handler.ts
│       │   └── new-password.command-handler.ts
│       └── queries/
│           └── about-user.query-handler.ts  # Получение информации о пользователе
├── profile/                            # Управление профилями
│   ├── api/
│   │   ├── profile.controller.ts      # REST-эндпоинты профилей
│   │   └── dto/
│   │       ├── input/                  # Входные DTO (edit-profile, fill-profile)
│   │       ├── output/                 # Выходные DTO (profile.view-dto)
│   │       └── transfer/               # Transfer DTO для Command/Query
│   ├── application/
│   │   ├── commands/
│   │   │   ├── fill-profile.command-handler.ts
│   │   │   ├── update-profile.command-handler.ts
│   │   │   ├── upload-avatar.command-handler.ts
│   │   │   └── delete-avatar.command-handler.ts
│   │   └── queries/
│   │       └── get-profile.query-handler.ts
│   └── domain/
│       └── dto/                        # Domain DTO (edit-profile, fill-profile)
├── users/                              # Сущности и репозитории пользователей
│   ├── api/dto/
│   │   ├── input/                      # Входные DTO (login, registration, password-recovery, new-password, registration-confirmation)
│   │   ├── output/                     # Выходные DTO (about-user)
│   │   └── transfer/                   # Transfer DTO
│   ├── application/commands/
│   │   └── create-user.command-handler.ts
│   └── domain/
│       ├── dto/
│       │   └── create-user.domain.dto.ts
│       ├── entities/                   # Доменные сущности
│       │   ├── user.entity.ts
│       │   ├── user-profile.entity.ts
│       │   ├── email-confirmation.entity.ts
│       │   ├── subscription.entity.ts
│       │   └── yandex.entity.ts
│       └── infrastructure/             # Репозитории
│           ├── user.repository.ts
│           ├── user.query.repository.ts
│           └── user.external-query.repository.ts
├── adapters/                           # Адаптеры для внешних сервисов
│   ├── crypto.service.ts              # Хеширование паролей (bcryptjs)
│   ├── recaptcha.service.ts           # Google reCAPTCHA
│   └── nodemailer/
│       ├── nodemailer.service.ts      # Отправка email-писем
│       └── template/
│           └── email-examples.ts      # Шаблоны писем
├── config/
│   ├── user-accounts.config.ts        # Конфигурация (секреты, сроки токенов и т.д.)
│   └── cookie.helper.ts               # Хелперы для установки/очистки cookies
├── constants/
│   ├── auth.constants.ts              # Константы аутентификации
│   └── auth-tokens.inject-constants.ts # Injection tokens для JWT стратегий
├── scheduler/
│   └── users-scheduler.ts             # Планировщик (удаление неподтверждённых учётных записей)
└── user-accounts.module.ts            # Корневой модуль
```

---

## 1. Аутентификация (Auth)

### 1.1 API Эндпоинты

| Метод  | Путь                             | Описание                               | Guard                 | HTTP Status         |
| ------ | -------------------------------- | -------------------------------------- | --------------------- | ------------------- |
| `GET`  | `auth/me`                        | Получение данных текущего пользователя | `JwtAuthGuard`        | `200 OK`            |
| `GET`  | `auth/yandex`                    | OAuth-вход через Яндекс                | `AuthGuard('yandex')` | `302 Found`         |
| `GET`  | `auth/yandex-callback`           | Callback после OAuth Яндекса           | `AuthGuard('yandex')` | `200 OK` + redirect |
| `POST` | `auth/register`                  | Регистрация нового пользователя        | `ThrottlerGuard`      | `201 Created`       |
| `POST` | `auth/registration-confirmation` | Подтверждение email по коду            | —                     | `204 No Content`    |
| `POST` | `auth/login`                     | Вход в систему                         | `ThrottlerGuard`      | `200 OK`            |
| `POST` | `auth/logout`                    | Выход из системы                       | `JwtAuthGuard`        | `204 No Content`    |
| `POST` | `auth/password-recovery`         | Запрос восстановления пароля           | `ThrottlerGuard`      | `204 No Content`    |
| `POST` | `auth/new-password`              | Установка нового пароля                | `ThrottlerGuard`      | `200 OK`            |
| `POST` | `auth/refresh-token`             | Обновление access-токена               | `RefreshTokenGuard`   | `200 OK`            |

### 1.2 Flow аутентификации

#### Регистрация

1. Клиент отправляет `POST /auth/register` с `{ username, email, password }`
2. **RegisterUserCommandHandler:**
   - Проверяет уникальность `username` и `email` через `UserRepository.doesExistByUsernameOrEmail()`
   - Хеширует пароль через `CryptoService`
   - Создаёт пользователя и `EmailConfirmation` с кодом подтверждения через `UserRepository.createUser()`
   - Отправляет email с кодом подтверждения через `NodemailerService`
3. Клиент получает код на email и отправляет `POST /auth/registration-confirmation` с `{ confirmCode }`
4. **RegistrationConfirmationUserCommandHandler:**
   - Находит `EmailConfirmation` по коду
   - Проверяет, не истекло ли время (1 час)
   - Подтверждает email (`isConfirmed = true`)

#### Вход (Login)

1. Клиент отправляет `POST /auth/login` с `{ email, password }`
2. **AuthService.checkUserCredentials():**
   - Ищет пользователя по email
   - Проверяет, подтверждён ли email
   - Сравнивает пароль через `CryptoService.comparePasswords()`
3. **LoginUserCommandHandler:**
   - Создаёт новую сессию (устройство, IP, user-agent)
   - Генерирует `accessToken` и `refreshToken` через JWT
   - Возвращает `{ accessToken }` в теле ответа, `refreshToken` устанавливается в httpOnly cookie

#### OAuth через Яндекс

1. Клиент переходит на `GET /auth/yandex` — редирект на Яндекс OAuth
2. После подтверждения Яндекс редиректит на `GET /auth/yandec-callback`
3. **LoginUserYandexCommandHandler:**
   - Извлекает профиль пользователя из `req.user` (email, yandexId, username)
   - Ищет существующую запись Yandex по `yandexId` через `UserRepository`
   - Если пользователь существует — обновляет данные и создаёт сессию
   - Если новый — создаёт пользователя, Yandex-запись, email подтверждается автоматически
   - Генерирует `accessToken` и `refreshToken`
   - Редиректит на фронтенд с `accessToken` в query-параметре

#### Обновление токена (Refresh Token)

1. Клиент отправляет `POST /auth/refresh-token` с `refreshToken` в cookie
2. **RefreshTokenGuard:**
   - Извлекает токен из `cookies.refreshToken`
   - Верифицирует через JWT с `refreshTokenSecret`
   - Находит сессию по `deviceId`/`userId`, проверяет совпадение данных
3. **RefreshTokenCommandHandler:**
   - Проверяет, не истекла ли сессия
   - Удаляет старый refresh-токен
   - Генерирует новую пару токенов

#### Выход (Logout)

1. Клиент отправляет `POST /auth/logout` с JWT-токеном в заголовке
2. **LogoutUserCommandHandler:**
   - Находит сессию по `userId` и `deviceId`
   - Устанавливает `deletedAt` для сессии (soft delete)
   - Очищает cookie через `cookie.helper`

#### Восстановление пароля

1. Клиент отправляет `POST /auth/password-recovery` с `{ email }`
2. **PasswordRecoveryCommandHandler:**
   - Генерирует новый код подтверждения (recovery code)
   - Обновляет `EmailConfirmation` с новым кодом и сроком действия
   - Отправляет email с кодом восстановления
3. Клиент отправляет `POST /auth/new-password` с `{ recoveryCode, newPassword }`
4. **NewPasswordCommandHandler:**
   - Находит `EmailConfirmation` по recovery code
   - Проверяет срок действия
   - Хеширует новый пароль и обновляет его в БД
   - Подтверждает email (если не был подтверждён)

---

## 2. Профили (Profile)

### 2.1 API Эндпоинты

| Метод    | Путь                    | Описание               | Guard          | HTTP Status      |
| -------- | ----------------------- | ---------------------- | -------------- | ---------------- |
| `GET`    | `profile/:userId`       | Получение профиля      | —              | `200 OK`         |
| `POST`   | `profile/upload-avatar` | Загрузка аватара       | `JwtAuthGuard` | `201 Created`    |
| `PUT`    | `profile/fill-profile`  | Заполнение профиля     | `JwtAuthGuard` | `200 OK`         |
| `PUT`    | `profile/:userId`       | Редактирование профиля | `JwtAuthGuard` | `200 OK`         |
| `DELETE` | `profile/delete-avatar` | Удаление аватара       | `JwtAuthGuard` | `204 No Content` |

### 2.2 Описание эндпоинтов

#### Получение профиля (`GET /profile/:userId`)

- Публичный эндпоинт (без авторизации)
- **GetProfileQueryHandler:** находит пользователя и его профиль по `userId`, возвращает `ProfileView`

#### Загрузка аватара (`POST /profile/upload-avatar`)

- Только для авторизованных пользователей
- Принимает файл через `multipart/form-data` (поле "avatar")
- **UploadUserAvatarCommandHandler:**
  - Валидирует файл через `SingleFileValidationPipe` (тип, размер)
  - Загружает файл во внешнее хранилище через `FilesHttpAdapter`
  - Обновляет `avatarUrl` в профиле пользователя

#### Заполнение профиля (`PUT /profile/fill-profile`)

- Только для авторизованных пользователей
- `InputFillProfileDto` — обязательные поля: `firstName`, `lastName`
- **FillProfileCommandHandler:**
  - Создаёт запись `UserProfile` для пользователя
  - Устанавливает `profileFilled = true` и `profileFilledAt = new Date()`
  - Возвращает `ProfileView`

#### Редактирование профиля (`PUT /profile/:userId`)

- Только для авторизованных пользователей
- `InputEditProfileDto` — все поля опциональны: `firstName`, `lastName`, `dateOfBirth`, `country`, `city`, `aboutMe`
- **UpdateProfileCommandHandler:**
  - Обновляет поля профиля
  - Устанавливает `profileUpdatedAt = new Date()`
  - Возвращает `ProfileView`

#### Удаление аватара (`DELETE /profile/delete-avatar`)

- **DeleteUserAvatarCommandHandler:**
  - Удаляет файл аватара через `FilesHttpAdapter`
  - Устанавливает `avatarUrl = null`

---

## 3. Доменные сущности

### User (Пользователь)

```typescript
class UserEntity {
  id: number;
  username: string; // Уникальное, длина 6–30 символов
  email: string; // Уникальный email
  password: string; // Хеш пароля (bcryptjs)
  createdAt: Date;
  deletedAt: Date | null; // Soft delete
  isBlocked: boolean; // Заблокирован ли пользователь
  bannedAt: Date | null; // Дата бана
  banReason: string | null; // Причина бана

  // Relations:
  profile?: UserProfileEntity;
  emailConfirmation?: EmailConfirmationEntity;
  sessions?: SessionEntity[];
  yandex?: YandexEntity;
  posts?: PostEntity[];
}
```

### UserProfile (Профиль пользователя)

```typescript
class UserProfileEntity {
  id: number;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  city: string | null;
  aboutMe: string | null;
  avatarUrl: string | null;
  profileFilled: boolean; // Заполнен ли профиль
  profileFilledAt: Date | null;
  profileUpdatedAt: Date | null;
  accountType: string; // Тип аккаунта (по умолчанию 'Personal')
  followersCount: number;
  followingCount: number;
  userId: number;

  // Relations:
  user: UserEntity;
  subscriptions?: SubscriptionEntity[];
}
```

### EmailConfirmation (Подтверждение email)

```typescript
class EmailConfirmationEntity {
  id: number;
  confirmationCode: string; // UUID или код восстановления
  expirationDate: Date; // Срок действия (по умолчанию +1 час)
  isConfirmed: boolean;
  userId: number; // Связь 1:1 с User

  user?: UserEntity;
}
```

### Subscription (Подписка)

```typescript
class SubscriptionEntity {
  id: number;
  subscriptionId: string; // ID подписки (из платежной системы)
  durationType: string; // Тип длительности (monthly, yearly)
  startDate: Date;
  endDate: Date;
  autoRenewal: boolean; // Автопродление (по умолчанию false)
  userProfileId: number;

  userProfile: UserProfileEntity;
}
```

### Yandex (OAuth Яндекс)

```typescript
class YandexEntity {
  id: number;
  email: string;
  username: string;
  yandexId: string; // Уникальный ID от Яндекса
  userId: number;

  user: UserEntity;
}
```

---

## 4. Репозитории

### UserRepository

Основной репозиторий для операций с пользователями, профилями и Yandex-аккаунтами через Prisma.

| Метод                                               | Описание                                                        |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `doesExistByUsernameOrEmail(username, email)`       | Проверка существования пользователя по username или email       |
| `createUser(dto, passwordHash, isConfirmed?, tx?)`  | Создание пользователя с EmailConfirmation                       |
| `createUserYandex(dto, passwordHash, tx?)`          | Создание пользователя с подтверждённым email (для Yandex OAuth) |
| `findByCodeOrIdEmailConfirmation({ code, userId })` | Поиск EmailConfirmation по коду или userId                      |
| `findUserByEmail(email, tx?)`                       | Поиск пользователя по email с EmailConfirmation                 |
| `updateCodeAndExpirationDate(userId, code, date)`   | Обновление кода подтверждения и срока                           |
| `updatePassword(userId, newPasswordHash, tx?)`      | Обновление пароля                                               |
| `findUserById(id, tx?)`                             | Поиск пользователя по ID                                        |
| `confirmEmail(userId)`                              | Подтверждение email                                             |
| `deleteExpiredUserRegistration(date)`               | Удаление неподтверждённых регистраций (транзакция)              |
| `findYandexByYandexId(yandexId, tx?)`               | Поиск Yandex-аккаунта по yandexId                               |
| `createYandex(data, tx?)`                           | Создание Yandex-записи                                          |
| `updateYandex(id, data, tx?)`                       | Обновление Yandex-записи                                        |
| `fillProfile(userId, data)`                         | Создание профиля пользователя                                   |
| `updateProfile(userId, data)`                       | Обновление профиля                                              |
| `updateAvatarUrl(userId, avatarUrl)`                | Обновление URL аватара                                          |
| `findUserProfileByUserId(userId)`                   | Поиск профиля по userId                                         |

### QueryUserRepository

Репозиторий для чтения данных с дополнительными фильтрами (статус блокировки, подписки и т.д.).

### ExternalQueryUserAccountsRepository

Репозиторий для внешних запросов (из других модулей) — проверка блокировки пользователя.

---

## 5. Адаптеры

### CryptoService (`/adapters/crypto.service.ts`)

- Использует `bcryptjs` для хеширования и сравнения паролей
- `createPasswordHash(password: string): Promise<string>`
- `comparePasswords(password: string, hash: string): Promise<boolean>`

### NodemailerService (`/adapters/nodemailer/nodemailer.service.ts`)

- Отправка email-писем через Nodemailer
- Использует почтовый транспорт из конфигурации

### EmailService (`/adapters/nodemailer/template/email-examples.ts`)

- Шаблоны email-писем:
  - `verificationEmailTemplate(code)` — письмо с кодом подтверждения регистрации
  - `passwordRecoveryEmailTemplate(code)` — письмо с кодом восстановления пароля

### RecaptchaService (`/adapters/recaptcha.service.ts`)

- Верификация Google reCAPTCHA токенов

---

## 6. Безопасность

### Guards

| Guard                 | Описание                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JwtAuthGuard`        | Проверяет JWT access-токен. Дополнительно: проверяет активность сессии (`ExternalQuerySessionsRepository`), версию токена, блокировку пользователя |
| `RefreshTokenGuard`   | Проверяет refresh-токен из cookie. Верифицирует через JWT, ищет сессию по `deviceId`/`userId`, проверяет совпадение данных                         |
| `AuthGuard('yandex')` | OAuth2-стратегия для входа через Яндекс                                                                                                            |
| `ThrottlerGuard`      | Ограничение частоты запросов (rate limiting) для эндпоинтов аутентификации                                                                         |

### Cookies

- **refreshToken** — httpOnly cookie, устанавливается через `getStrictCookieOptions()`:
  - `httpOnly: true`
  - `secure: true` (в production)
  - `sameSite: 'strict'`
  - `path: '/auth/refresh-token'`
- Очистка cookie при logout через `getClearCookieOptions()`

---

## 7. JWT Токены

Модуль использует два JWT токена с разными стратегиями:

| Токен             | Injection Token                       | Secret               | Срок действия                       |
| ----------------- | ------------------------------------- | -------------------- | ----------------------------------- |
| **Access Token**  | `ACCESS_TOKEN_STRATEGY_INJECT_TOKEN`  | `accessTokenSecret`  | `accessTokenExpireIn` (из конфига)  |
| **Refresh Token** | `REFRESH_TOKEN_STRATEGY_INJECT_TOKEN` | `refreshTokenSecret` | `refreshTokenExpireIn` (из конфига) |

Оба токена создаются через фабрику `createJwtServiceProvider`, которая динамически инжектит `UserAccountsConfig`.

---

## 8. Планировщик (Scheduler)

`UserSchedulerService` — NestJS `@Cron` задача:

- Запускается по расписанию (cron-выражение)
- Удаляет пользователей, у которых:
  - Email не подтверждён (`isConfirmed = false`)
  - Истёк срок подтверждения (`expirationDate <= now`)
- Выполняется в транзакции: сначала удаляются `EmailConfirmation`, затем пользователи

---

## 9. Конфигурация

### UserAccountsConfig (`/config/user-accounts.config.ts`)

Загружается из переменных окружения и предоставляет:

| Поле                   | Описание                                          |
| ---------------------- | ------------------------------------------------- |
| `accessTokenSecret`    | Секрет для access-токена                          |
| `refreshTokenSecret`   | Секрет для refresh-токена                         |
| `accessTokenExpireIn`  | Срок жизни access-токена (ms-формат, e.g. '15m')  |
| `refreshTokenExpireIn` | Срок жизни refresh-токена (ms-формат, e.g. '30d') |

---

## 10. Зависимости модуля

Модуль импортирует:

- `SessionsModule` — управление сессиями
- `PassportModule` — стратегии аутентификации (JWT, Yandex OAuth)
- `JwtModule` — работа с JWT
- `LoggerModule` — логирование

Экспортирует:

- `UserAccountsConfig` — конфигурация для других модулей
- `ExternalQueryUserAccountsRepository` — внешний репозиторий (проверка блокировки)
- `ExternalQuerySessionsRepository` — внешний репозиторий сессий

---

## 11. Валидация DTO

| DTO                                | Описание валидации                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `InputRegistrationDto`             | `username`: string, 6–30 символов;<br>`password`: string, 6–20 символов;<br>`email`: валидный email                                           |
| `InputLoginDto`                    | Наследует `email` и `password` из `InputRegistrationDto`                                                                                      |
| `InputPasswordRecoveryDto`         | `email`: валидный email                                                                                                                       |
| `InputNewPasswordDto`              | `password`: string, 6–20 символов;<br>`recoveryCode`: string (UUID)                                                                           |
| `InputRegistrationConfirmationDto` | `confirmCode`: string                                                                                                                         |
| `InputEditProfileDto`              | Все поля опциональны:<br>`firstName, lastName, country, city, aboutMe`: string, 1–100/200 символов;<br>`dateOfBirth`: дата, возраст от 13 лет |
| `InputFillProfileDto`              | Как `InputEditProfileDto`, но `firstName` и `lastName` обязательны                                                                            |
| `ProfileView`                      | Выходной DTO с форматированием `dateOfBirth` в формат `DD.MM.YYYY`                                                                            |

---

## 12. Типовые Flow

### Flow: Полная регистрация новго пользователя

```
POST /auth/register          → 201 Created
POST /auth/registration-     → 204 No Content
     confirmation
     { confirmCode: "..." }
POST /auth/login             → 200 OK
     { email, password }      → { accessToken: "..." }
                                + set-cookie: refreshToken

POST /profile/fill-profile   → 200 OK (JwtAuthGuard)
     { firstName, lastName,   → ProfileView
       dateOfBirth, ... }
```

### Flow: Вход через Яндекс

```
GET /auth/yandex             → 302 Redirect (на Яндекс OAuth)
GET /auth/yandex-callback    → 302 Redirect (на фронтенд)
     (проверка Яндексом)      → ?accessToken=...
                               + set-cookie: refreshToken
```

### Flow: Восстановление пароля

```
POST /auth/password-recovery → 204 No Content
     { email }
     (на почту приходит recoveryCode)
POST /auth/new-password      → 200 OK
     { recoveryCode,          → void
       newPassword }
```

---

## 13. Аудит и безопасность

- Пароли никогда не возвращаются в ответах API
- Токены имеют ограниченный срок действия
- Refresh-токен хранится в httpOnly cookie, недоступной для JavaScript
- При выходе из системы токен аннулируется (удаление сессии)
- При каждом логине создаётся новая сессия, позволяющая управлять устройствами
- reCAPTCHA защищает эндпоинты от ботов (на уровне контроллера)
- Rate limiting через `ThrottlerGuard` защищает от перебора паролей

---

## 14. Роуты и константы

Модуль использует константы маршрутов из `@lumio/core/routes/`:

```typescript
// auth-routes.ts
export const AUTH_BASE = 'auth' as const;
export const AUTH_ROUTES = {
  ME: 'me',
  YANDEX: 'yandex',
  YANDEX_CALLBACK: 'yandex-callback',
  REGISTRATION: 'register',
  REGISTRATION_CONFIRMATION: 'registration-confirmation',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RECOVERY: 'password-recovery',
  NEW_PASSWORD: 'new-password',
  REFRESH_TOKEN: 'refresh-token',
} as const;

// profile-routes.ts
export const PROFILE_BASE = 'profile' as const;
export const PROFILE_ROUTES = {
  FILL_PROFILE: 'fill-profile',
  UPLOAD_AVATAR: 'upload-avatar',
  DELETE_AVATAR: 'delete-avatar',
} as const;
```

---

## 15. Регистрация модуля

`UserAccountsModule` регистрирует:

- **2 контроллера:** `AuthController`, `ProfileController`
- **14 CQRS use cases:** 8 auth command handlers + 1 query handler + 4 profile command handlers + 1 profile query handler + 1 user command handler
- **5 сервисов:** `NodemailerService`, `CryptoService`, `EmailService`, `RecaptchaService`, `AuthService`
- **3 репозитория:** `UserRepository`, `QueryUserRepository`, `ExternalQueryUserAccountsRepository`
- **2 стратегии:** `JwtStrategy`, `YandexStrategy`
- **2 JWT провайдера:** Access и Refresh токены
- **Планировщик:** `UserSchedulerService`
