# Hướng dẫn Test Chat API trên Swagger

## Bước 1: Khởi động Backend Server

```bash
cd backend
npm run start:dev
```

Server sẽ chạy tại: `http://localhost:3000` (hoặc port được config trong `.env`)

## Bước 2: Truy cập Swagger UI

Mở trình duyệt và truy cập:
```
http://localhost:3000/api-docs
```

## Bước 3: Lấy JWT Token (Authentication)

### 3.1. Tìm endpoint Login
- Trong Swagger UI, tìm section **"Auth"**
- Mở endpoint `POST /api/v1/auth/login`

### 3.2. Test Login
1. Click vào endpoint `POST /api/v1/auth/login`
2. Click nút **"Try it out"**
3. Nhập thông tin đăng nhập:
   ```json
   {
     "username": "admin@agribank.com",  // Email của account
     "password": "your-password"
   }
   ```
4. Click **"Execute"**

### 3.3. Copy Access Token
Sau khi login thành công, response sẽ có dạng:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid-here",
    "email": "admin@agribank.com",
    "fullName": "Nguyễn Văn Admin",
    "role": "ADMIN"
  }
}
```

**Copy giá trị `access_token`** (phần sau "Bearer ")

### 3.4. Authorize trong Swagger
1. Ở góc trên bên phải Swagger UI, click nút **"Authorize"** 🔒
2. Trong popup, nhập token vào ô **"Value"**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Chỉ cần token, KHÔNG cần thêm "Bearer")
3. Click **"Authorize"**
4. Click **"Close"**

Bây giờ tất cả các request sẽ tự động include token trong header `Authorization: Bearer <token>`

## Bước 4: Test Chat Endpoints

### 4.1. GET /api/v1/chat/rooms
**Lấy danh sách tất cả rooms mà user có quyền truy cập**

1. Tìm section **"Chat"** trong Swagger
2. Mở endpoint `GET /api/v1/chat/rooms`
3. Click **"Try it out"**
4. Click **"Execute"**

**Response mẫu:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Chat chung Agribank",
    "type": "COMPANY_WIDE",
    "lastMessage": {
      "id": "uuid",
      "content": "Xin chào mọi người!",
      "createdAt": "2024-01-01T10:00:00Z",
      "sender": {
        "id": "uuid",
        "fullName": "Nguyễn Văn A"
      }
    }
  },
  "departments": [
    {
      "id": "uuid",
      "name": "Phòng IT",
      "type": "DEPARTMENT_HRM",
      "department": {
        "id": "uuid",
        "name": "IT"
      },
      "lastMessage": null
    }
  ],
  "directMessages": [
    {
      "id": "uuid",
      "name": "Nguyễn Văn A & Trần Thị B",
      "type": "DIRECT_MESSAGE",
      "lastMessage": {
        "id": "uuid",
        "content": "Hello",
        "createdAt": "2024-01-01T10:00:00Z",
        "sender": {
          "id": "uuid",
          "fullName": "Nguyễn Văn A"
        }
      }
    }
  ]
}
```

### 4.2. GET /api/v1/chat/rooms/{roomId}/messages
**Lấy lịch sử tin nhắn trong một room**

1. Mở endpoint `GET /api/v1/chat/rooms/{roomId}/messages`
2. Click **"Try it out"**
3. Nhập `roomId` (lấy từ response của GET /rooms ở trên)
4. Query parameters (optional):
   - `page`: 1 (default)
   - `limit`: 50 (default, max 100)
5. Click **"Execute"**

**Response mẫu:**
```json
{
  "data": [
    {
      "id": "uuid",
      "roomId": "uuid",
      "senderId": "uuid",
      "content": "Xin chào!",
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-01T10:00:00Z",
      "sender": {
        "id": "uuid",
        "fullName": "Nguyễn Văn A",
        "employeeCode": "NV001"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### 4.3. POST /api/v1/chat/rooms/{roomId}/messages
**Gửi tin nhắn vào room (REST fallback)**

1. Mở endpoint `POST /api/v1/chat/rooms/{roomId}/messages`
2. Click **"Try it out"**
3. Nhập `roomId` (lấy từ GET /rooms)
4. Request body:
   ```json
   {
     "content": "Xin chào mọi người!"
   }
   ```
5. Click **"Execute"**

**Response:** 201 Created với message object

### 4.4. POST /api/v1/chat/rooms/direct-message
**Tạo hoặc lấy room chat 1-1 với nhân viên khác**

1. Mở endpoint `POST /api/v1/chat/rooms/direct-message`
2. Click **"Try it out"**
3. Request body:
   ```json
   {
     "otherUserId": "account-id-of-other-user"
   }
   ```
   **Lưu ý:** `otherUserId` là **Account ID**, không phải Employee ID
4. Click **"Execute"**

**Response:** 201 Created với room object

### 4.5. PATCH /api/v1/chat/messages/{messageId}/read
**Đánh dấu một tin nhắn đã đọc**

1. Mở endpoint `PATCH /api/v1/chat/messages/{messageId}/read`
2. Click **"Try it out"**
3. Nhập `messageId` (lấy từ GET /rooms/{roomId}/messages)
4. Click **"Execute"**

**Response:** 200 OK với message object (isRead: true)

### 4.6. PATCH /api/v1/chat/rooms/{roomId}/read
**Đánh dấu tất cả tin nhắn trong room đã đọc**

1. Mở endpoint `PATCH /api/v1/chat/rooms/{roomId}/read`
2. Click **"Try it out"**
3. Nhập `roomId`
4. Click **"Execute"**

**Response:** 200 OK với `{ count: number }`

## Lưu ý quan trọng

### ⚠️ WebSocket không thể test trên Swagger
Swagger chỉ test được **REST API**. Để test **WebSocket**, bạn cần:
- Dùng Postman WebSocket
- Dùng browser console với `socket.io-client`
- Dùng tool như `wscat` hoặc `websocat`

Xem hướng dẫn test WebSocket trong file `test-chat-api.md`

### 🔐 Authentication
- Tất cả Chat endpoints đều yêu cầu JWT token
- Token có thời hạn (thường 1 giờ)
- Nếu gặp lỗi 401, cần login lại để lấy token mới

### 📝 Validation
- Request body phải đúng format theo DTO
- `content` không được quá 2000 ký tự
- `roomId` và `messageId` phải là UUID hợp lệ

### 🎯 Test Flow đề xuất
1. **Login** → Lấy token
2. **GET /chat/rooms** → Xem danh sách rooms
3. **POST /chat/rooms/{roomId}/messages** → Gửi tin nhắn vào company room
4. **GET /chat/rooms/{roomId}/messages** → Xem tin nhắn vừa gửi
5. **POST /chat/rooms/direct-message** → Tạo room 1-1
6. **PATCH /chat/rooms/{roomId}/read** → Đánh dấu đã đọc

## Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token đã được authorize chưa
- Token có thể đã hết hạn → Login lại
- Kiểm tra format token (không có "Bearer " prefix trong Swagger)

### Lỗi 403 Forbidden
- User không có quyền truy cập endpoint này
- Kiểm tra role của user (ADMIN, HR, EMPLOYEE)

### Lỗi 404 Not Found
- `roomId` hoặc `messageId` không tồn tại
- Kiểm tra UUID format

### Lỗi 400 Bad Request
- Request body không đúng format
- Thiếu required fields
- Validation failed (ví dụ: content quá dài)

