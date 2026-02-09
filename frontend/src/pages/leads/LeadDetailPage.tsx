import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Timeline,
  Typography,
  Row,
  Col,
  Spin,
  Progress,
} from 'antd';
import {
  EditOutlined,
  SwapOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Lead, Activity, LeadStatus, LeadSource, ActivityType } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

const statusColors: Record<LeadStatus, string> = {
  new: 'blue',
  contacted: 'cyan',
  qualified: 'green',
  unqualified: 'red',
  converted: 'purple',
};

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' },
];

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

const activityIcons: Record<ActivityType, React.ReactNode> = {
  call: <PhoneOutlined style={{ color: '#52c41a' }} />,
  email: <MailOutlined style={{ color: '#1890ff' }} />,
  meeting: <CalendarOutlined style={{ color: '#722ed1' }} />,
  task: <CheckSquareOutlined style={{ color: '#fa8c16' }} />,
  note: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
};

function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [form] = Form.useForm();

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leads/${id}`);
      setLead(response.data);
    } catch {
      message.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/activities', {
        params: { lead_id: id, limit: 20 },
      });
      setActivities(response.data.data || response.data);
    } catch {
      // Activities may not be available
    }
  }, [api, id]);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchActivities();
    }
  }, [id, fetchLead, fetchActivities]);

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      await api.put(`/leads/${id}`, values);
      message.success('Lead updated successfully');
      setEditModalOpen(false);
      fetchLead();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async () => {
    try {
      setConverting(true);
      const response = await api.post(`/leads/${id}/convert`);
      message.success('Lead converted successfully');
      if (response.data?.contact_id) {
        navigate(`/contacts/${response.data.contact_id}`);
      } else {
        fetchLead();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  const openEditModal = () => {
    if (lead) {
      form.setFieldsValue({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        title: lead.title,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
      });
      setEditModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div>
        <PageHeader title="Lead Not Found" />
        <Button onClick={() => navigate('/leads')}>Back to Leads</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${lead.first_name} ${lead.last_name}`}
        subtitle={lead.company || 'No company'}
        breadcrumbs={[
          { label: 'Leads', path: '/leads' },
          { label: `${lead.first_name} ${lead.last_name}` },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
              Back
            </Button>
            <Button icon={<EditOutlined />} onClick={openEditModal}>
              Edit
            </Button>
            {lead.status !== 'converted' && (
              <Popconfirm
                title="Convert this lead?"
                description="This will create a contact and optionally an account and deal."
                onConfirm={handleConvert}
                okText="Convert"
                cancelText="Cancel"
              >
                <Button type="primary" icon={<SwapOutlined />} loading={converting}>
                  Convert Lead
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Lead Information">
            <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ fontWeight: 500 }}>
              <Descriptions.Item label="First Name">{lead.first_name}</Descriptions.Item>
              <Descriptions.Item label="Last Name">{lead.last_name}</Descriptions.Item>
              <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{lead.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Company">{lead.company || '-'}</Descriptions.Item>
              <Descriptions.Item label="Title">{lead.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[lead.status]}>
                  {lead.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {lead.source?.replace('_', ' ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Score">
                <Progress
                  percent={lead.score}
                  size="small"
                  style={{ width: 120 }}
                  strokeColor={
                    lead.score >= 70 ? '#52c41a' : lead.score >= 40 ? '#faad14' : '#ff4d4f'
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="Owner">
                {lead.owner
                  ? `${lead.owner.first_name} ${lead.owner.last_name}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {[lead.address, lead.city, lead.state, lead.country]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(lead.created_at).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
            </Descriptions>
            {lead.notes && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Notes:</Text>
                <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
              </div>
            )}
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
        title="Edit Lead"
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
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="company" label="Company">
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Title">
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="source" label="Source">
                <Select options={sourceOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LeadDetailPage;
