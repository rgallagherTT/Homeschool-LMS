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
  Progress,
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
import { Lead, LeadStatus, LeadSource, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

const statusColors: Record<LeadStatus, string> = {
  new: 'blue',
  contacted: 'cyan',
  qualified: 'green',
  unqualified: 'red',
  converted: 'purple',
};

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
];

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' },
];

const ratingOptions = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

function LeadsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<PaginatedResponse<Lead>>('/leads', { params });
      setLeads(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleCreateLead = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/leads', values);
      message.success('Lead created successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchLeads();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Lead> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>
          {record.first_name} {record.last_name}
        </a>
      ),
      sorter: true,
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      responsive: ['md'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: LeadStatus) => (
        <Tag color={statusColors[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      responsive: ['lg'],
      render: (source: string) => source?.replace('_', ' '),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 70 ? '#52c41a' : score >= 40 ? '#faad14' : '#ff4d4f'}
          format={(p) => `${p}`}
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      responsive: ['xl'],
      render: (date: string) => dayjs(date).fromNow(),
      sorter: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${total} total leads`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Lead
          </Button>
        }
      />

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search leads..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            allowClear
            style={{ width: '100%' }}
            options={statusOptions}
          />
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={leads}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} leads`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      {/* New Lead Drawer */}
      <Drawer
        title="New Lead"
        width={480}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              Create Lead
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateLead}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item name="company" label="Company">
            <Input placeholder="Company name" />
          </Form.Item>

          <Form.Item name="title" label="Title">
            <Input placeholder="Job title" />
          </Form.Item>

          <Form.Item name="source" label="Source" initialValue="website">
            <Select options={sourceOptions} />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="new">
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item name="rating" label="Rating">
            <Select options={ratingOptions} placeholder="Select rating" allowClear />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default LeadsListPage;
