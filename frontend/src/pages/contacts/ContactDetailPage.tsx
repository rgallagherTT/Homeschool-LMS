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
  message,
  Timeline,
  Typography,
  Row,
  Col,
  Spin,
  Table,
  Tag,
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
import { Contact, Activity, Deal, Account, ActivityType, DealStage } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

const activityIcons: Record<ActivityType, React.ReactNode> = {
  call: <PhoneOutlined style={{ color: '#52c41a' }} />,
  email: <MailOutlined style={{ color: '#1890ff' }} />,
  meeting: <CalendarOutlined style={{ color: '#722ed1' }} />,
  task: <CheckSquareOutlined style={{ color: '#fa8c16' }} />,
  note: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
};

const stageColors: Record<DealStage, string> = {
  prospecting: 'blue',
  qualification: 'cyan',
  proposal: 'orange',
  negotiation: 'gold',
  closed_won: 'green',
  closed_lost: 'red',
};

function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchContact = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contacts/${id}`);
      setContact(response.data);
    } catch {
      message.error('Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/activities', {
        params: { contact_id: id, limit: 20 },
      });
      setActivities(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  const fetchDeals = useCallback(async () => {
    try {
      const response = await api.get('/deals', {
        params: { contact_id: id, limit: 50 },
      });
      setDeals(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/accounts', { params: { limit: 100 } });
      setAccounts(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api]);

  useEffect(() => {
    if (id) {
      fetchContact();
      fetchActivities();
      fetchDeals();
      fetchAccounts();
    }
  }, [id, fetchContact, fetchActivities, fetchDeals, fetchAccounts]);

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      await api.put(`/contacts/${id}`, values);
      message.success('Contact updated successfully');
      setEditModalOpen(false);
      fetchContact();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update contact');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (contact) {
      form.setFieldsValue({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        title: contact.title,
        department: contact.department,
        account_id: contact.account_id,
        description: contact.description,
      });
      setEditModalOpen(true);
    }
  };

  const dealColumns: ColumnsType<Deal> = [
    {
      title: 'Deal Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Deal) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `$${(val || 0).toLocaleString()}`,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: DealStage) => (
        <Tag color={stageColors[stage]}>{stage.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div>
        <PageHeader title="Contact Not Found" />
        <Button onClick={() => navigate('/contacts')}>Back to Contacts</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        subtitle={contact.title || contact.email}
        breadcrumbs={[
          { label: 'Contacts', path: '/contacts' },
          { label: `${contact.first_name} ${contact.last_name}` },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')}>
              Back
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
              Edit
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Contact Information" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ fontWeight: 500 }}>
              <Descriptions.Item label="First Name">{contact.first_name}</Descriptions.Item>
              <Descriptions.Item label="Last Name">{contact.last_name}</Descriptions.Item>
              <Descriptions.Item label="Email">{contact.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{contact.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{contact.mobile || '-'}</Descriptions.Item>
              <Descriptions.Item label="Title">{contact.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="Department">{contact.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="Account">
                {contact.account ? (
                  <a onClick={() => navigate(`/accounts/${contact.account!.id}`)}>
                    {contact.account.name}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Owner">
                {contact.owner
                  ? `${contact.owner.first_name} ${contact.owner.last_name}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {[contact.address, contact.city, contact.state, contact.country]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {contact.date_of_birth
                  ? dayjs(contact.date_of_birth).format('MMM D, YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(contact.created_at).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
            </Descriptions>
            {contact.description && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Description:</Text>
                <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{contact.description}</p>
              </div>
            )}
          </Card>

          {/* Related Deals */}
          <Card title="Related Deals">
            <Table
              columns={dealColumns}
              dataSource={deals}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No related deals' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Activity Timeline">
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
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
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
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Contact"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
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
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mobile" label="Mobile">
                <Input />
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="title" label="Title">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department">
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

export default ContactDetailPage;
