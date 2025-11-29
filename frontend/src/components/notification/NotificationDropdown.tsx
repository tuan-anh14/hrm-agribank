import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Popover, Tabs, List, Empty, Button, Spin, Modal, Descriptions, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import type { Notification } from '@/types/notification';
import { NotificationType } from '@/types/notification';
import {
  getAllNotificationsAPI,
  getUnreadNotificationsAPI,
  getUnreadCountAPI,
  markNotificationAsReadAPI,
  markAllNotificationsAsReadAPI,
} from '@/services/api';
import { formatRelativeTime, formatDateTimeVN } from '@/utils/date.util';
import './NotificationDropdown.scss';

const { Text } = Typography;

type TabType = 'all' | 'unread' | 'read';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load notifications based on active tab
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let response: any;
      if (activeTab === 'unread') {
        response = await getUnreadNotificationsAPI({ page: 1, limit: 20 });
      } else {
        const params = activeTab === 'read' ? { isRead: 'true', page: 1, limit: 20 } : { page: 1, limit: 20 };
        response = await getAllNotificationsAPI(params);
      }
      
      // Axios interceptor returns response.data, so response is already the data object
      // Response structure: { data: Notification[], total, page, limit, totalPages }
      if (response && response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        setNotifications(response);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response: any = await getUnreadCountAPI();
      // Axios interceptor returns response.data, so response is already the data object
      // Response structure: { count: number }
      const count = response?.count ?? 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  // Load notifications and unread count
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Polling để cập nhật unread count mỗi 30 giây
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadUnreadCount();
      if (activeTab === 'all' || activeTab === 'unread') {
        loadNotifications();
      }
    }, 30000); // 30 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadUnreadCount, loadNotifications, activeTab]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailModalOpen(true);

    // Mark as read if not read
    if (!notification.isRead) {
      try {
        await markNotificationAsReadAPI(notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadAPI();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Get notification type color
  const getNotificationTypeColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.ATTENDANCE:
        return '#1890ff';
      case NotificationType.SHIFT:
        return '#52c41a';
      case NotificationType.PAYROLL:
        return '#faad14';
      case NotificationType.REQUEST:
        return '#722ed1';
      case NotificationType.SYSTEM:
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  // Render notification item
  const renderNotificationItem = (notification: Notification) => {
    const isUnread = !notification.isRead;
    
    return (
      <List.Item
        className={`notification-item ${isUnread ? 'unread' : ''}`}
        onClick={() => handleNotificationClick(notification)}
        style={{
          cursor: 'pointer',
          padding: '12px 16px',
          backgroundColor: isUnread ? '#fff1f0' : 'transparent',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text strong={isUnread} style={{ flex: 1 }}>
                {notification.title}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </div>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {notification.content}
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Text
                  style={{
                    fontSize: '11px',
                    color: getNotificationTypeColor(notification.type),
                    fontWeight: 500,
                  }}
                >
                  {notification.type}
                </Text>
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  // Dropdown content
  const dropdownContent = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Text strong style={{ fontSize: '16px' }}>
          Thông báo
        </Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabType)}
        items={[
          {
            key: 'all',
            label: 'Tất cả',
          },
          {
            key: 'unread',
            label: `Chưa đọc ${unreadCount > 0 ? `(${unreadCount})` : ''}`,
          },
          {
            key: 'read',
            label: 'Đã đọc',
          },
        ]}
        style={{ marginTop: '8px' }}
      />

      <div className="notification-list-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="Không có thông báo"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '20px' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Popover
        content={dropdownContent}
        trigger="click"
        placement="bottomRight"
        overlayClassName="notification-popover-overlay"
        onOpenChange={(open) => {
          if (open) {
            loadNotifications();
            loadUnreadCount();
          }
        }}
        overlayStyle={{ padding: 0 }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '18px', color: unreadCount > 0 ? '#ff4d4f' : '#8c8c8c' }} />}
            className={className}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Badge>
      </Popover>

      <Modal
        title="Chi tiết thông báo"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedNotification(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalOpen(false);
            setSelectedNotification(null);
          }}>
            Đóng
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: '600px' }}
      >
        {selectedNotification && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tiêu đề">
              <Text strong>{selectedNotification.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              {selectedNotification.content}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Text style={{ color: getNotificationTypeColor(selectedNotification.type) }}>
                {selectedNotification.type}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedNotification.isRead ? (
                <Text type="success">Đã đọc</Text>
              ) : (
                <Text type="warning">Chưa đọc</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {formatDateTimeVN(selectedNotification.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default NotificationDropdown;

