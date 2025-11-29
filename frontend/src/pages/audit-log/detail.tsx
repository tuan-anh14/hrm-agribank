import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Typography, Space, Alert, Spin, Button, Collapse, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAuditLogDetailAPI } from '@/services/api';
import { notifyError } from '@/utils/notification';
import type { AuditLogDetail } from '@/types/audit-log';
import { AuditModule, AuditAction, AuditStatus } from '@/types/audit-log';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const AuditLogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID nhật ký');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAuditLogDetailAPI(id);
        setData(res.data || res);
      } catch (e: any) {
        const message = e?.response?.data?.message || e?.message || 'Không thể tải chi tiết nhật ký';
        setError(message);
        notifyError(e, message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/audit-log')}>
          Quay lại
        </Button>
        <Alert type="error" showIcon message="Lỗi" description={error || 'Không tìm thấy nhật ký'} />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/audit-log')}>
          Quay lại
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Chi tiết nhật ký hệ thống
        </Title>
      </Space>

      <Card>
        <Descriptions title="Thông tin chung" bordered column={2}>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {dayjs(data.createdAt).format('DD/MM/YYYY HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="Người thực hiện">
            <Space direction="vertical" size={0}>
              <Text strong>{data.actorUsername || '-'}</Text>
              {data.actorRole && (
                <Tag color={data.actorRole === 'ADMIN' ? 'red' : data.actorRole === 'HR' ? 'blue' : 'default'}>
                  {data.actorRole}
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Module">
            <Tag color="cyan">{data.module.replace('_', ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hành động">
            <Tag color="geekblue">{data.action.replace('_', ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kết quả">
            <Tag color={data.status === AuditStatus.SUCCESS ? 'success' : 'error'}>
              {data.status === AuditStatus.SUCCESS ? 'Thành công' : 'Thất bại'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Đối tượng" span={2}>
            <Space direction="vertical" size={0}>
              <Text>{data.entityName || '-'}</Text>
              {data.entityId && <Text type="secondary">ID: {data.entityId}</Text>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {data.description || '-'}
          </Descriptions.Item>
          {data.errorMessage && (
            <Descriptions.Item label="Lỗi" span={2}>
              <Text type="danger">{data.errorMessage}</Text>
            </Descriptions.Item>
          )}
          {data.ipAddress && (
            <Descriptions.Item label="IP Address">{data.ipAddress}</Descriptions.Item>
          )}
          {data.userAgent && (
            <Descriptions.Item label="User Agent">{data.userAgent}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Collapse>
        {data.beforeData && (
          <Panel header="Dữ liệu trước khi thay đổi" key="before">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(data.beforeData, null, 2)}
            </pre>
          </Panel>
        )}
        {data.afterData && (
          <Panel header="Dữ liệu sau khi thay đổi" key="after">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(data.afterData, null, 2)}
            </pre>
          </Panel>
        )}
        {data.changedFields && (
          <Panel header="Các trường đã thay đổi" key="changed">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(data.changedFields, null, 2)}
            </pre>
          </Panel>
        )}
        {!data.beforeData && !data.afterData && !data.changedFields && (
          <Panel header="Dữ liệu thay đổi" key="empty" disabled>
            <Empty description="Không có dữ liệu thay đổi" />
          </Panel>
        )}
      </Collapse>
    </Space>
  );
};

export default AuditLogDetailPage;

