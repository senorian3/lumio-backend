# Lumio Backend

Backend API for Lumio application — a NestJS monorepo with microservices architecture.

## Architecture

The project consists of **5 microservices**:

| Microservice    | Port | Description                                                            |
| --------------- | ---- | ---------------------------------------------------------------------- |
| **lumio**       | 3000 | Main API Gateway — user accounts, auth, posts, payments, notifications |
| **files**       | 3001 | File management — avatars, post files, chat files (S3/MinIO)           |
| **payments**    | 3002 | Payment processing — Stripe integration, subscriptions                 |
| **super-admin** | 3003 | Admin panel — GraphQL API for user management                          |
| **chat**        | 3004 | Real-time messaging — WebSocket + REST API                             |

### Tech Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL + Prisma ORM
- **Message Broker**: RabbitMQ (via amqplib)
- **Caching**: Redis (via BullMQ)
- **File Storage**: AWS S3 / MinIO
- **Payments**: Stripe
- **Auth**: JWT, Passport (local, Yandex OAuth2)
- **API**: REST (Swagger) + GraphQL (super-admin) + WebSocket (chat)
- **Testing**: Jest with ts-jest

## Project Structure

```
lumio/
├── apps/
│   ├── lumio/           # Main API Gateway
│   ├── files/           # File management service
│   ├── payments/        # Payment processing service
│   ├── super-admin/     # Admin panel (GraphQL)
│   └── chat/            # Real-time chat service
├── libs/
│   ├── core/            # Shared utilities, exceptions, pipes, decorators
│   ├── dto/             # Shared DTOs (file output, transfer DTOs)
│   ├── logger/          # Logger module
│   └── settings/        # Configuration utilities
├── generated/           # Generated Prisma clients
└── docs/                # Documentation
```

## Prerequisites

- Node.js >= 20.x
- Yarn
- PostgreSQL 15+
- Docker (for local development)

## Quick Start

### 1. Install dependencies

```bash
yarn install
```

### 2. Start infrastructure (PostgreSQL, RabbitMQ)

```bash
# Start all services
yarn docker:up:lumio
yarn docker:up:files
yarn docker:up:payments
yarn docker:up:chat
```

### 3. Set up environment variables

Each microservice has its own `.env` file:

```
apps/lumio/.env.lumio.development
apps/files/.env.files.development
apps/payments/.env.payments.development
apps/super-admin/.env.super-admin.development
apps/chat/.env.chat.development
```

Copy from `.example` files if needed.

### 4. Run database migrations

```bash
yarn prisma:dev:lumio
yarn prisma:dev:files
yarn prisma:dev:payments
yarn prisma:dev:chat
```

### 5. Start development servers

```bash
# Start all services in separate terminals
yarn start:dev:lumio
yarn start:dev:files
yarn start:dev:payments
yarn start:dev:super-admin
yarn start:dev:chat
```

## Available Scripts

### Development

| Script                       | Description                     |
| ---------------------------- | ------------------------------- |
| `yarn start:dev:lumio`       | Start lumio in watch mode       |
| `yarn start:dev:files`       | Start files in watch mode       |
| `yarn start:dev:payments`    | Start payments in watch mode    |
| `yarn start:dev:super-admin` | Start super-admin in watch mode |
| `yarn start:dev:chat`        | Start chat in watch mode        |

### Database (Prisma)

| Script                       | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `yarn prisma:dev:lumio`      | Run migrations + generate client for lumio    |
| `yarn prisma:dev:files`      | Run migrations + generate client for files    |
| `yarn prisma:dev:payments`   | Run migrations + generate client for payments |
| `yarn prisma:dev:chat`       | Run migrations + generate client for chat     |
| `yarn prisma:studio:lumio`   | Open Prisma Studio for lumio                  |
| `yarn prisma:generate:lumio` | Generate Prisma client for lumio              |

### Testing

| Script                       | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `yarn test:unit:all`         | Run all unit tests across all microservices |
| `yarn test:unit:lumio`       | Run lumio unit tests                        |
| `yarn test:unit:files`       | Run files unit tests                        |
| `yarn test:unit:payments`    | Run payments unit tests                     |
| `yarn test:unit:super-admin` | Run super-admin unit tests                  |
| `yarn test:unit:chat`        | Run chat unit tests                         |
| `yarn test:coverage:all`     | Run all tests with coverage                 |

### Build

| Script                   | Description                      |
| ------------------------ | -------------------------------- |
| `yarn build:lumio`       | Build lumio for production       |
| `yarn build:files`       | Build files for production       |
| `yarn build:payments`    | Build payments for production    |
| `yarn build:super-admin` | Build super-admin for production |
| `yarn build:chat`        | Build chat for production        |

### Docker

| Script                    | Description                           |
| ------------------------- | ------------------------------------- |
| `yarn docker:up:lumio`    | Start PostgreSQL + RabbitMQ for lumio |
| `yarn docker:up:files`    | Start PostgreSQL for files            |
| `yarn docker:up:payments` | Start PostgreSQL for payments         |
| `yarn docker:up:chat`     | Start PostgreSQL for chat             |

## API Documentation

### REST API (Swagger)

Each REST microservice exposes Swagger documentation:

- **lumio**: `http://localhost:3000/api/v1/docs`
- **files**: `http://localhost:3001/api/v1/docs`
- **payments**: `http://localhost:3002/api/v1/docs`
- **chat**: `http://localhost:3004/api/v1/docs`

### GraphQL (super-admin)

- **Playground**: `http://localhost:3003/graphql`

### WebSocket (chat)

- **Socket.IO**: `http://localhost:3004/chat`

## Import Aliases

| Alias            | Path                     |
| ---------------- | ------------------------ |
| `@lumio/*`       | `apps/lumio/src/*`       |
| `@files/*`       | `apps/files/src/*`       |
| `@payments/*`    | `apps/payments/src/*`    |
| `@super-admin/*` | `apps/super-admin/src/*` |
| `@chat/*`        | `apps/chat/src/*`        |
| `@libs/*`        | `libs/*`                 |
| `@generated/*`   | `generated/*`            |

## Module Structure

Each microservice follows Clean Architecture:

```
module-name/
├── api/              # Controllers / Resolvers
├── application/      # Use Cases, CQRS Commands/Queries
├── domain/           # Entities, Domain Logic, Repositories
└── infrastructure/   # External services, adapters
```

## Authors

- Klim Androsov — discodiedance@gmail.com
- Ilya Kozlovsky — kozlvskiilya@gmail.com

## License

MIT
