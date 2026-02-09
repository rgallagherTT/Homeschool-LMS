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
  InputNumber,
  DatePicker,
  Steps,
  Timeline,
  Typography,
  Row,
  Col,
  Spin,
  Progress,
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
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Deal, Activity, Account, Contact, Pipeline, PipelineStage, DealStage, ActivityType } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

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

const defaultStageNames = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/deals/${id}`);
      setDeal(response.data);
    } catch {
      message.error('Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/activities', {
        params: { deal_id: id, limit: 20 },
      });
      setActivities(response.data.data || response.data);
    } catch {
      // silently fail
    }
  }, [api, id]);

  const fetchPipelineStages = useCallback(async () => {
    try {
      const response = await api.get('/pipelines', { params: { limit: 50 } });
      const pipelineData = response.data.data || response.data;
      setPipelines(pipelineData);
      if (pipelineData.length > 0 && pipelineData[0].stages) {
        setPipelineStages(pipelineData[0].stages.sort((a: PipelineStage, b: PipelineStage) => a.order - b.order));
      }
    } catch {
      // silently fail
    }
  }, [api]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsRes, contactsRes] = await Promise.all([
        api.get('/accounts', { params: { limit: 100 } }),
        api.get('/contacts', { params: { limit: 100 } }),
      ]);
      setAccounts(accountsRes.data.data || accountsRes.data);
      setContacts(contactsRes.data.data || contactsRes.data);
    } catch {
      // silently fail
    }
  }, [api]);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchActivities();
      fetchPipelineStages();
      fetchDropdownData();
    }
  }, [id, fetchDeal, fetchActivities, fetchPipelineStages, fetchDropdownData]);

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        expected_close_date: values.expected_close_date
          ? values.expected_close_date.format('YYYY-MM-DD')
          : undefined,
      };
      await api.put(`/deals/${id}`, payload);
      message.success('Deal updated successfully');
      setEditModalOpen(false);
      fetchDeal();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update deal');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (deal) {
      form.setFieldsValue({
        name: deal.name,
        amount: deal.amount,
        stage: deal.stage,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date ? dayjs(deal.expected_close_date) : undefined,
        account_id: deal.account_id,
        contact_id: deal.contact_id,
        description: deal.description,
        loss_reason: deal.loss_reason,
      });
      setEditModalOpen(true);
    }
  };

  const getCurrentStageIndex = (): number => {
    if (!deal) return 0;
    if (pipelineStages.length > 0 && deal.pipeline_stage_id) {
      const idx = pipelineStages.findIndex((s) => s.id === deal.pipeline_stage_id);
      return idx >= 0 ? idx : 0;
    }
    // Fallback: match by deal.stage name
    const stageNameMap: Record<string, number> = {};
    defaultStageNames.forEach((name, i) => {
      stageNameMap[name.toLowerCase().replace(/\s+/g, '_')] = i;
    });
    return stageNameMap[deal.stage] ?? 0;
  };

  const getStageStatus = (index: number, currentIndex: number): 'finish' | 'process' | 'wait' | 'error' => {
    if (!deal) return 'wait';
    if (deal.stage === 'closed_lost' && index === currentIndex) return 'error';
    if (index < currentIndex) return 'finish';
    if (index === currentIndex) return 'process';
    return 'wait';
  };

  const getDealStatus = (): { label: string; color: string } => {
    if (!deal) return { label: 'Unknown', color: 'default' };
    if (deal.stage === 'closed_won') return { label: 'Won', color: 'green' };
    if (deal.stage === 'closed_lost') return { label: 'Lost', color: 'red' };
    return { label: 'Open', color: 'blue' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div>
        <PageHeader title="Deal Not Found" />
        <Button onClick={() => navigate('/deals')}>Back to Deals</Button>
      </div>
    );
  }

  const stageItems = pipelineStages.length > 0
    ? pipelineStages.map((s) => ({ title: s.name }))
    : defaultStageNames.map((name) => ({ title: name }));

  const currentStageIndex = getCurrentStageIndex();
  const dealStatus = getDealStatus();

  return (
    <div>
      <PageHeader
        title={deal.name}
        subtitle={deal.account?.name || 'No account'}
        breadcrumbs={[
          { label: 'Deals', path: '/deals' },
          { label: deal.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
              Back
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
              Edit
            </Button>
          </Space>
        }
      />

      {/* Stage Progress */}
      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={currentStageIndex}
          items={stageItems.map((item, index) => ({
            ...item,
            status: getStageStatus(index, currentStageIndex),
          }))}
          size="small"
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions
              title="Deal Information"
              column={{ xs: 1, sm: 2 }}
              labelStyle={{ fontWeight: 500 }}
            >
              <Descriptions.Item label="Deal Name">{deal.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={dealStatus.color}>{dealStatus.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Stage">
                <Tag color={stageColors[deal.stage]}>
                  {deal.stage.replace(/_/g, ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Space>
                  <DollarOutlined />
                  <Text strong style={{ fontSize: 16 }}>
                    {deal.amount ? `$${deal.amount.toLocaleString()}` : '-'}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Probability">
                <Progress
                  percent={deal.probability}
                  size="small"
                  style={{ width: 120 }}
                  strokeColor={
                    deal.probability >= 70
                      ? '#52c41a'
                      : deal.probability >= 40
                        ? '#faad14'
                        : '#ff4d4f'
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {deal.account ? (
                  <a onClick={() => navigate(`/accounts/${deal.account!.id}`)}>
                    {deal.account.name}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {deal.contact ? (
                  <a onClick={() => navigate(`/contacts/${deal.contact!.id}`)}>
                    {deal.contact.first_name} {deal.contact.last_name}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Owner">
                {deal.owner
                  ? `${deal.owner.first_name} ${deal.owner.last_name}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Close Date">
                {deal.expected_close_date
                  ? dayjs(deal.expected_close_date).format('MMM D, YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Actual Close Date">
                {deal.actual_close_date
                  ? dayjs(deal.actual_close_date).format('MMM D, YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(deal.created_at).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {dayjs(deal.updated_at).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
            </Descriptions>
            {deal.description && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Description:</Text>
                <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{deal.description}</p>
              </div>
            )}
            {deal.loss_reason && (
              <div style={{ marginTop: 16 }}>
                <Text strong type="danger">Loss Reason:</Text>
                <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{deal.loss_reason}</p>
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
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Deal"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="Deal Name"
            rules={[{ required: true, message: 'Deal name is required' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Amount">
                <InputNumber
                  min={0}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probability" label="Probability (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="stage" label="Stage">
                <Select
                  options={[
                    { value: 'prospecting', label: 'Prospecting' },
                    { value: 'qualification', label: 'Qualification' },
                    { value: 'proposal', label: 'Proposal' },
                    { value: 'negotiation', label: 'Negotiation' },
                    { value: 'closed_won', label: 'Closed Won' },
                    { value: 'closed_lost', label: 'Closed Lost' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_close_date" label="Expected Close Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item name="contact_id" label="Contact">
                <Select
                  placeholder="Select contact"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={contacts.map((c) => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="loss_reason" label="Loss Reason">
            <Input.TextArea rows={2} placeholder="If applicable" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DealDetailPage;
