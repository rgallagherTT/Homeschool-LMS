import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Drawer,
  Form,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Ticket, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

const statusColors: Record<string, string> = {
  open: 'blue',
  in_progress: 'orange',
  waiting_on_customer: 'gold',
  waiting_on_third_party: 'gold',
  resolved: 'green',
  closed: 'default',
};

const priorityColors: Record<string, string> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'green',
};

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_customer', label: 'Waiting on Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const categoryOptions = [
  { value: 'billing', label: 'Billing' },
  { value: 'technical_support', label: 'Technical Support' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'account_management', label: 'Account Management' },
  { value: 'general_inquiry', label: 'General Inquiry' },
];

const channelOptions = [
  { value: 'web', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'chat', label: 'Chat' },
  { value: 'social', label: 'Social' },
];

function TicketsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get<PaginatedResponse<Ticket>>('/tickets', { params });
      setTickets(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleCreateTicket = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/tickets', values);
      message.success('Ticket created successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchTickets();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 120,
      render: (num: string, record) => (
        <a onClick={() => navigate(`/tickets/${record.id}`)}>{num}</a>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (subject: string, record) => (
        <a onClick={() => navigate(`/tickets/${record.id}`)}>{subject}</a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      responsive: ['lg'] as any,
      render: (cat: string) => cat?.replace(/_/g, ' '),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      responsive: ['xl'] as any,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      responsive: ['md'] as any,
      render: (date: string) => dayjs(date).fromNow(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle={`${total} total tickets`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Ticket
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search tickets..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            allowClear
            style={{ width: '100%' }}
            options={statusOptions}
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Priority"
            value={priorityFilter}
            onChange={(val) => { setPriorityFilter(val); setPage(1); }}
            allowClear
            style={{ width: '100%' }}
            options={priorityOptions}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} tickets`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      <Drawer
        title="New Ticket"
        width={480}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              Create Ticket
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Ticket subject" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Describe the issue..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select options={priorityOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select options={categoryOptions} placeholder="Select category" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="channel" label="Channel" initialValue="web">
            <Select options={channelOptions} />
          </Form.Item>

          <Form.Item name="contact_id" label="Contact ID">
            <Input placeholder="Contact UUID (optional)" />
          </Form.Item>

          <Form.Item name="account_id" label="Account ID">
            <Input placeholder="Account UUID (optional)" />
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Add tags" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default TicketsListPage;
