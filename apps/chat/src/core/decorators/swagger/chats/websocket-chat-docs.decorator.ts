import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function WebSocketChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '📖 WebSocket Chat Documentation',
      description: `
## WebSocket Connection for Real-time Chat

> ⚠️ **This is documentation only** - Use WebSocket client to connect.

---

### 🔗 Connection Details
| Parameter | Value |
|-----------|-------|
| **Namespace** | \`/\` (root) |
| **URL (Production)** | \`wss://lumio.su\` |
| **URL (Development)** | \`ws://localhost:3004\` |
| **Transports** | \`websocket\`, \`polling\` |

### CORS Allowed Origins
\`http://localhost:3000\`, \`https://lumio.su\`, \`https://www.lumio.su\`

---

## 🔐 Authentication

### Option 1: Handshake Auth (Recommended)
\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('wss://lumio.su', {
  auth: { token: 'your-access-token' }
});
\`\`\`

### Option 2: Query Parameter
\`\`\`javascript
const socket = io('wss://lumio.su', {
  query: { token: 'your-access-token' }
});
\`\`\`

### Option 3: Authorization Header
\`\`\`javascript
const socket = io('wss://lumio.su', {
  extraHeaders: {
    Authorization: 'Bearer your-access-token'
  }
});
\`\`\`

---

## 📩 Server → Client Events

### \`connection:established\`
Emitted immediately after successful authentication.

**Payload:**
\`\`\`typescript
{
  userId: number;
}
\`\`\`

**Example:**
\`\`\`json
{
  "userId": 77
}
\`\`\`

---

### \`message:created\`
Emitted to all participants in a chat room when a new message is created (text or media).

**Payload (text message):**
\`\`\`typescript
{
  messageId: string;   // UUID
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;   // ISO 8601
}
\`\`\`

**Payload (media message):**
\`\`\`typescript
{
  messageId: string;   // UUID
  chatId: number;
  senderId: number;
  type: 'IMAGE' | 'VOICE';
  content: string;
  attachment: {
    id: number;
    type: 'IMAGE' | 'VOICE';
    url: string;
    mimeType: string;
    size: number;
    duration?: number;  // For VOICE
    width?: number;     // For IMAGE
    height?: number;    // For IMAGE
    createdAt: string;
  };
  createdAt: string;   // ISO 8601
}
\`\`\`

**Example (text):**
\`\`\`json
{
  "messageId": "8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e",
  "chatId": 5,
  "senderId": 77,
  "content": "hello",
  "createdAt": "2026-04-22T10:00:00.000Z"
}
\`\`\`

**Example (media):**
\`\`\`json
{
  "messageId": "9d0e2782-0g4d-594f-b9eg-9b9f9f9d9f9f",
  "chatId": 5,
  "senderId": 77,
  "type": "IMAGE",
  "content": "Check this out!",
  "attachment": {
    "id": 101,
    "type": "IMAGE",
    "url": "https://files.example.com/chat/attachment.png",
    "mimeType": "image/png",
    "size": 1024,
    "width": 1080,
    "height": 720,
    "createdAt": "2026-04-22T10:00:00.000Z"
  },
  "createdAt": "2026-04-22T10:00:00.000Z"
}
\`\`\`

---

### \`message:sent\`
Emitted **only to the sender** to confirm the message was sent successfully.

**Payload:** Same as \`message:created\`.

---

### \`message:received\`
Emitted **only to the recipient** when a new message arrives.

**Payload:**
\`\`\`typescript
{
  messageId: string;   // UUID
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;   // ISO 8601
}
\`\`\`

For media messages, also includes \`type\` and \`attachment\` fields (same as \`message:created\`).

---

### \`message:read\`
Emitted when a message is marked as read by the recipient.

**Payload:**
\`\`\`typescript
{
  messageId: string;   // UUID
  chatId: number;
  readerId: number;
  readAt: string;      // ISO 8601
}
\`\`\`

**Example:**
\`\`\`json
{
  "messageId": "8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e",
  "chatId": 5,
  "readerId": 42,
  "readAt": "2026-04-22T10:05:00.000Z"
}
\`\`\`

---

### \`user:typing\`
Emitted when a user starts or stops typing.

**Payload:**
\`\`\`typescript
{
  userId: number;
  chatId: number;
  isTyping: boolean;   // true = started, false = stopped
}
\`\`\`

**Example:**
\`\`\`json
{
  "userId": 77,
  "chatId": 5,
  "isTyping": true
}
\`\`\`

---

### \`error\`
Emitted when an error occurs.

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
| \`Forbidden: User is not a participant of this chat\` | User tried to type in a chat they don't belong to |

---

## 🎤 Client → Server Events

### \`typing:stop\`
Send this event when the user stops typing.

**Payload:**
\`\`\`typescript
{
  chatId: number;
}
\`\`\`

**Example:**
\`\`\`json
{
  "chatId": 5
}
\`\`\`

> **Note:** There is no \`typing:start\` event. Typing indicators are managed by the client — simply emit \`typing:stop\` when the user stops typing. The server broadcasts \`user:typing\` with \`isTyping: false\` to the chat room.

---

## 💻 Full Client Example

\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('wss://lumio.su', {
  auth: { token: localStorage.getItem('accessToken') }
});

// Connection established
socket.on('connect', () => {
  console.log('Connected to chat');
});

socket.on('connection:established', (data) => {
  console.log('Authenticated as user:', data.userId);
});

// Incoming messages
socket.on('message:created', (data) => {
  // Add message to chat UI
  appendMessage(data.chatId, data);
});

// Message sent confirmation (sender only)
socket.on('message:sent', (data) => {
  // Update message status to "sent"
  updateMessageStatus(data.messageId, 'SENT');
});

// New message received (recipient only)
socket.on('message:received', (data) => {
  // Show notification and add to chat
  showNotification(data);
  appendMessage(data.chatId, data);
});

// Message read
socket.on('message:read', (data) => {
  // Update message status to "read"
  updateMessageStatus(data.messageId, 'READ');
});

// Typing indicators
socket.on('user:typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.chatId, data.userId);
  } else {
    hideTypingIndicator(data.chatId, data.userId);
  }
});

// Send typing stop event
function onUserStopTyping(chatId) {
  socket.emit('typing:stop', { chatId });
}

// Error handling
socket.on('error', (data) => {
  console.error('WebSocket error:', data.message);
  if (data.message.includes('Unauthorized')) {
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
| Send text message | \`POST /api/v1/chats/send-message\` |
| Send media message | \`POST /api/v1/chats/send-media-message\` |
| Get chat messages | \`GET /api/v1/chats/messages\` |
| Mark message as read | \`POST /api/v1/chats/messages/:messageId/read\` |

WebSocket is used **only** for real-time messaging events.
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
              namespace: { type: 'string', example: '/' },
              url: { type: 'string', example: 'wss://lumio.su' },
            },
          },
          events: {
            type: 'object',
            properties: {
              'connection:established': {
                type: 'object',
                properties: {
                  userId: { type: 'number', example: 77 },
                },
              },
              'message:created': {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    format: 'uuid',
                    example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
                  },
                  chatId: { type: 'number', example: 5 },
                  senderId: { type: 'number', example: 77 },
                  content: { type: 'string', example: 'hello' },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-04-22T10:00:00.000Z',
                  },
                },
              },
              'message:sent': {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    format: 'uuid',
                    example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
                  },
                  chatId: { type: 'number', example: 5 },
                  content: { type: 'string', example: 'hello' },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-04-22T10:00:00.000Z',
                  },
                },
              },
              'message:received': {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    format: 'uuid',
                    example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
                  },
                  chatId: { type: 'number', example: 5 },
                  senderId: { type: 'number', example: 77 },
                  content: { type: 'string', example: 'hello' },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-04-22T10:00:00.000Z',
                  },
                },
              },
              'message:read': {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    format: 'uuid',
                    example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
                  },
                  chatId: { type: 'number', example: 5 },
                  readerId: { type: 'number', example: 42 },
                  readAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-04-22T10:05:00.000Z',
                  },
                },
              },
              'user:typing': {
                type: 'object',
                properties: {
                  userId: { type: 'number', example: 77 },
                  chatId: { type: 'number', example: 5 },
                  isTyping: { type: 'boolean', example: true },
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
