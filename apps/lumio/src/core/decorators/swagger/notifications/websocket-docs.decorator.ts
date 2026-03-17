import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function WebSocketDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '📖 WebSocket Notifications Documentation',
      description: `
## WebSocket Connection for Real-time Notifications

> ⚠️ **This is documentation only** - Use WebSocket client to connect.

---

### 🔗 Connection Details
| Parameter | Value |
|-----------|-------|
| **Namespace** | \`/notifications\` |
| **URL (Production)** | \`wss://lumio.su/notifications\` |
| **URL (Development)** | \`ws://localhost:PORT/notifications\` |

### CORS Allowed Origins
\`http://localhost:3000\`, \`http://localhost:3001\`, \`http://localhost:3002\`, \`http://localhost:4121\`, \`https://lumio.su\`, \`https://www.lumio.su\`

---

## 🔐 Authentication

### Option 1: Handshake Auth (Recommended)
\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('wss://lumio.su/notifications', {
  auth: { token: 'your-access-token' }
});
\`\`\`

### Option 2: Authorization Header
\`\`\`javascript
const socket = io('wss://lumio.su/notifications', {
  extraHeaders: {
    Authorization: 'Bearer your-access-token'
  }
});
\`\`\`

---

## 📩 Events

### Server → Client Events

#### \`notification:new\`
New notification event. Emitted when a notification is ready to be displayed.

**Payload:**
\`\`\`typescript
{
  title: string;   // Max 200 characters
  message: string; // Max 500 characters
}
\`\`\`

**Example:**
\`\`\`json
{
  "title": "Подписка активирована",
  "message": "Ваша подписка активирована и действует до 14.04.2026"
}
\`\`\`

**Triggers:**
| Event | Title Example |
|-------|---------------|
| Subscription activated | Подписка активирована |
| Subscription expiring (7 days) | Подписка истекает |
| Subscription expiring (1 day) | Подписка истекает |
| Payment warning | Уведомление о платеже |

---

#### \`error\`
Error event. Emitted when authentication fails or an error occurs.

**Payload:**
\`\`\`typescript
{
  message: string;
}
\`\`\`

**Possible errors:**
| Error | Description |
|-------|-------------|
| \`Unauthorized: Missing token\` | No token provided |
| \`Unauthorized: Invalid token\` | Token verification failed |
| \`Unauthorized: Invalid token payload\` | Token doesn't contain required data |
| \`Unauthorized: No active session\` | User session not found |
| \`Unauthorized: Token invalidated\` | Token version mismatch |

---

## 💻 Full Client Example

\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('wss://lumio.su/notifications', {
  auth: { token: localStorage.getItem('accessToken') }
});

socket.on('connect', () => {
  console.log('Connected to notifications');
});

socket.on('notification:new', (data) => {
  // Display notification to user
  showToast(data.title, data.message);
  // Optionally refresh unread count via HTTP
  fetchUnreadCount();
});

socket.on('error', (data) => {
  console.error('WebSocket error:', data.message);
  if (data.message.includes('Unauthorized')) {
    // Handle auth error - redirect to login or refresh token
    handleAuthError();
  }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
\`\`\`

---

## 🔄 Integration with HTTP API

Use HTTP endpoints for data operations:

| Operation | HTTP Endpoint |
|-----------|---------------|
| Get notification history | \`GET /api/v1/notifications/history\` |
| Get unread count | \`GET /api/v1/notifications/unread-count\` |
| Mark all as read | \`PUT /api/v1/notifications/mark-all-read\` |
| Mark one as read | \`PUT /api/v1/notifications/:id/read\` |
| Delete notification | \`DELETE /api/v1/notifications/:id\` |

WebSocket is used **only** for receiving real-time notification events.
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'WebSocket documentation',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'See Swagger description for WebSocket documentation',
          },
          websocket: {
            type: 'object',
            properties: {
              namespace: { type: 'string', example: '/notifications' },
              url: { type: 'string', example: 'wss://lumio.su/notifications' },
            },
          },
          events: {
            type: 'object',
            properties: {
              'notification:new': {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Подписка активирована' },
                  message: {
                    type: 'string',
                    example:
                      'Ваша подписка активирована и действует до 14.04.2026',
                  },
                },
              },
              error: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Unauthorized: Missing token',
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
}
