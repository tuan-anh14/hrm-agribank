# 📋 KẾ HOẠCH TRIỂN KHAI CHAT REALTIME WEBSOCKET - CHI TIẾT

## 🎯 TỔNG QUAN

**Mục tiêu:** Triển khai hệ thống chat realtime với 3 loại chat:
1. Chat chung toàn công ty (Agribank)
2. Chat theo phòng ban (HRM ↔ Phòng ban)
3. Chat cá nhân (1-1)

**Thời gian ước tính:** 3-4 ngày (tùy mức độ chi tiết UI/UX)

**Phương pháp:** Chia nhỏ thành các task nhỏ, làm từng bước, test sau mỗi bước

---

## 📦 PHASE 1: BACKEND - DATABASE & SCHEMA (30-45 phút)

### Task 1.1: Cập nhật Prisma Schema
**File:** `backend/prisma/schema.prisma`
**Thời gian:** 15 phút
**Mô tả:**
- Thêm `CHAT` vào enum `NotificationType`
- Thêm enum `ChatRoomType` (COMPANY_WIDE, DEPARTMENT_HRM, DIRECT_MESSAGE)
- Thêm model `ChatRoom`
- Thêm model `ChatRoomParticipant`
- Thêm model `ChatMessage`
- Cập nhật model `Department` (thêm relation `chatRoom`)
- Cập nhật model `Employee` (thêm relations `sentMessages`, `chatRooms`)

**Acceptance Criteria:**
- [ ] Schema compile không lỗi
- [ ] Tất cả relations đúng
- [ ] Indexes được thêm đúng chỗ

---

### Task 1.2: Tạo Migration
**Thời gian:** 10 phút
**Commands:**
```bash
cd backend
npx prisma migrate dev --name add_chat_feature
npx prisma generate
```

**Acceptance Criteria:**
- [ ] Migration tạo thành công
- [ ] Prisma client được generate
- [ ] Database có các bảng mới

---

### Task 1.3: Cập nhật AuditModule Enum
**File:** `backend/prisma/schema.prisma`
**Thời gian:** 5 phút
**Mô tả:**
- Thêm `CHAT` vào enum `AuditModule`

**Acceptance Criteria:**
- [ ] Enum được cập nhật
- [ ] Tạo migration mới nếu cần

---

## 📦 PHASE 2: BACKEND - CORE MODULE (2-3 giờ)

### Task 2.1: Tạo cấu trúc thư mục Chat Module
**Thời gian:** 5 phút
**Cấu trúc:**
```
backend/src/chat/
├── chat.module.ts
├── chat.gateway.ts
├── chat.service.ts
├── chat.controller.ts
├── constants/
│   └── chat.events.ts
├── dto/
│   ├── create-message.dto.ts
│   ├── query-message.dto.ts
│   └── index.ts
└── guards/
    └── ws-jwt-auth.guard.ts
```

**Acceptance Criteria:**
- [ ] Tất cả thư mục và file được tạo
- [ ] Cấu trúc đúng chuẩn NestJS

---

### Task 2.2: Tạo Chat Events Constants
**File:** `backend/src/chat/constants/chat.events.ts`
**Thời gian:** 10 phút
**Mô tả:**
- Định nghĩa tất cả socket events (client → server và server → client)
- Export enum hoặc constants

**Acceptance Criteria:**
- [ ] Tất cả events được định nghĩa
- [ ] Type-safe

---

### Task 2.3: Tạo DTOs
**Files:**
- `backend/src/chat/dto/create-message.dto.ts`
- `backend/src/chat/dto/query-message.dto.ts`
- `backend/src/chat/dto/index.ts`
**Thời gian:** 15 phút
**Mô tả:**
- CreateMessageDto với validation
- QueryMessageDto với pagination
- Export tất cả DTOs

**Acceptance Criteria:**
- [ ] Validation decorators đầy đủ
- [ ] Type-safe

---

### Task 2.4: Tạo WebSocket JWT Auth Guard
**File:** `backend/src/chat/guards/ws-jwt-auth.guard.ts`
**Thời gian:** 20 phút
**Mô tả:**
- Implement `CanActivate` interface
- Extract JWT token từ socket handshake
- Verify token và attach user vào `client.data.user`
- Disconnect nếu không có token hoặc token invalid

**Acceptance Criteria:**
- [ ] Guard hoạt động đúng
- [ ] Xử lý các edge cases (no token, invalid token, expired token)
- [ ] User được attach vào socket

---

### Task 2.5: Implement ChatService - Phần 1: Room Management
**File:** `backend/src/chat/chat.service.ts`
**Thời gian:** 45 phút
**Mô tả:**
- `getOrCreateCompanyRoom()` - Tạo/lấy room chat chung
- `getOrCreateDepartmentRoom(departmentId)` - Tạo/lấy room phòng ban
- `getOrCreateDirectMessageRoom(userId1, userId2)` - Tạo/lấy room 1-1
- `getRoomsForUser(userId, userRole)` - Lấy tất cả rooms user có quyền

**Acceptance Criteria:**
- [ ] Tất cả methods hoạt động đúng
- [ ] Xử lý edge cases (room đã tồn tại, user không tồn tại)
- [ ] Logic phân quyền đúng (ADMIN/HR vs EMPLOYEE)

---

### Task 2.6: Implement ChatService - Phần 2: Message Management
**File:** `backend/src/chat/chat.service.ts`
**Thời gian:** 45 phút
**Mô tả:**
- `createMessage(dto, senderId)` - Tạo tin nhắn với kiểm tra quyền
- `getMessages(roomId, query)` - Lấy lịch sử tin nhắn với pagination
- `markAsRead(messageId, userId)` - Đánh dấu tin nhắn đã đọc
- `markRoomAsRead(roomId, userId)` - Đánh dấu tất cả tin nhắn trong room đã đọc

**Acceptance Criteria:**
- [ ] Kiểm tra quyền đúng cho từng loại room
- [ ] Pagination hoạt động đúng
- [ ] Chỉ đánh dấu đọc tin nhắn của người khác

---

### Task 2.7: Implement ChatGateway
**File:** `backend/src/chat/chat.gateway.ts`
**Thời gian:** 45 phút
**Mô tả:**
- `handleConnection()` - Join user vào các rooms có quyền
- `handleDisconnect()` - Cleanup khi disconnect
- `handleMessage()` - Xử lý gửi tin nhắn
- `handleJoinRoom()` - Join vào room cụ thể
- `handleLeaveRoom()` - Leave room
- `handleTyping()` - Xử lý typing indicator

**Acceptance Criteria:**
- [ ] WebSocket connection hoạt động
- [ ] Events được emit đúng
- [ ] Room management hoạt động

---

### Task 2.8: Implement ChatController
**File:** `backend/src/chat/chat.controller.ts`
**Thời gian:** 30 phút
**Mô tả:**
- `GET /chat/rooms` - Lấy danh sách rooms
- `GET /chat/rooms/:roomId/messages` - Lấy lịch sử tin nhắn
- `POST /chat/rooms/:roomId/messages` - Tạo tin nhắn (REST fallback)
- `POST /chat/rooms/direct-message/:otherUserId` - Tạo room chat 1-1
- `POST /chat/messages/:messageId/read` - Đánh dấu đã đọc
- `POST /chat/rooms/:roomId/read` - Đánh dấu tất cả đã đọc

**Acceptance Criteria:**
- [ ] Tất cả endpoints hoạt động
- [ ] Validation đúng
- [ ] Error handling đầy đủ

---

### Task 2.9: Tạo ChatModule và đăng ký vào AppModule
**Files:**
- `backend/src/chat/chat.module.ts`
- `backend/src/app.module.ts`
**Thời gian:** 15 phút
**Mô tả:**
- Tạo ChatModule với imports, controllers, providers
- Đăng ký ChatModule vào AppModule

**Acceptance Criteria:**
- [ ] Module compile không lỗi
- [ ] Tất cả dependencies được inject đúng

---

### Task 2.10: Test Backend cơ bản
**Thời gian:** 30 phút
**Mô tả:**
- Test WebSocket connection
- Test tạo room
- Test gửi tin nhắn qua REST API
- Test quyền truy cập

**Acceptance Criteria:**
- [ ] Server start không lỗi
- [ ] WebSocket connection thành công
- [ ] Các API endpoints hoạt động

---

## 📦 PHASE 3: FRONTEND - SETUP & SERVICES (1-1.5 giờ)

### Task 3.1: Cài đặt Dependencies
**Thời gian:** 5 phút
**Commands:**
```bash
cd frontend
npm install socket.io-client
```

**Acceptance Criteria:**
- [ ] Package được cài đặt
- [ ] Không có conflict dependencies

---

### Task 3.2: Tạo Chat Events Constants (Frontend)
**File:** `frontend/src/services/chat/chat.events.ts`
**Thời gian:** 10 phút
**Mô tả:**
- Định nghĩa events giống backend (để type-safe)

**Acceptance Criteria:**
- [ ] Events khớp với backend
- [ ] Type-safe

---

### Task 3.3: Tạo SocketService
**File:** `frontend/src/services/socket.service.ts`
**Thời gian:** 30 phút
**Mô tả:**
- Class SocketService với methods:
  - `connect()` - Kết nối với JWT token
  - `disconnect()` - Ngắt kết nối
  - `getSocket()` - Lấy socket instance
  - `isConnected()` - Kiểm tra trạng thái

**Acceptance Criteria:**
- [ ] Kết nối thành công với backend
- [ ] JWT authentication hoạt động
- [ ] Reconnection tự động

---

### Task 3.4: Tạo Chat Types
**File:** `frontend/src/types/chat.ts`
**Thời gian:** 20 phút
**Mô tả:**
- Định nghĩa interfaces:
  - `ChatRoom`
  - `ChatMessage`
  - `ChatRoomParticipant`
  - `ChatRoomsResponse`
  - `ChatMessageListResponse`

**Acceptance Criteria:**
- [ ] Types khớp với backend
- [ ] Type-safe

---

### Task 3.5: Tạo Chat API Functions
**File:** `frontend/src/services/api.ts` (thêm vào file hiện có)
**Thời gian:** 20 phút
**Mô tả:**
- `getChatRoomsAPI()`
- `getChatMessagesAPI(roomId, params)`
- `createChatMessageAPI(roomId, content)`
- `createDirectMessageRoomAPI(otherUserId)`
- `markMessageAsReadAPI(messageId)`
- `markRoomAsReadAPI(roomId)`

**Acceptance Criteria:**
- [ ] Tất cả functions hoạt động
- [ ] Error handling đầy đủ
- [ ] Type-safe

---

## 📦 PHASE 4: FRONTEND - UI COMPONENTS (2-3 giờ)

### Task 4.1: Tạo ChatPage Component - Structure
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 30 phút
**Mô tả:**
- Tạo component structure với Layout (Sider + Content)
- State management cơ bản
- Import các dependencies

**Acceptance Criteria:**
- [ ] Component render được
- [ ] Layout đúng

---

### Task 4.2: Implement Sidebar - Room List
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 45 phút
**Mô tả:**
- Tabs (Công ty, Phòng ban, Cá nhân)
- Load danh sách rooms
- Hiển thị room list với last message
- Highlight room đang chọn
- Badge unread count

**Acceptance Criteria:**
- [ ] Rooms được load và hiển thị
- [ ] Tabs hoạt động
- [ ] UI đẹp, responsive

---

### Task 4.3: Implement Chat Messages Area
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 45 phút
**Mô tả:**
- Load messages khi chọn room
- Hiển thị messages với avatar, tên, thời gian
- Phân biệt tin nhắn của mình vs người khác
- Auto scroll to bottom
- Loading state
- Empty state

**Acceptance Criteria:**
- [ ] Messages được load và hiển thị
- [ ] UI đẹp, dễ đọc
- [ ] Auto scroll hoạt động

---

### Task 4.4: Implement Message Input & Send
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 30 phút
**Mô tả:**
- TextArea input
- Send button
- Gửi qua WebSocket
- Optimistic update (hiển thị tin nhắn ngay)
- Disable khi đang gửi
- Enter để gửi, Shift+Enter để xuống dòng

**Acceptance Criteria:**
- [ ] Gửi tin nhắn thành công
- [ ] Real-time update
- [ ] UX tốt

---

### Task 4.5: Implement WebSocket Event Handlers
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 30 phút
**Mô tả:**
- Listen `message:new` - Thêm tin nhắn mới
- Listen `typing:user` - Hiển thị typing indicator
- Listen `user:status:changed` - Cập nhật online status
- Handle reconnection

**Acceptance Criteria:**
- [ ] Real-time messages hoạt động
- [ ] Typing indicator hoạt động (nếu implement)
- [ ] Reconnection tự động

---

### Task 4.6: Implement Search Employee Modal (Chat 1-1)
**File:** `frontend/src/pages/chat/index.tsx`
**Thời gian:** 30 phút
**Mô tả:**
- Modal tìm kiếm nhân viên
- Search input với filter
- List employees với avatar, tên, mã nhân viên
- Click để tạo room chat 1-1
- Button "+" trên tab Cá nhân

**Acceptance Criteria:**
- [ ] Tìm kiếm hoạt động
- [ ] Tạo room 1-1 thành công
- [ ] UI đẹp

---

### Task 4.7: Implement Pagination (Infinite Scroll)
**File:** `frontend/src/pages/chat/index.tsx` hoặc component riêng
**Thời gian:** 45 phút
**Mô tả:**
- Load more messages khi scroll lên đầu
- Hiển thị loading indicator
- Disable khi không còn messages
- Giữ scroll position khi load thêm

**Acceptance Criteria:**
- [ ] Infinite scroll hoạt động mượt
- [ ] Performance tốt
- [ ] UX tốt

---

### Task 4.8: Styling & Polish UI
**File:** `frontend/src/pages/chat/chat.scss`
**Thời gian:** 30 phút
**Mô tả:**
- Style cho sidebar
- Style cho messages
- Style cho input area
- Responsive design
- Dark mode support (nếu có)

**Acceptance Criteria:**
- [ ] UI đẹp, professional
- [ ] Responsive
- [ ] Consistent với design system hiện tại

---

### Task 4.9: Thêm Route
**File:** `frontend/src/config/routes.tsx`
**Thời gian:** 10 phút
**Mô tả:**
- Thêm route `/chat`
- Có thể thêm role guard nếu cần

**Acceptance Criteria:**
- [ ] Route hoạt động
- [ ] Navigation đúng

---

## 📦 PHASE 5: TESTING & POLISH (1-2 giờ)

### Task 5.1: Test Chat chung toàn công ty
**Thời gian:** 20 phút
**Mô tả:**
- Test tất cả users có thể thấy room
- Test gửi/nhận tin nhắn
- Test real-time update

**Acceptance Criteria:**
- [ ] Tất cả test cases pass

---

### Task 5.2: Test Chat theo phòng ban
**Thời gian:** 20 phút
**Mô tả:**
- Test HRM có thể chat với tất cả phòng ban
- Test Employee chỉ thấy room của phòng ban mình
- Test quyền gửi tin nhắn

**Acceptance Criteria:**
- [ ] Tất cả test cases pass

---

### Task 5.3: Test Chat 1-1
**Thời gian:** 20 phút
**Mô tả:**
- Test tạo room 1-1
- Test chỉ 2 người thấy room
- Test gửi/nhận tin nhắn

**Acceptance Criteria:**
- [ ] Tất cả test cases pass

---

### Task 5.4: Test Edge Cases
**Thời gian:** 30 phút
**Mô tả:**
- Test mất kết nối và reconnect
- Test gửi tin nhắn khi offline (nếu có queue)
- Test pagination với nhiều messages
- Test permissions edge cases

**Acceptance Criteria:**
- [ ] Tất cả edge cases được xử lý

---

### Task 5.5: Performance Testing
**Thời gian:** 20 phút
**Mô tả:**
- Test với nhiều messages (100+)
- Test với nhiều rooms
- Test WebSocket performance

**Acceptance Criteria:**
- [ ] Performance acceptable
- [ ] Không có memory leaks

---

## 📦 PHASE 6: OPTIONAL ENHANCEMENTS (Tùy chọn)

### Task 6.1: Online/Offline Status
**Thời gian:** 30 phút
**Mô tả:**
- Implement user:online/user:offline events
- Hiển thị badge online trên messages
- Update status real-time

---

### Task 6.2: Audit Log Integration
**Thời gian:** 30 phút
**Mô tả:**
- Thêm audit log khi gửi/xóa tin nhắn
- Tích hợp với AuditLogService hiện có

---

### Task 6.3: Message Queue (Offline Support)
**Thời gian:** 45 phút
**Mô tả:**
- Implement message queue service
- Lưu vào localStorage
- Auto retry khi reconnect

---

### Task 6.4: Unit Tests
**Thời gian:** 1-2 giờ
**Mô tả:**
- Test ChatService methods
- Test permissions
- Test edge cases

---

## 📊 TIMELINE TỔNG QUAN

| Phase | Tasks | Thời gian ước tính | Priority |
|-------|-------|-------------------|----------|
| Phase 1 | Database & Schema | 30-45 phút | 🔴 High |
| Phase 2 | Backend Core | 2-3 giờ | 🔴 High |
| Phase 3 | Frontend Setup | 1-1.5 giờ | 🔴 High |
| Phase 4 | Frontend UI | 2-3 giờ | 🔴 High |
| Phase 5 | Testing | 1-2 giờ | 🔴 High |
| Phase 6 | Enhancements | Optional | 🟡 Medium |

**Tổng thời gian MVP:** ~7-10 giờ (1-1.5 ngày làm việc)

---

## ✅ CHECKLIST TỔNG QUAN

### Backend
- [ ] Database schema hoàn chỉnh
- [ ] Migration chạy thành công
- [ ] ChatModule hoàn chỉnh
- [ ] WebSocket authentication hoạt động
- [ ] 3 loại chat hoạt động
- [ ] Permissions đúng
- [ ] Error handling đầy đủ

### Frontend
- [ ] SocketService hoạt động
- [ ] ChatPage component hoàn chỉnh
- [ ] 3 tabs hoạt động
- [ ] Real-time messaging hoạt động
- [ ] Search employee hoạt động
- [ ] Pagination hoạt động
- [ ] UI đẹp, responsive

### Testing
- [ ] Test tất cả 3 loại chat
- [ ] Test permissions
- [ ] Test edge cases
- [ ] Test performance

---

## 🚨 LƯU Ý QUAN TRỌNG

1. **Làm từng task một, test sau mỗi task**
2. **Commit thường xuyên** sau mỗi task hoàn thành
3. **Nếu gặp lỗi, dừng lại và fix trước khi tiếp tục**
4. **Ưu tiên MVP trước, enhancements sau**
5. **Test trên nhiều browsers/devices**

---

## 📝 NOTES

- Có thể bỏ qua Phase 6 nếu muốn release nhanh
- Có thể thêm features sau (file upload, emoji, etc.)
- Cần review code trước khi merge

