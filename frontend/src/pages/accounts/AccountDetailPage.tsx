import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tabs,
  Table,
  Tag,
  Timeline,
  Typography,
  Row,
  Col,
  Spin,
  message,
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Account, Contact, Deal, Activity, DealStage, ActivityType } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

const industryOptions = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Other', label: 'Other' },
];

const stageColors: Record<DealStage, string> = {
  prospecting: 'blue',
  qualification: 'cyan',
  proposal: 'orange',
  negotiation: 'gold',
  closed_won: 'green',
  closed_lost: 'red',
};

const activityIcons: Record<ActivityType, React.ReactNode> = {
  call: <PhoneOutlined style={{ color: '#52c41a' }} />,
  email: <MailOutlined style={{ color: '#1890ff' }} />,
  meeting: <CalendarOutlined style={{ color: '#722ed1' }} />,
  task: <CheckSquareOutlined style={{ color: '#fa8c16' }} />,
  note: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
};

function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounts/${id}`);
      setAccount(response.data);
    } catch {
      message.error('Failed to load account');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await api.get(`/accounts/${id}/contacts`);
      setContacts(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  const fetchDeals = useCallback(async () => {
    try {
      const response = await api.get('/deals', {
        params: { account_id: id, limit: 50 },
      });
      setDeals(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/activities', {
        params: { account_id: id, limit: 20 },
      });
      setActivities(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  useEffect(() => {
    if (id) {
      fetchAccount();
      fetchContacts();
      fetchDeals();
      fetchActivities();
    }
  }, [id, fetchAccount, fetchContacts, fetchDeals, fetchActivities]);

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      await api.put(`/accounts/${id}`, values);
      message.success('Account updated successfully');
      setEditModalOpen(false);
      fetchAccount();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (account) {
      form.setFieldsValue({
        name: account.name,
        website: account.website,
        industry: account.industry,
        phone: account.phone,
        email: account.email,
        employees: account.employees,
        annual_revenue: account.annual_revenue,
        type: account.type,
        address: account.address,
        city: account.city,
        state: account.state,
        country: account.country,
        zip_code: account.zip_code,
        description: account.description,
      });
      setEditModalOpen(true);
    }
  };

  const contactColumns: ColumnsType<Contact> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/contacts/${record.id}`)}>
          {record.first_name} {record.last_name}
        </a>
      ),
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
      render: (val: string) => val || '-',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (val: string) => val || '-',
    },
  ];

  const dealColumns: ColumnsType<Deal> = [
    {
      title: 'Deal Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (val ? `$${val.toLocaleString()}` : '-'),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: DealStage) => (
        <Tag color={stageColors[stage]}>{stage.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Expected Close',
      dataIndex: 'expected_close_date',
      key: 'expected_close_date',
      render: (date: string) => (date ? dayjs(date).format('MMM D, YYYY') : '-'),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!account) {
    return (
      <div>
        <PageHeader title="Account Not Found" />
        <Button onClick={() => navigate('/accounts')}>Back to Accounts</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={account.name}
        subtitle={account.industry || 'No industry'}
        breadcrumbs={[
          { label: 'Accounts', path: '/accounts' },
          { label: account.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/accounts')}>
              Back
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
              Edit
            </Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title="Account Information"
          column={{ xs: 1, sm: 2, lg: 3 }}
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Name">{account.name}</Descriptions.Item>
          <Descriptions.Item label="Type">
            {account.type ? account.type.replace('_', ' ').toUpperCase() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Industry">{account.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label="Website">
            {account.website ? (
              <a
                href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {account.website}
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">{account.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{account.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Employees">
            {account.employees ? account.employees.toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Annual Revenue">
            {account.annual_revenue ? `$${account.annual_revenue.toLocaleString()}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            {account.owner
              ? `${account.owner.first_name} ${account.owner.last_name}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">
            {[account.address, account.city, account.state, account.country, account.zip_code]
              .filter(Boolean)
              .join(', ') || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(account.created_at).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {dayjs(account.updated_at).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
        </Descriptions>
        {account.description && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Description:</Text>
            <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{account.description}</p>
          </div>
        )}
      </Card>

      <Tabs
        defaultActiveKey="contacts"
        items={[
          {
            key: 'contacts',
            label: `Contacts (${contacts.length})`,
            children: (
              <Table
                columns={contactColumns}
                dataSource={contacts}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'No contacts for this account' }}
              />
            ),
          },
          {
            key: 'deals',
            label: `Deals (${deals.length})`,
            children: (
              <Table
                columns={dealColumns}
                dataSource={deals}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'No deals for this account' }}
              />
            ),
          },
          {
            key: 'activities',
            label: `Activities (${activities.length})`,
            children: (
              <Card>
                {activities.length > 0 ? (
                  <Timeline
                    items={activities.map((a) => ({
                      key: a.id,
                      dot: activityIcons[a.type] || activityIcons.note,
                      children: (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>
                            {a.subject}
                          </Text>
                          {a.description && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 12, display: 'block', marginTop: 2 }}
                            >
                              {a.description.length > 100
                                ? `${a.description.substring(0, 100)}...`
                                : a.description}
                            </Text>
                          )}
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                          >
                            {dayjs(a.created_at).fromNow()}
                          </Text>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Text type="secondary">No activities yet</Text>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Edit Modal */}
      <Modal
        title="Edit Account"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Account name is required' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Select
                  options={[
                    { value: 'customer', label: 'Customer' },
                    { value: 'prospect', label: 'Prospect' },
                    { value: 'partner', label: 'Partner' },
                    { value: 'vendor', label: 'Vendor' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="Industry">
                <Select allowClear options={industryOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="website" label="Website">
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="employees" label="Employees">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="annual_revenue" label="Annual Revenue">
                <InputNumber
                  min={0}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="zip_code" label="Zip Code">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AccountDetailPage;
