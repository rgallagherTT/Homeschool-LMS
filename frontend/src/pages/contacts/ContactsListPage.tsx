import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Drawer,
  Form,
  Space,
  message,
  Row,
  Col,
  Select,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Contact, Account, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

function ContactsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: pageSize };
      if (search) params.search = search;

      const response = await api.get<PaginatedResponse<Contact>>('/contacts', { params });
      setContacts(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, search]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/accounts', { params: { limit: 100 } });
      setAccounts(response.data.data || response.data);
    } catch {
      // silently fail for account list
    }
  }, [api]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleCreateContact = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/contacts', values);
      message.success('Contact created successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchContacts();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create contact');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Contact> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/contacts/${record.id}`)}>
          {record.first_name} {record.last_name}
        </a>
      ),
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Account',
      key: 'account',
      responsive: ['lg'],
      render: (_, record) =>
        record.account ? (
          <a onClick={() => navigate(`/accounts/${record.account!.id}`)}>
            {record.account.name}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      responsive: ['lg'],
      render: (val: string) => val || '-',
    },
    {
      title: 'Owner',
      key: 'owner',
      responsive: ['xl'],
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
        title="Contacts"
        subtitle={`${total} total contacts`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Contact
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search contacts..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={contacts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} contacts`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      <Drawer
        title="New Contact"
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
              Create Contact
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateContact}>
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

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mobile" label="Mobile">
                <Input placeholder="Mobile number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="account_id" label="Account">
            <Select
              placeholder="Select account"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          </Form.Item>

          <Form.Item name="title" label="Title">
            <Input placeholder="Job title" />
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Input placeholder="Department" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default ContactsListPage;
