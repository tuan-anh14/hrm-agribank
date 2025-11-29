import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  Space,
  Alert,
  Spin,
  Button,
  Form,
  Row,
  Col,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { EyeOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getAuditLogsAPI } from '@/services/api';
import { notifyError } from '@/utils/notification';
import type { AuditLog, QueryAuditLogParams, AuditLogListResponse } from '@/types/audit-log';
import { AuditModule, AuditAction, AuditStatus } from '@/types/audit-log';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface UseAuditLogsReturn {
  state: {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    loading: boolean;
    error: string | null;
    filters: QueryAuditLogParams;
  };
  actions: {
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setFilters: (filters: Partial<QueryAuditLogParams>) => void;
    resetFilters: () => void;
    reload: () => void;
  };
}

function useAuditLogs(initialLimit: number = 10): UseAuditLogsReturn {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<QueryAuditLogParams>({});
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const params: QueryAuditLogParams = {
        ...filters,
        page,
        limit,
      };
      const res = await getAuditLogsAPI(params);
      const response: AuditLogListResponse = res.data || res;
      setData(response.items || []);
      setTotal(response.meta?.total || 0);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const message = e?.response?.data?.message || e?.message || 'Không thể tải nhật ký hệ thống';
        setError(message);
        notifyError(e, message);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [load]);

  const updateFilters = useCallback((newFilters: Partial<QueryAuditLogParams>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters({});
  }, []);

  return {
    state: { data, total, page, limit, loading, error, filters },
    actions: { setPage, setLimit, setFilters: updateFilters, resetFilters, reload: load },
  };
}

const AuditLogPage: React.FC = () => {
  const { state, actions } = useAuditLogs(10);
  const { data, total, page, limit, loading, error, filters } = state;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const moduleOptions = useMemo(
    () =>
      Object.values(AuditModule).map((m) => ({
        label: m.replace('_', ' '),
        value: m,
      })),
    []
  );

  const actionOptions = useMemo(
    () =>
      Object.values(AuditAction).map((a) => ({
        label: a.replace('_', ' '),
        value: a,
      })),
    []
  );

  const statusOptions = useMemo(
    () =>
      Object.values(AuditStatus).map((s) => ({
        label: s === AuditStatus.SUCCESS ? 'Thành công' : 'Thất bại',
        value: s,
      })),
    []
  );

  const handleFilterSubmit = useCallback(
    (values: any) => {
      const newFilters: Partial<QueryAuditLogParams> = {};
      if (values.actorUsername) newFilters.actorUsername = values.actorUsername;
      if (values.actorRole) newFilters.actorRole = values.actorRole;
      if (values.module) newFilters.module = values.module;
      if (values.action) newFilters.action = values.action;
      if (values.entityId) newFilters.entityId = values.entityId;
      if (values.status) newFilters.status = values.status;
      if (values.dateRange && values.dateRange.length === 2) {
        newFilters.fromDate = (values.dateRange[0] as Dayjs).format('YYYY-MM-DD');
        newFilters.toDate = (values.dateRange[1] as Dayjs).format('YYYY-MM-DD');
      }
      actions.setFilters(newFilters);
    },
    [actions]
  );

  const handleReset = useCallback(() => {
    form.resetFields();
    actions.resetFilters();
  }, [form, actions]);

  useEffect(() => {
    form.setFieldsValue({
      actorUsername: filters.actorUsername,
      actorRole: filters.actorRole,
      module: filters.module,
      action: filters.action,
      entityId: filters.entityId,
      status: filters.status,
      dateRange:
        filters.fromDate && filters.toDate
          ? [dayjs(filters.fromDate), dayjs(filters.toDate)]
          : undefined,
    });
  }, [filters, form]);

  const onTableChange = useCallback(
    (pagination: TablePaginationConfig) => {
      if (pagination.current && pagination.current !== page) {
        actions.setPage(pagination.current);
      }
      if (pagination.pageSize && pagination.pageSize !== limit) {
        actions.setLimit(pagination.pageSize);
      }
    },
    [page, limit, actions]
  );

  const columns: ColumnsType<AuditLog> = useMemo(
    () => [
      {
        title: 'Thời gian',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm:ss'),
        sorter: false,
      },
      {
        title: 'Người thực hiện',
        key: 'actor',
        width: 200,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.actorUsername || '-'}</Text>
            {record.actorRole && (
              <Tag color={record.actorRole === 'ADMIN' ? 'red' : record.actorRole === 'HR' ? 'blue' : 'default'}>
                {record.actorRole}
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: 'Module',
        dataIndex: 'module',
        key: 'module',
        width: 150,
        render: (value: AuditModule) => (
          <Tag color="cyan">{value.replace('_', ' ')}</Tag>
        ),
      },
      {
        title: 'Hành động',
        dataIndex: 'action',
        key: 'action',
        width: 150,
        render: (value: AuditAction) => (
          <Tag color="geekblue">{value.replace('_', ' ')}</Tag>
        ),
      },
      {
        title: 'Đối tượng',
        key: 'entity',
        width: 200,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text>{record.entityName || '-'}</Text>
            {record.entityId && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {record.entityId.substring(0, 8)}...
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (text: string) => (
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 300 }}>
            {text || '-'}
          </Text>
        ),
      },
      {
        title: 'Kết quả',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value: AuditStatus) => (
          <Tag color={value === AuditStatus.SUCCESS ? 'success' : 'error'}>
            {value === AuditStatus.SUCCESS ? 'Thành công' : 'Thất bại'}
          </Tag>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        fixed: 'right',
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/audit-log/${record.id}`)}
            size="small"
          >
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space
        align="center"
        style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Nhật ký hệ thống
        </Title>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={actions.reload} loading={loading}>
            Làm mới
          </Button>
        </Space>
      </Space>

      <Card title={<><FilterOutlined /> Bộ lọc</>} size="small">
        <Form form={form} onFinish={handleFilterSubmit} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="dateRange" label="Khoảng thời gian">
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="actorUsername" label="Tên người dùng">
                <Input placeholder="Nhập username" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="actorRole" label="Vai trò">
                <Select placeholder="Chọn vai trò" allowClear options={[
                  { label: 'ADMIN', value: 'ADMIN' },
                  { label: 'HR', value: 'HR' },
                  { label: 'EMPLOYEE', value: 'EMPLOYEE' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="module" label="Module">
                <Select placeholder="Chọn module" allowClear options={moduleOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="action" label="Hành động">
                <Select placeholder="Chọn hành động" allowClear options={actionOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="entityId" label="ID đối tượng">
                <Input placeholder="Nhập ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select placeholder="Chọn trạng thái" allowClear options={statusOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={24} lg={24}>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
                    Lọc
                  </Button>
                  <Button onClick={handleReset}>Đặt lại</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {error && (
        <Alert type="error" showIcon message="Lỗi khi tải nhật ký hệ thống" description={error} />
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <Table<AuditLog>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={{ spinning: loading, indicator: <Spin /> }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}-${range[1]} của ${t}`,
            responsive: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={onTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {!loading && !error && data.length === 0 && (
        <Text type="secondary">Không tìm thấy nhật ký nào</Text>
      )}
    </Space>
  );
};

export default AuditLogPage;
