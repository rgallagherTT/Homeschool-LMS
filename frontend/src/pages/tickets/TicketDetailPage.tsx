import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Input,
  Switch,
  List,
  Avatar,
  Badge,
  Typography,
  Divider,
  Select,
  Modal,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Ticket } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  contact_id: string | null;
  body: string;
  is_internal: boolean;
  attachments: any[];
  created_at: string;
}

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

function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketRes, commentsRes] = await Promise.all([
        api.get<Ticket>(`/tickets/${id}`),
        api.get<TicketComment[]>(`/tickets/${id}/comments`),
      ]);
      setTicket(ticketRes.data);
      setComments(commentsRes.data);
    } catch {
      message.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;
    try {
      setSubmittingComment(true);
      await api.post(`/tickets/${id}/comments`, {
        body: commentBody,
        is_internal: isInternal,
      });
      message.success('Comment added');
      setCommentBody('');
      setIsInternal(false);
      fetchTicket();
    } catch {
      message.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateTicket = async (values: any) => {
    try {
      await api.put(`/tickets/${id}`, values);
      message.success('Ticket updated');
      setEditModalOpen(false);
      fetchTicket();
    } catch {
      message.error('Failed to update ticket');
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={`${ticket.ticket_number}: ${ticket.subject}`}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                editForm.setFieldsValue(ticket);
                setEditModalOpen(true);
              }}
            >
              Edit
            </Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="Ticket #">{ticket.ticket_number}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[ticket.status]}>
              {ticket.status.replace(/_/g, ' ').toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={priorityColors[ticket.priority]}>
              {ticket.priority.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            {ticket.category?.replace(/_/g, ' ') || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Channel">{ticket.channel || '-'}</Descriptions.Item>
          <Descriptions.Item label="Contact ID">{ticket.contact_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="Account ID">{ticket.account_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="Assigned To">{ticket.assigned_to || '-'}</Descriptions.Item>
          <Descriptions.Item label="SLA Due">
            {ticket.sla_due_at ? dayjs(ticket.sla_due_at).format('MMM D, YYYY h:mm A') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(ticket.created_at).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="Resolved">
            {ticket.resolved_at ? dayjs(ticket.resolved_at).format('MMM D, YYYY h:mm A') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Satisfaction">
            {ticket.satisfaction_rating ? `${ticket.satisfaction_rating}/5` : '-'}
          </Descriptions.Item>
        </Descriptions>
        {ticket.description && (
          <>
            <Divider orientation="left">Description</Divider>
            <Text>{ticket.description}</Text>
          </>
        )}
        {ticket.tags && ticket.tags.length > 0 && (
          <>
            <Divider orientation="left">Tags</Divider>
            <Space>
              {ticket.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </>
        )}
      </Card>

      {/* Comments Section */}
      <Card title={`Comments (${comments.length})`} style={{ marginBottom: 24 }}>
        <List
          dataSource={comments}
          locale={{ emptyText: 'No comments yet' }}
          renderItem={(comment) => (
            <List.Item
              style={{
                background: comment.is_internal ? '#fffbe6' : 'transparent',
                padding: '12px 16px',
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={comment.is_internal ? <LockOutlined /> : <UserOutlined />} />
                }
                title={
                  <Space>
                    <Text strong>{comment.user_id ? 'Agent' : 'Customer'}</Text>
                    {comment.is_internal && (
                      <Badge
                        count="Internal"
                        style={{ backgroundColor: '#faad14', fontSize: 10 }}
                      />
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(comment.created_at).fromNow()}
                    </Text>
                  </Space>
                }
                description={<Text>{comment.body}</Text>}
              />
            </List.Item>
          )}
        />

        <Divider />

        <div>
          <Input.TextArea
            rows={3}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Write a comment..."
            style={{ marginBottom: 12 }}
          />
          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Switch
                checked={isInternal}
                onChange={setIsInternal}
                size="small"
              />
              <Text type="secondary">Internal Note</Text>
            </Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submittingComment}
              onClick={handleAddComment}
              disabled={!commentBody.trim()}
            >
              Add Comment
            </Button>
          </Space>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Ticket"
        open={editModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => setEditModalOpen(false)}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateTicket}>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </Form.Item>
          <Form.Item name="assigned_to" label="Assigned To">
            <Input placeholder="User UUID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TicketDetailPage;
