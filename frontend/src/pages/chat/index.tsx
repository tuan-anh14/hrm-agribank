import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layout, Tabs, List, Avatar, Input, Button, Spin, Empty, Badge, Modal, Form, message } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useCurrentApp } from '@/components/context/app.context';
import { useIsMobile } from '@/hooks/useResponsive';
import { getChatRoomsAPI, getChatMessagesAPI, createDirectMessageRoomAPI, markRoomAsReadAPI, getAllEmployeesAPI } from '@/services/api';
import type { Employee } from '@/types/employee';
import { socketService } from '@/services/socket.service';
import { ChatClientEvents, ChatServerEvents, SocketIOEvents } from '@/constants/chat.events';
import type { ChatRoom, ChatMessage, ChatRoomsResponse, ChatMessageListResponse } from '@/types/chat';
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

  // Load rooms khi component mount
  useEffect(() => {
    console.log('[ChatPage] Component mounted, loading rooms and connecting socket');
    console.log('[ChatPage] Current user:', user);
    loadRooms();
    connectSocket();
    
    return () => {
      console.log('[ChatPage] Component unmounting, cleaning up');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.disconnect();
    };
  }, []);

  // Load messages khi chọn room
  useEffect(() => {
    if (selectedRoom) {
      console.log('[ChatPage] Room selected:', {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        roomType: selectedRoom.type,
        lastMessage: selectedRoom.lastMessage,
      });
      setMessages([]);
      setCurrentPage(1);
      setHasMore(true);
      loadMessages(selectedRoom.id, 1, 50, false);
      joinRoom(selectedRoom.id);
      markRoomAsRead(selectedRoom.id);
    } else {
      console.log('[ChatPage] No room selected');
    }
  }, [selectedRoom]);

  // Auto scroll to bottom chỉ khi có tin nhắn mới (không scroll khi load messages lần đầu)
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
      setShouldAutoScroll(false); // Reset sau khi scroll
    }
  }, [messages, shouldAutoScroll]);

  // Setup WebSocket event handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn('[ChatPage] Socket is null, cannot setup event listeners');
      return;
    }

    // Message handlers
    const handleNewMessage = (message: ChatMessage) => {
      console.log('[ChatPage] ✨ New message received via WebSocket:', {
        messageId: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.sender?.fullName,
        content: message.content?.substring(0, 50) + '...',
        isCurrentRoom: message.roomId === selectedRoom?.id,
        currentSelectedRoomId: selectedRoom?.id,
      });
      
      // Always update last message in rooms list (for all rooms)
      updateRoomLastMessage(message.roomId, message);
      
      if (message.roomId === selectedRoom?.id) {
        // Remove optimistic message if exists
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
          console.log('[ChatPage] ✅ Adding message to current room, total messages:', filtered.length + 1);
          return [...filtered, message];
        });
        // Chỉ scroll khi có message mới từ WebSocket
        setShouldAutoScroll(true);
      } else {
        console.log('[ChatPage] ℹ️ Message for different room, updating room list only');
        // Reload rooms to update unread count for other rooms
        loadRooms();
      }
    };

    const handleMessageError = (error: { error: string }) => {
      console.error('[ChatPage] Message error:', error);
      notifyError(error.error || 'Không thể gửi tin nhắn');
    };

    const handleTypingUser = (data: { roomId: string; userId: string; username?: string }) => {
      console.log('[ChatPage] User typing:', data);
      if (data.roomId === selectedRoom?.id && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev).add(data.userId);
          console.log('[ChatPage] Typing users updated:', Array.from(next));
          return next;
        });
        // Auto remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            console.log('[ChatPage] Typing stopped for user:', data.userId);
            return next;
          });
        }, 3000);
      }
    };

    const handleTypingStop = (data: { roomId: string; userId: string }) => {
      console.log('[ChatPage] User stopped typing:', data);
      if (data.roomId === selectedRoom?.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          console.log('[ChatPage] Typing users after stop:', Array.from(next));
          return next;
        });
      }
    };

    const handleUserStatusChanged = (data: { userId: string; status: 'online' | 'offline' }) => {
      // TODO: Update user online status in UI
      console.log('[ChatPage] User status changed:', data);
    };

    const handleRoomsUpdated = () => {
      console.log('[ChatPage] Rooms updated event received, reloading rooms');
      loadRooms();
    };

      // Register event listeners
      console.log('[ChatPage] 📡 Registering WebSocket event listeners');
      socketService.on(ChatServerEvents.MESSAGE_NEW, handleNewMessage);
      socketService.on(ChatServerEvents.MESSAGE_ERROR, handleMessageError);
      socketService.on(ChatServerEvents.TYPING_USER, handleTypingUser);
      socketService.on(ChatServerEvents.TYPING_STOP, handleTypingStop);
      socketService.on(ChatServerEvents.USER_STATUS_CHANGED, handleUserStatusChanged);
      socketService.on(ChatServerEvents.ROOMS_UPDATED, handleRoomsUpdated);
      
      // Also listen to socket connection events
      socket.on('connect', () => {
        console.log('[ChatPage] 🔌 Socket connected, re-joining rooms if needed');
        if (selectedRoom) {
          joinRoom(selectedRoom.id);
        }
      });
      
      socket.on('disconnect', (reason) => {
        console.log('[ChatPage] 🔌 Socket disconnected:', reason);
      });
    
    return () => {
      console.log('[ChatPage] 🧹 Cleaning up WebSocket event listeners');
      socketService.off(ChatServerEvents.MESSAGE_NEW, handleNewMessage);
      socketService.off(ChatServerEvents.MESSAGE_ERROR, handleMessageError);
      socketService.off(ChatServerEvents.TYPING_USER, handleTypingUser);
      socketService.off(ChatServerEvents.TYPING_STOP, handleTypingStop);
      socketService.off(ChatServerEvents.USER_STATUS_CHANGED, handleUserStatusChanged);
      socketService.off(ChatServerEvents.ROOMS_UPDATED, handleRoomsUpdated);
    };
  }, [selectedRoom, user?.id]);

  const connectSocket = () => {
    console.log('[ChatPage] Connecting socket, isConnected:', socketService.isConnected());
    if (!socketService.isConnected()) {
      const socket = socketService.connect();
      console.log('[ChatPage] Socket connection initiated:', socket?.id);
    } else {
      console.log('[ChatPage] Socket already connected:', socketService.getSocket()?.id);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await getChatRoomsAPI();
      console.log('[ChatPage] Raw API response:', response);
      console.log('[ChatPage] Response structure:', {
        hasData: !!response?.data,
        hasDataData: !!response?.data?.data,
        keys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : [],
      });
      
      // Response structure có thể là:
      // 1. { data: ChatRoomsResponse } - từ axios interceptor
      // 2. { data: { data: ChatRoomsResponse } } - double wrapped
      // 3. ChatRoomsResponse trực tiếp
      let roomsData: ChatRoomsResponse | null = null;
      
      if (response) {
        // Case 1: Response có data.data (double wrapped)
        if (response.data?.data && (response.data.data.company || response.data.data.directMessages || response.data.data.departments)) {
          roomsData = response.data.data;
          console.log('[ChatPage] Found rooms in response.data.data');
        }
        // Case 2: Response có data (single wrapped)
        else if (response.data && (response.data.company || response.data.directMessages || response.data.departments)) {
          roomsData = response.data;
          console.log('[ChatPage] Found rooms in response.data');
        }
        // Case 3: Response trực tiếp là ChatRoomsResponse
        else if (response.company || response.directMessages || response.departments) {
          roomsData = response as ChatRoomsResponse;
          console.log('[ChatPage] Found rooms in response directly');
        }
      }
      
      if (roomsData) {
        console.log('[ChatPage] Parsed rooms data:', {
          company: roomsData.company ? { id: roomsData.company.id, name: roomsData.company.name } : null,
          departmentsCount: roomsData.departments?.length || 0,
          directMessagesCount: roomsData.directMessages?.length || 0,
          directMessages: roomsData.directMessages?.map(d => ({ 
            id: d.id, 
            name: d.name,
            otherParticipant: d.otherParticipant?.fullName,
            hasLastMessage: !!d.lastMessage,
          })) || [],
        });
        
        // Đảm bảo directMessages và departments luôn là array
        const normalizedRoomsData: ChatRoomsResponse = {
          company: roomsData.company || null,
          departments: Array.isArray(roomsData.departments) ? roomsData.departments : [],
          directMessages: Array.isArray(roomsData.directMessages) ? roomsData.directMessages : [],
        };
        
        console.log('[ChatPage] Normalized rooms data:', {
          directMessagesCount: normalizedRoomsData.directMessages.length,
          departmentsCount: normalizedRoomsData.departments.length,
        });
        
        setRooms(normalizedRoomsData);
        // Auto select first room if no room selected
        if (!selectedRoom) {
          if (normalizedRoomsData.company) {
            console.log('[ChatPage] Auto-selecting company room:', normalizedRoomsData.company.id);
            setSelectedRoom(normalizedRoomsData.company);
          } else if (normalizedRoomsData.departments && normalizedRoomsData.departments.length > 0) {
            console.log('[ChatPage] Auto-selecting department room:', normalizedRoomsData.departments[0].id);
            setSelectedRoom(normalizedRoomsData.departments[0]);
          } else if (normalizedRoomsData.directMessages && normalizedRoomsData.directMessages.length > 0) {
            console.log('[ChatPage] Auto-selecting direct message room:', normalizedRoomsData.directMessages[0].id);
            setSelectedRoom(normalizedRoomsData.directMessages[0]);
          }
        } else {
          // Update selected room data if it exists in the new rooms list
          const updatedSelectedRoom = 
            normalizedRoomsData.company?.id === selectedRoom.id ? normalizedRoomsData.company :
            normalizedRoomsData.departments.find(r => r.id === selectedRoom.id) ||
            normalizedRoomsData.directMessages.find(r => r.id === selectedRoom.id);
          
          if (updatedSelectedRoom) {
            console.log('[ChatPage] Updating selected room data');
            setSelectedRoom(updatedSelectedRoom);
          }
        }
      } else {
        console.warn('[ChatPage] No rooms data found in response:', response);
      }
    } catch (error) {
      notifyError('Không thể tải danh sách phòng chat');
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string, page: number = 1, limit: number = 50, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setMessagesLoading(true);
      }
      
      const response = await getChatMessagesAPI(roomId, { page, limit });
      console.log('Chat messages response:', response);
      
      // Response structure: { data: { data: ChatMessageListResponse, ... } }
      const messagesData = response?.data?.data || response?.data;
      
      if (messagesData) {
        const newMessages = messagesData.data || messagesData;
        console.log('[ChatPage] Loaded messages:', {
          roomId,
          page,
          append,
          messageCount: Array.isArray(newMessages) ? newMessages.length : 0,
          totalPages: messagesData.totalPages,
          hasMore: messagesData.totalPages ? messagesData.totalPages > page : undefined,
        });
        
        if (append) {
          // Prepend older messages
          setMessages((prev) => {
            const updated = [...newMessages, ...prev];
            console.log('[ChatPage] Appended messages, total:', updated.length);
            return updated;
          });
        } else {
          const messagesArray = Array.isArray(newMessages) ? newMessages : [];
          console.log('[ChatPage] Setting messages, count:', messagesArray.length);
          setMessages(messagesArray);
          // Không auto scroll khi load messages lần đầu
          setShouldAutoScroll(false);
        }
        
        setCurrentPage(page);
        if (messagesData.totalPages !== undefined) {
          setHasMore(messagesData.totalPages > page);
        } else {
          setHasMore(Array.isArray(newMessages) && newMessages.length === limit);
        }
      } else {
        console.warn('[ChatPage] No messages data found in response:', response);
        if (!append) {
          setMessages([]);
        }
      }
    } catch (error) {
      notifyError('Không thể tải tin nhắn');
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (!selectedRoom || loadingMore || !hasMore) return;
    loadMessages(selectedRoom.id, currentPage + 1, 50, true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Load more when scroll to top
    if (target.scrollTop === 0 && hasMore && !loadingMore) {
      console.log('[ChatPage] Scrolled to top, loading more messages');
      loadMoreMessages();
    }
  };

  const joinRoom = (roomId: string) => {
    console.log('[ChatPage] Joining room via WebSocket:', roomId);
    if (!socketService.isConnected()) {
      console.warn('[ChatPage] Socket not connected, cannot join room');
      return;
    }
    // Backend expects { roomId: string } not just string
    socketService.emit(ChatClientEvents.ROOM_JOIN, { roomId });
  };

  const markRoomAsRead = async (roomId: string) => {
    try {
      console.log('[ChatPage] Marking room as read:', roomId);
      const response = await markRoomAsReadAPI(roomId);
      console.log('[ChatPage] Room marked as read:', response);
    } catch (error) {
      console.error('[ChatPage] Error marking room as read:', error);
    }
  };

  const updateRoomLastMessage = (roomId: string, message: ChatMessage) => {
    setRooms((prev) => {
      if (!prev) return null;
      
      const updateRoom = (room: ChatRoom | null): ChatRoom | null => {
        if (!room || room.id !== roomId) return room;
        return { ...room, lastMessage: message, updatedAt: message.createdAt };
      };

      return {
        company: updateRoom(prev.company),
        departments: prev.departments.map(updateRoom),
        directMessages: prev.directMessages.map(updateRoom),
      };
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) {
      console.log('[ChatPage] Cannot send message:', { hasInput: !!messageInput.trim(), hasRoom: !!selectedRoom });
      return;
    }

    const content = messageInput.trim();
    console.log('[ChatPage] Sending message:', {
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      senderId: user?.id,
      senderName: user?.fullName,
    });
    
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

    console.log('[ChatPage] Adding optimistic message:', optimisticMessage.id);
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      console.log('[ChatPage] Messages after optimistic update:', updated.length);
      return updated;
    });
    // Scroll khi gửi message (optimistic update)
    setShouldAutoScroll(true);
    scrollToBottom();
    
    // Stop typing indicator
    handleTypingStop();

    // Send via WebSocket
    if (!socketService.isConnected()) {
      console.error('[ChatPage] ❌ Socket not connected, cannot send message');
      notifyError('Không thể kết nối đến server. Vui lòng thử lại.');
      return;
    }
    
    console.log('[ChatPage] 📤 Emitting MESSAGE_SEND event via WebSocket:', {
      roomId: selectedRoom.id,
      contentLength: content.length,
      socketConnected: socketService.isConnected(),
    });
    
    socketService.emit(ChatClientEvents.MESSAGE_SEND, {
      roomId: selectedRoom.id,
      content,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTypingStart = () => {
    if (!selectedRoom) return;
    console.log('[ChatPage] Typing started in room:', selectedRoom.id);
    socketService.emit(ChatClientEvents.TYPING_START, { roomId: selectedRoom.id });
  };

  const handleTypingStop = () => {
    if (!selectedRoom) return;
    console.log('[ChatPage] Typing stopped in room:', selectedRoom.id);
    socketService.emit(ChatClientEvents.TYPING_STOP, { roomId: selectedRoom.id });
  };

  // Debounce typing stop
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = (value: string) => {
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
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoomsForTab = (): ChatRoom[] => {
    if (!rooms) {
      console.log('[ChatPage] No rooms available');
      return [];
    }
    
    let result: ChatRoom[] = [];
    switch (activeTab) {
      case 'company':
        result = rooms.company ? [rooms.company] : [];
        break;
      case 'departments':
        result = Array.isArray(rooms.departments) ? rooms.departments : [];
        break;
      case 'direct':
        result = Array.isArray(rooms.directMessages) ? rooms.directMessages : [];
        console.log('[ChatPage] Direct messages:', {
          count: result.length,
          rooms: result.map(r => ({ id: r.id, name: r.name })),
          rawDirectMessages: rooms.directMessages,
        });
        break;
      default:
        result = [];
    }
    
    console.log('[ChatPage] Rooms for tab:', { tab: activeTab, count: result.length });
    return result;
  };

  const getUnreadCount = (room: ChatRoom): number => {
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
  };

  const handleCreateDirectMessage = async (otherUserId: string) => {
    console.log('[ChatPage] Creating direct message room with user:', otherUserId);
    try {
      const response = await createDirectMessageRoomAPI({ otherUserId });
      console.log('[ChatPage] Create direct message room response:', response);
      console.log('[ChatPage] Response type check:', {
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasId: !!response?.id,
        keys: response ? Object.keys(response) : [],
      });
      
      // Axios interceptor trả về response.data, và backend có thể trả về:
      // 1. ChatRoom trực tiếp (nếu backend return ChatRoom)
      // 2. IBackendRes<ChatRoom> (nếu backend wrap trong IBackendRes)
      // 3. IBackendRes<ChatRoom> với data.data (nếu double wrapped)
      let roomData: ChatRoom | null = null;
      
      if (response) {
        // Case 1: Response là ChatRoom trực tiếp (có id, name, type)
        // Check: có id và (type hoặc name) để xác định là ChatRoom
        if (response.id && (response.type || response.name)) {
          roomData = response as ChatRoom;
          console.log('[ChatPage] Response is ChatRoom directly:', {
            id: roomData.id,
            name: roomData.name,
            type: roomData.type,
          });
        }
        // Case 2: Response là IBackendRes<ChatRoom> (có data property)
        else if (response.data) {
          // Case 2a: response.data là ChatRoom
          if (response.data.id && (response.data.type || response.data.name)) {
            roomData = response.data as ChatRoom;
            console.log('[ChatPage] Response is IBackendRes<ChatRoom>, data is ChatRoom');
          }
          // Case 2b: response.data.data là ChatRoom (double wrapped)
          else if (response.data.data && response.data.data.id) {
            roomData = response.data.data as ChatRoom;
            console.log('[ChatPage] Response is IBackendRes<ChatRoom>, data.data is ChatRoom');
          } else {
            console.log('[ChatPage] response.data exists but not a valid ChatRoom:', {
              hasId: !!response.data.id,
              hasType: !!response.data.type,
              hasName: !!response.data.name,
              keys: Object.keys(response.data),
            });
          }
        } else {
          console.log('[ChatPage] Response exists but no valid structure:', {
            hasId: !!response.id,
            hasType: !!response.type,
            hasName: !!response.name,
            hasData: !!response.data,
            keys: Object.keys(response),
          });
        }
      }
      
      if (roomData) {
        console.log('[ChatPage] Direct message room created:', {
          roomId: roomData.id,
          roomName: roomData.name,
          roomType: roomData.type,
          otherParticipant: roomData.otherParticipant?.fullName,
        });
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
        
        // Reload rooms để sync với backend
        await loadRooms();
        handleApiSuccess('Đã tạo phòng chat thành công');
      } else {
        console.warn('[ChatPage] No room data in response, full response:', response);
        notifyError('Không thể tạo phòng chat - dữ liệu không hợp lệ');
      }
    } catch (error) {
      notifyError('Không thể tạo phòng chat');
      console.error('[ChatPage] Error creating direct message room:', error);
    }
  };

  const handleSearchEmployees = async (query: string) => {
    console.log('[ChatPage] Searching employees with query:', query);
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchEmployees([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await getAllEmployeesAPI();
      console.log('[ChatPage] Employees API response:', response);
      
      const allEmployees: Employee[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

      console.log('[ChatPage] Total employees found:', allEmployees.length);

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
      
      console.log('[ChatPage] Filtered employees:', filtered.length);

      setSearchEmployees(filtered.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      notifyError('Không thể tìm kiếm nhân viên');
      console.error('Error searching employees:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle room selection (mobile: show chat view)
  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    if (isMobile) {
      setShowChatView(true);
    }
  };

  // Handle back to list (mobile only)
  const handleBackToList = () => {
    setShowChatView(false);
  };

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
              renderItem={(room) => (
                <List.Item
                  className={`chat-room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{room.name}</span>
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
              )}
            />
          </TabPane>
          <TabPane tab="Phòng ban" key="departments">
            <List
              loading={loading}
              dataSource={getRoomsForTab()}
              renderItem={(room) => (
                <List.Item
                  className={`chat-room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{room.name}</span>
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
              )}
            />
          </TabPane>
          <TabPane tab="Cá nhân" key="direct">
            <List
              loading={loading}
              dataSource={getRoomsForTab()}
              renderItem={(room) => (
                <List.Item
                  className={`chat-room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{room.otherParticipant?.fullName || room.name}</span>
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

