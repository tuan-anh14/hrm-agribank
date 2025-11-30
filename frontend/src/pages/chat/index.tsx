import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layout, Tabs, List, Avatar, Input, Button, Spin, Empty, Badge, Modal, Form } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useCurrentApp } from '@/components/context/app.context';
import { useIsMobile } from '@/hooks/useResponsive';
import { getChatRoomsAPI, getChatMessagesAPI, createDirectMessageRoomAPI, markRoomAsReadAPI, getAllEmployeesAPI } from '@/services/api';
import type { Employee } from '@/types/employee';
import { socketService } from '@/services/socket.service';
import { ChatClientEvents, ChatServerEvents } from '@/constants/chat.events';
import type { ChatRoom, ChatMessage, ChatRoomsResponse } from '@/types/chat';
import { ChatRoomType } from '@/types/chat';
import { handleApiSuccess, notifyError } from '@/utils/notification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import './chat.scss';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;

type TabKey = 'company' | 'departments' | 'direct';

// Helper component to render room item (tránh code trùng lặp)
const RoomItem: React.FC<{
  room: ChatRoom;
  isSelected: boolean;
  onSelect: (room: ChatRoom) => void;
  getUnreadCount: (room: ChatRoom) => number;
}> = ({ room, isSelected, onSelect, getUnreadCount }) => {
  const getRoomTitle = () => {
    if (room.type === ChatRoomType.DIRECT_MESSAGE) {
      return room.otherParticipant?.fullName || room.name;
    }
    return room.name;
  };

  return (
    <List.Item
      className={`chat-room-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(room)}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{getRoomTitle()}</span>
            {getUnreadCount(room) > 0 && (
              <Badge count={getUnreadCount(room)} />
            )}
          </div>
        }
        description={
          room.lastMessage ? (
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {room.lastMessage.sender?.fullName || 'Unknown'}: {room.lastMessage.content}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {dayjs(room.lastMessage.createdAt).fromNow()}
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#999' }}>Chưa có tin nhắn</span>
          )
        }
      />
    </List.Item>
  );
};

const ChatPage: React.FC = () => {
  const { user } = useCurrentApp();
  const isMobile = useIsMobile();
  const [rooms, setRooms] = useState<ChatRoomsResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('company');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchEmployees, setSearchEmployees] = useState<Employee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatView, setShowChatView] = useState(false); // For mobile: show chat view or list view
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false); // Control auto scroll
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Define all functions first using useCallback
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const connectSocket = useCallback(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
  }, []);

  const updateRoomLastMessage = useCallback((roomId: string, message: ChatMessage) => {
    setRooms((prev) => {
      if (!prev) return null;
      
      const updateRoom = (room: ChatRoom): ChatRoom => {
        if (room.id !== roomId) return room;
        return { ...room, lastMessage: message, updatedAt: message.createdAt };
      };

      return {
        company: prev.company ? updateRoom(prev.company) : null,
        departments: prev.departments.map(updateRoom),
        directMessages: prev.directMessages.map(updateRoom),
      };
    });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (!socketService.isConnected()) {
      return;
    }
    socketService.emit(ChatClientEvents.ROOM_JOIN, { roomId });
  }, []);

  const markRoomAsRead = useCallback(async (roomId: string) => {
    try {
      await markRoomAsReadAPI(roomId);
    } catch (error) {
      console.error('[ChatPage] Error marking room as read:', error);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string, page: number = 1, limit: number = 50, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setMessagesLoading(true);
      }
      
      const response = await getChatMessagesAPI(roomId, { page, limit });
      
      // Parse response - có thể là ChatMessageListResponse trực tiếp hoặc nested trong data
      let messagesData: { data: ChatMessage[]; totalPages: number } | null = null;
      
      if (response) {
        // Check if response is ChatMessageListResponse directly
        if (typeof response === 'object' && 'data' in response && 'totalPages' in response) {
          messagesData = response as unknown as { data: ChatMessage[]; totalPages: number };
        }
        // Check if response has nested data
        else if (typeof response === 'object' && 'data' in response && response.data) {
          const nestedData = response.data as unknown;
          if (nestedData && typeof nestedData === 'object' && 'data' in nestedData && 'totalPages' in nestedData) {
            messagesData = nestedData as { data: ChatMessage[]; totalPages: number };
          }
        }
      }
      
      if (messagesData) {
        const newMessages = Array.isArray(messagesData.data) ? messagesData.data : [];
        
        if (append) {
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
          setShouldAutoScroll(false);
        }
        
        setCurrentPage(page);
        setHasMore(messagesData.totalPages > page);
      } else {
        if (!append) {
          setMessages([]);
        }
      }
    } catch (error) {
      notifyError(error, 'Không thể tải tin nhắn');
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadRooms = useCallback(async (preserveSelectedRoom: boolean = true) => {
    try {
      setLoading(true);
      const response = await getChatRoomsAPI();
      
      let roomsData: ChatRoomsResponse | null = null;
      
      if (response) {
        if ('data' in response && response.data) {
          const data = response.data as unknown;
          if (data && typeof data === 'object' && ('company' in data || 'departments' in data || 'directMessages' in data)) {
            roomsData = data as ChatRoomsResponse;
          }
        }
        else if ('company' in response || 'departments' in response || 'directMessages' in response) {
          roomsData = response as unknown as ChatRoomsResponse;
        }
      }
      
      if (roomsData) {
        const normalizedRoomsData: ChatRoomsResponse = {
          company: roomsData.company || null,
          departments: Array.isArray(roomsData.departments) ? roomsData.departments : [],
          directMessages: Array.isArray(roomsData.directMessages) ? roomsData.directMessages : [],
        };
        
        setRooms(normalizedRoomsData);
        
        // Chỉ update selectedRoom nếu preserveSelectedRoom = true và có selectedRoom
        if (preserveSelectedRoom) {
          setSelectedRoom((currentSelectedRoom) => {
            if (!currentSelectedRoom) {
              // Auto select first room if no room selected
              if (normalizedRoomsData.company) {
                return normalizedRoomsData.company;
              } else if (normalizedRoomsData.departments.length > 0) {
                return normalizedRoomsData.departments[0];
              } else if (normalizedRoomsData.directMessages.length > 0) {
                return normalizedRoomsData.directMessages[0];
              }
              return null;
            } else {
              // Update selected room data if it exists in the new rooms list
              const updatedSelectedRoom = 
                normalizedRoomsData.company?.id === currentSelectedRoom.id ? normalizedRoomsData.company :
                normalizedRoomsData.departments.find(r => r.id === currentSelectedRoom.id) ||
                normalizedRoomsData.directMessages.find(r => r.id === currentSelectedRoom.id);
              
              return updatedSelectedRoom || currentSelectedRoom;
            }
          });
        }
      }
    } catch (error) {
      notifyError(error, 'Không thể tải danh sách phòng chat');
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load rooms khi component mount
  useEffect(() => {
    loadRooms();
    connectSocket();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.disconnect();
    };
  }, [loadRooms, connectSocket]);

  // Load messages khi chọn room
  useEffect(() => {
    if (selectedRoom) {
      setMessages([]);
      setCurrentPage(1);
      setHasMore(true);
      loadMessages(selectedRoom.id, 1, 50, false);
      joinRoom(selectedRoom.id);
      markRoomAsRead(selectedRoom.id);
    }
  }, [selectedRoom, loadMessages, joinRoom, markRoomAsRead]);

  // Auto scroll to bottom chỉ khi có tin nhắn mới (không scroll khi load messages lần đầu)
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
      setShouldAutoScroll(false); // Reset sau khi scroll
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Setup WebSocket event handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      return;
    }

    // Message handlers
    const handleNewMessage = (message: ChatMessage) => {
      // Always update last message in rooms list (for all rooms)
      updateRoomLastMessage(message.roomId, message);
      
      if (message.roomId === selectedRoom?.id) {
        // Remove optimistic message if exists
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
          return [...filtered, message];
        });
        // Chỉ scroll khi có message mới từ WebSocket
        setShouldAutoScroll(true);
      } else {
        // Reload rooms to update unread count for other rooms (không update selectedRoom)
        loadRooms(true);
      }
    };

    const handleMessageError = (error: { error: string }) => {
      console.error('[ChatPage] Message error:', error);
      notifyError(error, error.error || 'Không thể gửi tin nhắn');
    };

    const handleTypingUser = (data: { roomId: string; userId: string; username?: string }) => {
      if (data.roomId === selectedRoom?.id && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev).add(data.userId);
          return next;
        });
        // Auto remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }, 3000);
      }
    };

    const handleTypingStop = (data: { roomId: string; userId: string }) => {
      if (data.roomId === selectedRoom?.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleUserStatusChanged = (_data: { userId: string; status: 'online' | 'offline' }) => {
      // TODO: Update user online status in UI
    };

    const handleRoomsUpdated = () => {
      loadRooms(true);
    };

    // Register event listeners
    socketService.on(ChatServerEvents.MESSAGE_NEW, handleNewMessage);
    socketService.on(ChatServerEvents.MESSAGE_ERROR, handleMessageError);
    socketService.on(ChatServerEvents.TYPING_USER, handleTypingUser);
    socketService.on(ChatServerEvents.TYPING_STOP, handleTypingStop);
    socketService.on(ChatServerEvents.USER_STATUS_CHANGED, handleUserStatusChanged);
    socketService.on(ChatServerEvents.ROOMS_UPDATED, handleRoomsUpdated);
    
    // Also listen to socket connection events
    socket.on('connect', () => {
      if (selectedRoom) {
        joinRoom(selectedRoom.id);
      }
    });
    
    socket.on('disconnect', () => {
      // Handle disconnect if needed
    });
    
    return () => {
      socketService.off(ChatServerEvents.MESSAGE_NEW, handleNewMessage);
      socketService.off(ChatServerEvents.MESSAGE_ERROR, handleMessageError);
      socketService.off(ChatServerEvents.TYPING_USER, handleTypingUser);
      socketService.off(ChatServerEvents.TYPING_STOP, handleTypingStop);
      socketService.off(ChatServerEvents.USER_STATUS_CHANGED, handleUserStatusChanged);
      socketService.off(ChatServerEvents.ROOMS_UPDATED, handleRoomsUpdated);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [selectedRoom, user?.id, updateRoomLastMessage, loadRooms, joinRoom]);

  const loadMoreMessages = useCallback(() => {
    if (!selectedRoom || loadingMore || !hasMore) return;
    loadMessages(selectedRoom.id, currentPage + 1, 50, true);
  }, [selectedRoom, loadingMore, hasMore, currentPage, loadMessages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Load more when scroll to top
    if (target.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

  const handleTypingStart = useCallback(() => {
    if (!selectedRoom) return;
    socketService.emit(ChatClientEvents.TYPING_START, { roomId: selectedRoom.id });
  }, [selectedRoom]);

  const handleTypingStop = useCallback(() => {
    if (!selectedRoom) return;
    socketService.emit(ChatClientEvents.TYPING_STOP, { roomId: selectedRoom.id });
  }, [selectedRoom]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !selectedRoom) {
      return;
    }

    const content = messageInput.trim();
    setMessageInput('');
    
    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      roomId: selectedRoom.id,
      senderId: user?.id || '',
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        fullName: user?.fullName || 'Bạn',
        employeeCode: (user as any)?.employeeCode || '',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setShouldAutoScroll(true);
    scrollToBottom();
    handleTypingStop();

    // Send via WebSocket
    if (!socketService.isConnected()) {
      notifyError(new Error('Socket not connected'), 'Không thể kết nối đến server. Vui lòng thử lại.');
      return;
    }
    
    socketService.emit(ChatClientEvents.MESSAGE_SEND, {
      roomId: selectedRoom.id,
      content,
    });
  }, [selectedRoom, messageInput, user?.id, scrollToBottom, handleTypingStop]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    
    // Emit typing start
    if (value.trim() && selectedRoom) {
      handleTypingStart();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      handleTypingStop();
    }
  }, [selectedRoom, handleTypingStart, handleTypingStop]);

  const getRoomsForTab = useCallback((): ChatRoom[] => {
    if (!rooms) {
      return [];
    }
    
    switch (activeTab) {
      case 'company':
        return rooms.company ? [rooms.company] : [];
      case 'departments':
        return Array.isArray(rooms.departments) ? rooms.departments : [];
      case 'direct':
        return Array.isArray(rooms.directMessages) ? rooms.directMessages : [];
      default:
        return [];
    }
  }, [rooms, activeTab]);

  const getUnreadCount = useCallback((room: ChatRoom): number => {
    if (!room.lastMessage || !user?.id) return 0;
    
    // Nếu tin nhắn cuối là của chính mình, không tính unread
    if (room.lastMessage.senderId === user.id) return 0;
    
    // Tìm participant của user trong room để lấy lastReadAt
    const participant = room.participants?.find((p) => p.employeeId === user.id);
    
    if (!participant || !participant.lastReadAt) {
      // Chưa đọc lần nào, có thể có nhiều tin nhắn chưa đọc
      // Tạm thời return 1 nếu có lastMessage và không phải của mình
      return 1;
    }
    
    // So sánh lastReadAt với lastMessage.createdAt
    const lastReadAt = new Date(participant.lastReadAt).getTime();
    const lastMessageAt = new Date(room.lastMessage.createdAt).getTime();
    
    // Nếu lastMessage mới hơn lastReadAt, có tin nhắn chưa đọc
    return lastMessageAt > lastReadAt ? 1 : 0;
  }, [user?.id]);

  const handleCreateDirectMessage = useCallback(async (otherUserId: string) => {
    try {
      const response = await createDirectMessageRoomAPI({ otherUserId });
      
      // Parse response - có thể là ChatRoom trực tiếp hoặc nested trong data
      let roomData: ChatRoom | null = null;
      
      if (response) {
        // Case 1: Response là ChatRoom trực tiếp
        if (typeof response === 'object' && 'id' in response && 'name' in response && 'type' in response) {
          roomData = response as unknown as ChatRoom;
        }
        // Case 2: Response có nested data
        else if (typeof response === 'object' && 'data' in response && response.data) {
          const data = response.data as unknown;
          // Check if data is ChatRoom
          if (data && typeof data === 'object' && 'id' in data && 'name' in data && 'type' in data) {
            roomData = data as ChatRoom;
          }
          // Check if data.data is ChatRoom (double nested)
          else if (data && typeof data === 'object' && 'data' in data) {
            const nestedData = (data as { data: unknown }).data;
            if (nestedData && typeof nestedData === 'object' && 'id' in nestedData && 'name' in nestedData) {
              roomData = nestedData as ChatRoom;
            }
          }
        }
      }
      
      if (roomData) {
        setSelectedRoom(roomData);
        setActiveTab('direct');
        if (isMobile) {
          setShowChatView(true);
        }
        setSearchModalVisible(false);
        form.resetFields();
        setSearchQuery('');
        setSearchEmployees([]);
        
        // Thêm room mới vào state ngay lập tức
        setRooms((prev) => {
          if (!prev) {
            return {
              company: null,
              departments: [],
              directMessages: [roomData],
            };
          }
          // Kiểm tra xem room đã tồn tại chưa (tránh duplicate)
          const existingIndex = prev.directMessages?.findIndex(r => r.id === roomData.id) ?? -1;
          if (existingIndex >= 0) {
            // Update existing room
            const updated = [...(prev.directMessages || [])];
            updated[existingIndex] = roomData;
            return {
              ...prev,
              directMessages: updated,
            };
          } else {
            // Add new room
            return {
              ...prev,
              directMessages: [...(prev.directMessages || []), roomData],
            };
          }
        });
        
        // Reload rooms để sync với backend (không update selectedRoom vì đã set ở trên)
        await loadRooms(false);
        handleApiSuccess(response, 'Đã tạo phòng chat thành công', 'Không thể tạo phòng chat');
      } else {
        notifyError(response || new Error('Invalid response'), 'Không thể tạo phòng chat - dữ liệu không hợp lệ');
      }
    } catch (error) {
      notifyError(error, 'Không thể tạo phòng chat');
      console.error('[ChatPage] Error creating direct message room:', error);
    }
  }, [isMobile, loadRooms]);

  const handleSearchEmployees = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchEmployees([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await getAllEmployeesAPI();
      
      const allEmployees: Employee[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

      // Filter employees (exclude current user)
      const filtered = allEmployees.filter((emp) => {
        if (emp.id === user?.id) return false;
        const searchLower = query.toLowerCase();
        return (
          emp.fullName.toLowerCase().includes(searchLower) ||
          emp.employeeCode.toLowerCase().includes(searchLower) ||
          emp.email?.toLowerCase().includes(searchLower)
        );
      });
      
      setSearchEmployees(filtered.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      notifyError(error, 'Không thể tìm kiếm nhân viên');
      console.error('Error searching employees:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [user?.id]);

  // Handle room selection (mobile: show chat view)
  const handleRoomSelect = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
    if (isMobile) {
      setShowChatView(true);
    }
  }, [isMobile]);

  // Handle back to list (mobile only)
  const handleBackToList = useCallback(() => {
    setShowChatView(false);
  }, []);

  return (
    <Layout className={`chat-layout ${isMobile ? 'mobile' : ''} ${isMobile && showChatView ? 'show-chat-view' : ''}`} style={{ height: 'calc(100vh - 64px)' }}>
      <Sider 
        width={300} 
        className={`chat-sidebar ${isMobile && showChatView ? 'hidden' : ''}`} 
        theme="light"
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          tabBarExtraContent={
            activeTab === 'direct' ? (
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => setSearchModalVisible(true)}
                title="Tạo chat mới"
              />
            ) : null
          }
        >
          <TabPane tab="Công ty" key="company">
            <List
              loading={loading}
              dataSource={getRoomsForTab()}
              locale={{ emptyText: 'Chưa có cuộc trò chuyện nào' }}
              renderItem={(room) => (
                <RoomItem
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onSelect={handleRoomSelect}
                  getUnreadCount={getUnreadCount}
                />
              )}
            />
          </TabPane>
          <TabPane tab="Phòng ban" key="departments">
            <List
              loading={loading}
              dataSource={getRoomsForTab()}
              locale={{ emptyText: 'Chưa có cuộc trò chuyện nào' }}
              renderItem={(room) => (
                <RoomItem
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onSelect={handleRoomSelect}
                  getUnreadCount={getUnreadCount}
                />
              )}
            />
          </TabPane>
          <TabPane tab="Cá nhân" key="direct">
            <List
              loading={loading}
              dataSource={getRoomsForTab()}
              locale={{ emptyText: 'Chưa có cuộc trò chuyện nào' }}
              renderItem={(room) => (
                <RoomItem
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onSelect={handleRoomSelect}
                  getUnreadCount={getUnreadCount}
                />
              )}
            />
          </TabPane>
        </Tabs>
      </Sider>
      
      <Content className={`chat-content ${isMobile && !showChatView ? 'hidden' : ''}`}>
        {selectedRoom ? (
          <>
            <div className="chat-header">
              {isMobile && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  className="back-button"
                />
              )}
              <h3>
                {selectedRoom.type === ChatRoomType.DIRECT_MESSAGE
                  ? selectedRoom.otherParticipant?.fullName || selectedRoom.name
                  : selectedRoom.name}
              </h3>
            </div>
            
            <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Spin size="small" />
                </div>
              )}
              {messagesLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: '20px' }} />
              ) : messages.length === 0 ? (
                <Empty description="Chưa có tin nhắn nào" />
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.senderId === user?.id ? 'own' : 'other'}`}
                  >
                    <Avatar icon={<UserOutlined />} />
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">{msg.sender?.fullName || 'Unknown'}</span>
                        <span className="message-time">{dayjs(msg.createdAt).format('HH:mm')}</span>
                      </div>
                      <div className="message-text">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}
              {typingUsers.size > 0 && (
                <div className="typing-indicator">
                  <span>
                    {Array.from(typingUsers).length === 1 
                      ? 'Đang gõ...' 
                      : `${Array.from(typingUsers).length} người đang gõ...`}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
              <TextArea
                value={messageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleTypingStop}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                rows={1}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                Gửi
              </Button>
            </div>
          </>
        ) : (
          <Empty description="Chọn một phòng chat để bắt đầu" />
        )}
      </Content>

      {/* Search Employee Modal for Direct Message */}
      <Modal
        title="Tìm nhân viên để chat"
        open={searchModalVisible}
        onCancel={() => {
          setSearchModalVisible(false);
          form.resetFields();
          setSearchQuery('');
          setSearchEmployees([]);
        }}
        footer={null}
        width={500}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên, mã nhân viên hoặc email"
          value={searchQuery}
          onChange={(e) => handleSearchEmployees(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {searchLoading ? (
            <Spin style={{ display: 'block', textAlign: 'center', padding: '20px' }} />
          ) : searchEmployees.length === 0 ? (
            <Empty
              description={searchQuery ? 'Không tìm thấy nhân viên' : 'Nhập tên hoặc mã nhân viên để tìm kiếm'}
            />
          ) : (
            <List
              dataSource={searchEmployees}
              renderItem={(employee) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '12px' }}
                  onClick={() => handleCreateDirectMessage(employee.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={employee.fullName}
                    description={
                      <div>
                        <div>Mã: {employee.employeeCode}</div>
                        {employee.department && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {employee.department.name}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default ChatPage;

