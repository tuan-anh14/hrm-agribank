# Chat API Testing Guide

## Prerequisites
1. Backend server đang chạy: `npm run start:dev`
2. Database đã được migrate và có dữ liệu test
3. Có JWT token hợp lệ từ login endpoint

## Test REST API Endpoints

### 1. Get Chat Rooms
```bash
GET /api/v1/chat/rooms
Authorization: Bearer <token>

Expected: 200 OK
Response: {
  company: { id, name, type: "COMPANY_WIDE", ... },
  departments: [...],
  directMessages: [...]
}
```

### 2. Get Messages from Room
```bash
GET /api/v1/chat/rooms/{roomId}/messages?page=1&limit=50
Authorization: Bearer <token>

Expected: 200 OK
Response: {
  data: [...],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

### 3. Send Message (REST)
```bash
POST /api/v1/chat/rooms/{roomId}/messages
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  "content": "Xin chào mọi người!"
}

Expected: 201 Created
Response: {
  id, roomId, senderId, content, createdAt, ...
}
```

### 4. Create Direct Message Room
```bash
POST /api/v1/chat/rooms/direct-message
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  "otherUserId": "<account-id-of-other-user>"
}

Expected: 201 Created
Response: {
  id, name, type: "DIRECT_MESSAGE", participants: [...]
}
```

### 5. Mark Message as Read
```bash
PATCH /api/v1/chat/messages/{messageId}/read
Authorization: Bearer <token>

Expected: 200 OK
Response: {
  id, isRead: true, readAt: "...", ...
}
```

### 6. Mark Room as Read
```bash
PATCH /api/v1/chat/rooms/{roomId}/read
Authorization: Bearer <token>

Expected: 200 OK
Response: {
  count: number
}
```

## Test WebSocket Connection

### Connection
```javascript
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: '<jwt-token>'
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to chat namespace');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('exception', (error) => {
  console.error('Error:', error);
});
```

### Send Message
```javascript
socket.emit('message:send', {
  roomId: '<room-id>',
  content: 'Hello from WebSocket!'
});

socket.on('message:new', (message) => {
  console.log('New message:', message);
});

socket.on('message:error', (error) => {
  console.error('Message error:', error);
});
```

### Join Room
```javascript
socket.emit('room:join', { roomId: '<room-id>' });

socket.on('room:joined', (data) => {
  console.log('Joined room:', data);
});
```

### Typing Indicators
```javascript
socket.emit('typing:start', { roomId: '<room-id>' });
socket.emit('typing:stop', { roomId: '<room-id>' });

socket.on('typing:user', (data) => {
  console.log('User typing:', data);
});
```

### User Status
```javascript
socket.on('user:status:changed', (data) => {
  console.log('User status:', data);
  // { userId, status: 'online' | 'offline', timestamp }
});
```

## Test Checklist

- [ ] REST API: Get rooms
- [ ] REST API: Get messages
- [ ] REST API: Send message
- [ ] REST API: Create direct message room
- [ ] REST API: Mark message as read
- [ ] REST API: Mark room as read
- [ ] WebSocket: Connection with JWT
- [ ] WebSocket: Send message
- [ ] WebSocket: Receive message
- [ ] WebSocket: Join room
- [ ] WebSocket: Typing indicators
- [ ] WebSocket: User online/offline status
- [ ] Error handling: Invalid token
- [ ] Error handling: Invalid room access
- [ ] Error handling: Missing permissions

