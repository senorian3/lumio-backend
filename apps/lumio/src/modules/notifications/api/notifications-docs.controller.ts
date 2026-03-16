import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { NotificationPaginationOutputDto } from '@lumio/modules/notifications/api/dto/output/notification-pagination.output.dto';
import { NotificationHistoryParams } from '@lumio/modules/notifications/api/dto/input/notification-pagination-params.input.dto';

@ApiTags('🔔 WebSocket Notifications')
@ApiExtraModels(NotificationPaginationOutputDto, NotificationHistoryParams)
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

On successful connection, client automatically receives:
- \`notification:count\` - Current unread notifications count

### Connection Errors
If authentication fails, client receives \`error\` event with message and is disconnected.

**Possible error messages:**
- \`Unauthorized: Missing token\`
- \`Unauthorized: Invalid token\`
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

  @Get('events/notification-count')
  @ApiOperation({
    summary: '🔢 Event: notification:count',
    description: `
## Unread Notifications Count Event

**Direction:** Server → Client

Emitted to inform client about current unread notifications count.

---

### 📝 Payload Structure
\`\`\`typescript
{
  count: number; // Number of unread notifications
}
\`\`\`

---

### 🎯 When Triggered
- On WebSocket connection (automatically)
- After new notification is sent
- After history is fetched (count resets to 0)

---

### 💻 Client Example
\`\`\`javascript
socket.on('notification:count', (data) => {
  updateBadge(data.count); // Update notification badge
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Event payload structure',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5, minimum: 0 },
      },
    },
  })
  notificationCountDocs(): { count: number } {
    return { count: 5 };
  }

  @Get('messages/notification-history')
  @ApiOperation({
    summary: '📤 Message: notification:history (Client → Server)',
    description: `
## Request Notification History

**Direction:** Client → Server

Send this message to request paginated notification history.

---

### 📝 Payload Structure (all fields optional)
\`\`\`typescript
{
  pageNumber?: number;     // Default: 1, Min: 1
  pageSize?: number;       // Default: 10, Min: 1
  sortDirection?: 'asc' | 'desc'; // Default: 'desc'
}
\`\`\`

---

### ⚙️ Behavior
1. Returns paginated list of notifications
2. **Automatically marks all notifications as read**
3. Emits \`notification:count\` with 0 after response

---

### 💻 Client Example
\`\`\`javascript
// Request with default pagination
socket.emit('notification:history', {});

// Request with custom pagination
socket.emit('notification:history', {
  pageNumber: 1,
  pageSize: 20,
  sortDirection: 'desc'
});

// Listen for response
socket.on('notification:history:response', (data) => {
  console.log('Notifications:', data.items);
  console.log('Total:', data.total);
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Message payload structure',
    type: NotificationHistoryParams,
  })
  notificationHistoryDocs(): NotificationHistoryParams {
    return {
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'createdAt',
    } as NotificationHistoryParams;
  }

  @Get('events/notification-history-response')
  @ApiOperation({
    summary: '📥 Event: notification:history:response',
    description: `
## Notification History Response Event

**Direction:** Server → Client

Emitted as response to \`notification:history\` message.

---

### 📝 Payload Structure
\`\`\`typescript
{
  items: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string; // ISO 8601 format
  }>;
  total: number;
  pageNumber: number;
  pageSize: number;
  pagesCount: number;
}
\`\`\`

---

### 💻 Client Example
\`\`\`javascript
socket.on('notification:history:response', (data) => {
  console.log('Notifications:', data.items);
  console.log(\`Page \${data.pageNumber} of \${data.pagesCount}\`);
  console.log(\`Total: \${data.total}\`);
  
  // Render notifications
  data.items.forEach(notification => {
    renderNotification(notification);
  });
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Event payload structure',
    type: NotificationPaginationOutputDto,
  })
  notificationHistoryResponseDocs(): NotificationPaginationOutputDto {
    return {
      items: [
        {
          id: '550',
          title: 'Подписка активирована',
          message: 'Ваша подписка активирована и действует до 14.04.2026',
          createdAt: new Date('2026-03-14T10:30:00.000Z'),
        },
      ],
      total: 15,
      pageNumber: 1,
      pageSize: 10,
      pagesCount: 2,
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
| \`Unauthorized\` | Generic unauthorized error |

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
