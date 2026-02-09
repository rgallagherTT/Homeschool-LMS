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
  InputNumber,
  DatePicker,
  Progress,
  message,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Deal, Account, Contact, Pipeline, PipelineStage, DealStage, PaginatedResponse } from '../../types';

dayjs.extend(relativeTime);

const stageColors: Record<DealStage, string> = {
  prospecting: 'blue',
  qualification: 'cyan',
  proposal: 'orange',
  negotiation: 'gold',
  closed_won: 'green',
  closed_lost: 'red',
};

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

function DealsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [form] = Form.useForm();

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<PaginatedResponse<Deal>>('/deals', { params });
      setDeals(response.data.data);
      setTotal(response.data.total);
    } catch {
      message.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, search, statusFilter]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsRes, contactsRes, pipelinesRes] = await Promise.all([
        api.get('/accounts', { params: { limit: 100 } }),
        api.get('/contacts', { params: { limit: 100 } }),
        api.get('/pipelines', { params: { limit: 50 } }),
      ]);
      setAccounts(accountsRes.data.data || accountsRes.data);
      setContacts(contactsRes.data.data || contactsRes.data);
      const pipelineData = pipelinesRes.data.data || pipelinesRes.data;
      setPipelines(pipelineData);
      if (pipelineData.length > 0 && pipelineData[0].stages) {
        setStages(pipelineData[0].stages);
      }
    } catch {
      // silently fail
    }
  }, [api]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (pipeline && pipeline.stages) {
      setStages(pipeline.stages);
      form.setFieldValue('stage_id', undefined);
    }
  };

  const handleCreateDeal = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        expected_close_date: values.expected_close_date
          ? values.expected_close_date.format('YYYY-MM-DD')
          : undefined,
      };
      await api.post('/deals', payload);
      message.success('Deal created successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchDeals();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  const getDealStatus = (deal: Deal): { label: string; color: string } => {
    if (deal.stage === 'closed_won') return { label: 'Won', color: 'green' };
    if (deal.stage === 'closed_lost') return { label: 'Lost', color: 'red' };
    return { label: 'Open', color: 'blue' };
  };

  const columns: ColumnsType<Deal> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{name}</a>
      ),
      sorter: true,
    },
    {
      title: 'Account',
      key: 'account',
      responsive: ['md'],
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
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (val ? `$${val.toLocaleString()}` : '-'),
      sorter: true,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: DealStage) => (
        <Tag color={stageColors[stage]}>{stage.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      width: 120,
      responsive: ['lg'],
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 70 ? '#52c41a' : val >= 40 ? '#faad14' : '#ff4d4f'}
          format={(p) => `${p}%`}
        />
      ),
    },
    {
      title: 'Expected Close',
      dataIndex: 'expected_close_date',
      key: 'expected_close_date',
      responsive: ['lg'],
      render: (date: string) => (date ? dayjs(date).format('MMM D, YYYY') : '-'),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      responsive: ['md'],
      render: (_, record) => {
        const status = getDealStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: 'Owner',
      key: 'owner',
      responsive: ['xl'],
      render: (_, record) =>
        record.owner ? `${record.owner.first_name} ${record.owner.last_name}` : '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${total} total deals`}
        actions={
          <Space>
            <Button icon={<AppstoreOutlined />} onClick={() => navigate('/deals/pipeline')}>
              Pipeline View
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              New Deal
            </Button>
          </Space>
        }
      />

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search deals..."
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
        dataSource={deals}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} deals`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
      />

      {/* New Deal Drawer */}
      <Drawer
        title="New Deal"
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
              Create Deal
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDeal}>
          <Form.Item
            name="name"
            label="Deal Name"
            rules={[{ required: true, message: 'Deal name is required' }]}
          >
            <Input placeholder="Deal name" />
          </Form.Item>

          <Form.Item name="pipeline_id" label="Pipeline">
            <Select
              placeholder="Select pipeline"
              allowClear
              onChange={handlePipelineChange}
              options={pipelines.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>

          <Form.Item name="stage_id" label="Stage">
            <Select
              placeholder="Select stage"
              allowClear
              options={stages
                .sort((a, b) => a.order - b.order)
                .map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>

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

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Amount">
                <InputNumber
                  placeholder="Deal amount"
                  min={0}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probability" label="Probability (%)">
                <InputNumber
                  placeholder="0-100"
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="expected_close_date" label="Expected Close Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default DealsListPage;
