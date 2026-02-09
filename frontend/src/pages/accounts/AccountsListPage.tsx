import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Drawer,
  Form,
  Space,
  InputNumber,
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
import { Account, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

const industryOptions = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Other', label: 'Other' },
];

function AccountsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (search) params.search = search;
      if (industryFilter) params.industry = industryFilter;

      const response = await api.get<PaginatedResponse<Account>>('/accounts', { params });
      setAccounts(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, search, industryFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleCreateAccount = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/accounts', values);
      message.success('Account created successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchAccounts();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Account> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={() => navigate(`/accounts/${record.id}`)}>{name}</a>
      ),
      sorter: true,
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      responsive: ['md'],
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      responsive: ['lg'],
      render: (url: string) =>
        url ? (
          <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Employees',
      dataIndex: 'employees',
      key: 'employees',
      responsive: ['lg'],
      render: (val: number) => (val ? val.toLocaleString() : '-'),
    },
    {
      title: 'Annual Revenue ($)',
      dataIndex: 'annual_revenue',
      key: 'annual_revenue',
      responsive: ['xl'],
      render: (val: number) => (val ? `$${val.toLocaleString()}` : '-'),
      sorter: true,
    },
    {
      title: 'Owner',
      key: 'owner',
      responsive: ['lg'],
      render: (_, record) =>
        record.owner ? `${record.owner.first_name} ${record.owner.last_name}` : '-',
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
        title="Accounts"
        subtitle={`${total} total accounts`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Account
          </Button>
        }
      />

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search accounts..."
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
            placeholder="Filter by industry"
            value={industryFilter}
            onChange={(val) => {
              setIndustryFilter(val);
              setPage(1);
            }}
            allowClear
            style={{ width: '100%' }}
            options={industryOptions}
          />
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} accounts`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      {/* New Account Drawer */}
      <Drawer
        title="New Account"
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
              Create Account
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAccount}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Account name is required' }]}
          >
            <Input placeholder="Account name" />
          </Form.Item>

          <Form.Item name="website" label="Website">
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item name="industry" label="Industry">
            <Select placeholder="Select industry" allowClear options={industryOptions} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="employees" label="Employees">
                <InputNumber
                  placeholder="Employee count"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="annual_revenue" label="Annual Revenue">
                <InputNumber
                  placeholder="Annual revenue"
                  min={0}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Billing Address">
            <Input.TextArea rows={3} placeholder="Billing address" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default AccountsListPage;
