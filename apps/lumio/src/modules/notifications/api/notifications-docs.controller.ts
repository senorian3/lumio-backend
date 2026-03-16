import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('🔔 WebSocket Notifications')
@Controller('websocket/notifications')
export class NotificationsDocsController {
  @Get('connection')
  @ApiOperation({
    summary: '🔌 WebSocket Connection',
    description: `
## WebSocket Connection for Real-time Notifications

> ⚠️ **This is NOT a REST endpoint** - This documentation describes WebSocket connection.

### Connection Details
| Parameter | Value |
|-----------|-------|
| **Namespace** | \`/notifications\` |
| **URL** | \`wss://lumio.su/notifications\` or \`ws://localhost:PORT/notifications\` |

### CORS Allowed Origins
- \`http://localhost:3000\`, \`http://localhost:3001\`, \`http://localhost:3002\`, \`http://localhost:4121\`
- \`https://lumio.su\`, \`https://www.lumio.su\`

---

## 🔐 Authentication

### Option 1: Handshake Auth (Recommended)
\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('/notifications', {
  auth: { token: 'your-access-token' }
});
\`\`\`

### Option 2: Authorization Header
\`\`\`javascript
const socket = io('/notifications', {
  extraHeaders: {
    Authorization: 'Bearer your-access-token'
  }
});
\`\`\`

---

## 🎯 Connection Events

On successful connection:
- Client joins room \`user_\${userId}\`
- Ready to receive \`notification:new\` events

### Connection Errors
If authentication fails, client receives \`error\` event and is disconnected.

**Possible error messages:**
- \`Unauthorized: Missing token\`
- \`Unauthorized: Invalid token\`
- \`Unauthorized: Invalid token payload\`
- \`Unauthorized: No active session\`
- \`Unauthorized: Token invalidated\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'WebSocket documentation (not a real endpoint)',
  })
  connectionDocs(): { message: string } {
    return {
      message: 'See Swagger description for WebSocket connection documentation',
    };
  }

  @Get('events/notification-new')
  @ApiOperation({
    summary: '📩 Event: notification:new',
    description: `
## New Notification Event

**Direction:** Server → Client

Emitted when a new notification is created for the user.

---

### 📝 Payload Structure
\`\`\`typescript
{
  title: string;   // Max 200 characters
  message: string; // Max 500 characters
}
\`\`\`

---

### 🎯 When Triggered
| Trigger | Title Example |
|---------|---------------|
| Subscription activated | Подписка активирована |
| Subscription expiring (7 days) | Подписка истекает |
| Subscription expiring (1 day) | Подписка истекает |
| Payment warning | Уведомление о платеже |

---

### 💻 Client Example
\`\`\`javascript
socket.on('notification:new', (data) => {
  showToast(data.title, data.message);
});
\`\`\`

### 📋 Example Payloads
\`\`\`json
{ "title": "Подписка активирована", "message": "Ваша подписка активирована и действует до 14.04.2026" }
{ "title": "Подписка истекает", "message": "Ваша подписка истекает через 7 дней (21.03.2026)" }
{ "title": "Уведомление о платеже", "message": "Следующий платеж у вас спишется через 1 день (15.03.2026)" }
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Event payload structure',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Подписка активирована',
          maxLength: 200,
        },
        message: {
          type: 'string',
          example: 'Ваша подписка активирована и действует до 14.04.2026',
          maxLength: 500,
        },
      },
    },
  })
  notificationNewDocs(): { title: string; message: string } {
    return {
      title: 'Подписка активирована',
      message: 'Ваша подписка активирована и действует до 14.04.2026',
    };
  }

  @Get('events/error')
  @ApiOperation({
    summary: '❌ Event: error',
    description: `
## Error Event

**Direction:** Server → Client

Emitted when an error occurs during WebSocket operations.

---

### 📝 Payload Structure
\`\`\`typescript
{
  message: string;
}
\`\`\`

---

### 🎯 When Triggered
- Authentication failures (connection will be closed)
- Unauthorized access attempts
- Internal server errors

---

### ⚠️ Possible Error Messages
| Error | Description |
|-------|-------------|
| \`Unauthorized: Missing token\` | No token provided |
| \`Unauthorized: Invalid token\` | Token verification failed |
| \`Unauthorized: Invalid token payload\` | Token doesn't contain required data |
| \`Unauthorized: No active session\` | User session not found |
| \`Unauthorized: Token invalidated\` | Token version mismatch |

---

### 💻 Client Example
\`\`\`javascript
socket.on('error', (data) => {
  console.error('WebSocket error:', data.message);
  
  if (data.message.includes('Unauthorized')) {
    // Redirect to login or refresh token
    handleAuthError();
  }
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Error payload structure',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized: Missing token' },
      },
    },
  })
  errorDocs(): { message: string } {
    return { message: 'Unauthorized: Missing token' };
  }
}
