import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Select,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Badge,
  message,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Activity, ActivityType, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

const typeConfig: Record<ActivityType, { color: string; icon: React.ReactNode; label: string }> = {
  task: { color: 'blue', icon: <CheckSquareOutlined />, label: 'Task' },
  call: { color: 'green', icon: <PhoneOutlined />, label: 'Call' },
  email: { color: 'orange', icon: <MailOutlined />, label: 'Email' },
  meeting: { color: 'purple', icon: <CalendarOutlined />, label: 'Event' },
  note: { color: 'default', icon: <FileTextOutlined />, label: 'Note' },
};

const typeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Event' },
  { value: 'note', label: 'Note' },
];

const priorityColors: Record<string, string> = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const relatedToTypeOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'contact', label: 'Contact' },
  { value: 'account', label: 'Account' },
  { value: 'deal', label: 'Deal' },
  { value: 'ticket', label: 'Ticket' },
];

const completedFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

function ActivitiesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [completedFilter, setCompletedFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (typeFilter) params.type = typeFilter;
      if (completedFilter && completedFilter !== 'all') {
        params.status = completedFilter;
      }

      const response = await api.get<PaginatedResponse<Activity>>('/activities', { params });
      setActivities(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, typeFilter, completedFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleCreateActivity = async (values: any) => {
    try {
      setSubmitting(true);
      const payload: Record<string, any> = {
        type: values.type,
        subject: values.subject,
        description: values.description,
        priority: values.priority,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
        assigned_to: values.assigned_to,
      };

      // Map related_to fields to the appropriate API fields
      if (values.related_to_type && values.related_to_id) {
        payload[`${values.related_to_type}_id`] = values.related_to_id;
      }

      await api.post('/activities', payload);
      message.success('Activity created successfully');
      setModalOpen(false);
      form.resetFields();
      fetchActivities();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (activity: Activity) => {
    try {
      await api.patch(`/activities/${activity.id}/complete`);
      message.success(
        activity.status === 'completed' ? 'Activity marked as pending' : 'Activity marked as completed'
      );
      fetchActivities();
    } catch {
      message.error('Failed to update activity');
    }
  };

  const getRelatedLink = (activity: Activity): React.ReactNode => {
    if (activity.lead_id && activity.lead) {
      return (
        <a onClick={() => navigate(`/leads/${activity.lead_id}`)}>
          Lead: {activity.lead.first_name} {activity.lead.last_name}
        </a>
      );
    }
    if (activity.contact_id && activity.contact) {
      return (
        <a onClick={() => navigate(`/contacts/${activity.contact_id}`)}>
          Contact: {activity.contact.first_name} {activity.contact.last_name}
        </a>
      );
    }
    if (activity.account_id && activity.account) {
      return (
        <a onClick={() => navigate(`/accounts/${activity.account_id}`)}>
          Account: {activity.account.name}
        </a>
      );
    }
    if (activity.deal_id && activity.deal) {
      return (
        <a onClick={() => navigate(`/deals/${activity.deal_id}`)}>
          Deal: {activity.deal.name}
        </a>
      );
    }
    return '-';
  };

  const columns: ColumnsType<Activity> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ActivityType) => {
        const config = typeConfig[type] || typeConfig.note;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      sorter: true,
    },
    {
      title: 'Related To',
      key: 'related_to',
      responsive: ['md'],
      render: (_, record) => getRelatedLink(record),
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      responsive: ['lg'],
      render: (_, record) =>
        record.owner ? `${record.owner.first_name} ${record.owner.last_name}` : '-',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      responsive: ['md'],
      sorter: true,
      render: (date: string) => {
        if (!date) return '-';
        const isOverdue = dayjs(date).isBefore(dayjs(), 'day');
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined, fontWeight: isOverdue ? 500 : undefined }}>
            {dayjs(date).format('MMM D, YYYY')}
            {isOverdue && ' (Overdue)'}
          </span>
        );
      },
    },
    {
      title: 'Completed',
      key: 'completed',
      width: 100,
      render: (_, record) => (
        <Badge
          status={record.status === 'completed' ? 'success' : 'default'}
          text={
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(record);
              }}
              style={{
                color: record.status === 'completed' ? '#52c41a' : '#d9d9d9',
                padding: 0,
              }}
            >
              {record.status === 'completed' ? 'Done' : 'Pending'}
            </Button>
          }
        />
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      responsive: ['lg'],
      width: 90,
      render: (_, record: any) => {
        const priority = record.priority;
        if (!priority) return '-';
        return (
          <Tag color={priorityColors[priority] || 'default'}>
            {priority.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Activities"
        subtitle={`${total} total activities`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Activity
          </Button>
        }
      />

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by type"
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            allowClear
            style={{ width: '100%' }}
            options={typeOptions}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by status"
            value={completedFilter}
            onChange={(val) => {
              setCompletedFilter(val);
              setPage(1);
            }}
            allowClear
            style={{ width: '100%' }}
            options={completedFilterOptions}
          />
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={activities}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} activities`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      {/* New Activity Modal */}
      <Modal
        title="New Activity"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateActivity}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Activity type is required' }]}
          >
            <Select placeholder="Select type" options={typeOptions} />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Subject is required' }]}
          >
            <Input placeholder="Activity subject" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="related_to_type" label="Related To Type">
                <Select
                  placeholder="Select type"
                  allowClear
                  options={relatedToTypeOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="related_to_id" label="Related To ID">
                <Input placeholder="UUID of related record" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="due_date" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <Select placeholder="Select priority" allowClear options={priorityOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assigned_to" label="Assigned To">
            <Input placeholder="User ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ActivitiesPage;
