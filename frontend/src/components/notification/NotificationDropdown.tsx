import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Popover, Tabs, List, Empty, Button, Spin, Modal, Descriptions, Typography, Pagination } from 'antd';
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10); // 10 items per page
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load notifications based on active tab
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let response: any;
      if (activeTab === 'unread') {
        response = await getUnreadNotificationsAPI({ page, limit });
      } else {
        const params = activeTab === 'read' ? { isRead: 'true', page, limit } : { page, limit };
        response = await getAllNotificationsAPI(params);
      }
      
      // Axios interceptor returns response.data, so response is already the data object
      // Response structure: { data: Notification[], total, page, limit, totalPages }
      if (response && response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
        setTotal(response.total || 0);
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        setNotifications(response);
        setTotal(response.length);
      } else {
        setNotifications([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit]);

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

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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
    // Giữ popover mở khi mở modal
    setPopoverOpen(true);

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
      >
        <List.Item.Meta
          title={
            <div className="notification-item-title">
              <Text strong={isUnread} className="notification-title-text">
                {notification.title}
              </Text>
              <Text type="secondary" className="notification-time">
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </div>
          }
          description={
            <div className="notification-item-content">
              <Text type="secondary" className="notification-content-text">
                {notification.content}
              </Text>
              <div className="notification-type-badge">
                <Text
                  className="notification-type-text"
                  style={{
                    color: getNotificationTypeColor(notification.type),
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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

      <div className="notification-tabs-wrapper">
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
          className="notification-tabs"
        />
      </div>

      <div className="notification-list-container">
        {loading ? (
          <div className="notification-loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="Không có thông báo"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="notification-empty"
          />
        ) : (
          <>
            <List
              dataSource={notifications}
              renderItem={renderNotificationItem}
              className="notification-list"
            />
            {total > limit && (
              <div className="notification-pagination">
                <Pagination
                  current={page}
                  total={total}
                  pageSize={limit}
                  onChange={handlePageChange}
                  size="small"
                  showSizeChanger={false}
                  showQuickJumper={false}
                  showTotal={(total, range) => `${range[0]}-${range[1]} của ${total}`}
                />
              </div>
            )}
          </>
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
        open={popoverOpen}
        onOpenChange={(open) => {
          // Nếu modal đang mở, không cho phép đóng popover
          if (detailModalOpen) {
            return;
          }
          
          setPopoverOpen(open);
          
          if (open) {
            setPage(1); // Reset to first page when opening
            loadNotifications();
            loadUnreadCount();
          }
        }}
        overlayStyle={{ padding: 0 }}
        align={{
          offset: [0, 8],
        }}
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
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
          // Giữ popover mở khi đóng modal
          setPopoverOpen(true);
        }}
        maskClosable={true}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalOpen(false);
            setSelectedNotification(null);
            // Giữ popover mở khi đóng modal
            setPopoverOpen(true);
          }}>
            Đóng
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: '600px' }}
        className="notification-detail-modal"
        zIndex={1050}
        getContainer={false}
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

