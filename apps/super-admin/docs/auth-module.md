# Auth Module — Super Admin

## Обзор

Модуль аутентификации микросервиса **super-admin** отвечает за авторизацию администратора панели управления. Реализует **JWT-based authentication** через GraphQL API.

---

## Структура модуля

```
apps/super-admin/src/modules/auth/
├── auth.module.ts              # NestJS модуль
├── api/
│   ├── auth.resolver.ts        # GraphQL резолвер (мутация login)
│   └── schema/
│       ├── login.input.ts      # Входной DTO
│       └── login.response.ts   # Выходной DTO (access token)
```

---

## GraphQL API

### Мутация `login`

**Endpoint:** `POST /api/v1/graphql`

Аутентифицирует администратора по email и паролю. Возвращает JWT access token.

#### Запрос

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
  }
}
```

**Переменные:**

| Поле       | Тип      | Обязательное | Описание              |
| ---------- | -------- | :----------: | --------------------- |
| `email`    | `String` |      ✅      | Email администратора  |
| `password` | `String` |      ✅      | Пароль администратора |

#### Ответ

```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

| Поле          | Тип      | Описание                         |
| ------------- | -------- | -------------------------------- |
| `accessToken` | `String` | JWT токен для Bearer авторизации |

#### Ошибки

| Код         | HTTP статус | Описание                  |
| ----------- | :---------: | ------------------------- |
| `Forbidden` |     403     | Неверный email или пароль |

---

## Компоненты

### 1. AuthModule (`auth.module.ts`)

```typescript
@Module({
  providers: [AuthResolver],
})
export class AuthModule {}
```

Простой модуль, регистрирующий GraphQL резолвер. Импортируется в `SuperAdminModule`.

### 2. AuthResolver (`auth.resolver.ts`)

GraphQL резолвер с мутацией `login`. Логика аутентификации:

1. Сравнивает `email` и `password` из запроса с переменными окружения `SUPER_ADMIN_EMAIL` и `SUPER_ADMIN_PASSWORD`.
2. При несовпадении выбрасывает `GraphQLError` с кодом `Forbidden`.
3. При успехе создаёт JWT токен с полями:
   - `iat` — время выпуска (unix timestamp)
   - `role` — строка `"super-admin"`
4. Возвращает объект `LoginResponse` с полем `accessToken`.

**Важно:** JWT подписывается вручную через библиотеку `jsonwebtoken`, **без использования** `@nestjs/jwt` или `passport-jwt`.

### 3. LoginInput (`login.input.ts`)

```typescript
@InputType()
export class LoginInput {
  @Field(() => String, { description: 'Email администратора' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'Пароль администратора' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  password: string;
}
```

- Валидация через `class-validator`: `@IsEmail()`, `@IsNotEmpty()`, `@IsString()`, `@MinLength(1)`.

### 4. LoginResponse (`login.response.ts`)

```typescript
@ObjectType()
export class LoginResponse {
  @Field(() => String, { description: 'JWT access токен для авторизации' })
  accessToken: string;
}
```

### 5. SuperAdminJwtGuard (`core/guard/jwt/super-admin-jwt.guard.ts`)

Guard для защиты GraphQL резолверов. Проверяет:

1. Наличие заголовка `Authorization: Bearer <token>`.
2. Валидность JWT (проверка подписи через `SUPER_ADMIN_SECRET`).
3. Срок действия токена (проверка `iat` + `SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES`).

**Использование:**

```typescript
@Resolver()
@UseGuards(SuperAdminJwtGuard) // <— требуется JWT токен
export class SomeResolver {}
```

---

## Конфигурация (Env Variables)

Переменные окружения, используемые модулем auth:

| Переменная                             | Тип      | По умолчанию | Описание                         |
| -------------------------------------- | -------- | :----------: | -------------------------------- |
| `SUPER_ADMIN_SECRET`                   | `String` |      —       | Секретный ключ для подписи JWT   |
| `SUPER_ADMIN_EMAIL`                    | `String` |      —       | Email супер-администратора       |
| `SUPER_ADMIN_PASSWORD`                 | `String` |      —       | Пароль супер-администратора      |
| `SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES` | `Number` |     `15`     | Время жизни JWT токена в минутах |

---

## Схема аутентификации (Sequence Diagram)

```
Client (Web/Admin Panel)        Super Admin API (GraphQL)      Env Config
         │                              │                        │
         │  Mutation: login(email, pw)  │                        │
         │ ──────────────────────────>  │                        │
         │                              │  Read SUPER_ADMIN_EMAIL│
         │                              │  & SUPER_ADMIN_PASSWORD│
         │                              │ ─────────────────────> │
         │                              │  <──────────────────── │
         │                              │                        │
         │         ❌ Invalid credentials │                       │
         │  < GraphQLError(Forbidden)   │                        │
         │                              │                        │
         │         ✅ Valid credentials  │                        │
         │                              │  Sign JWT (iat, role) │
         │                              │  with SUPER_ADMIN_SECRET
         │                              │ ─────────────────────> │
         │                              │  <──────────────────── │
         │  < accessToken               │                        │
         │                              │                        │
```

---

## Защищённые эндпоинты

Для доступа к защищённым мутациям/запросам необходимо передавать JWT токен в заголовке:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Используемые guards:**

- `SuperAdminJwtGuard` — проверяет валидность и срок действия JWT.

---

## Отличия от других микросервисов

| Аспект                       | Super Admin Auth                | Другие микросервисы (lumio, etc.) |
| ---------------------------- | ------------------------------- | --------------------------------- |
| **Стратегия**                | In-house (email + env password) | Passport (local, JWT, Yandex)     |
| **Библиотека JWT**           | `jsonwebtoken` (ручная работа)  | `@nestjs/jwt` + `passport-jwt`    |
| **Поддержка OAuth (Яндекс)** | Нет                             | Есть (`passport-yandex`)          |
| **Refresh token**            | Нет                             | Есть                              |
| **Logout**                   | Нет (stateless JWT)             | Есть (инвалидация токена)         |
| **Регистрация**              | Нет (учётка в env)              | Есть                              |
| **GraphQL vs REST**          | GraphQL                         | REST                              |
| **Prisma/БД**                | Не используется для auth        | Используется (users table)        |

---

## Примеры вызовов

### Успешный вход (cURL)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($input: LoginInput!) { login(input: $input) { accessToken } }",
    "variables": {
      "input": {
        "email": "admin@gmail.com",
        "password": "admin"
      }
    }
  }'
```

**Ответ:**

```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Неуспешный вход (неверный пароль)

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($input: LoginInput!) { login(input: $input) { accessToken } }",
    "variables": {
      "input": {
        "email": "admin@gmail.com",
        "password": "wrong_password"
      }
    }
  }'
```

**Ответ:**

```json
{
  "errors": [
    {
      "message": "Invalid email or password",
      "extensions": {
        "code": "Forbidden"
      }
    }
  ]
}
```

### Защищённый запрос с токеном

```bash
curl -X POST http://localhost:3004/api/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "query": "{ someProtectedQuery }"
  }'
```

---

## Безопасность

1. **JWT секрет** хранится в переменной окружения `SUPER_ADMIN_SECRET` (не в коде).
2. **Пароль администратора** хранится в `SUPER_ADMIN_PASSWORD` (нет хеширования — сравнение с plain text).
3. **Токены имеют ограниченное время жизни** (`SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES`, по умолчанию 15 минут).
4. **CORS** настроен на разрешённые origins (включая production домены).
5. **GraphQL Playground** и **Introspection** отключаются в production.

---

## Заметки

- Модуль НЕ использует CQRS (команды/обработчики отсутствуют).
- Модуль НЕ использует Passport.js, Prisma или базу данных для аутентификации.
- Аутентификация stateless — токен не хранится на сервере.
- Refresh token не предусмотрен — при истечении токена требуется повторный логин.
- Роль `"super-admin"` захардкожена в payload JWT и не извлекается из БД.
