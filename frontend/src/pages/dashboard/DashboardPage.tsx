import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, message } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  FundProjectionScreenOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/dashboard/StatsCard';
import PipelineChart from '../../components/dashboard/PipelineChart';
import RecentActivities from '../../components/dashboard/RecentActivities';
import { useApi } from '../../hooks/useApi';
import { DashboardStats, Activity } from '../../types';

interface PipelineSummaryItem {
  stage: string;
  amount: number;
  count: number;
}

function DashboardPage() {
  const api = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineSummaryItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch {
      message.error('Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  }, [api]);

  const fetchPipeline = useCallback(async () => {
    try {
      setPipelineLoading(true);
      const response = await api.get('/dashboard/pipeline-summary');
      setPipelineData(response.data);
    } catch {
      message.error('Failed to load pipeline data');
    } finally {
      setPipelineLoading(false);
    }
  }, [api]);

  const fetchActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      const response = await api.get('/dashboard/recent-activities');
      setActivities(response.data);
    } catch {
      message.error('Failed to load recent activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStats();
    fetchPipeline();
    fetchActivities();
  }, [fetchStats, fetchPipeline, fetchActivities]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's an overview of your CRM." />

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Leads"
            value={stats?.totalLeads ?? 0}
            icon={<TeamOutlined />}
            change={stats?.leadsChange}
            color="#1890ff"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Open Deals"
            value={stats?.openDeals ?? 0}
            icon={<FundProjectionScreenOutlined />}
            change={stats?.dealsChange}
            color="#52c41a"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Pipeline Value"
            value={formatCurrency(stats?.pipelineValue ?? 0)}
            icon={<DollarOutlined />}
            prefix="$"
            change={stats?.pipelineChange}
            color="#722ed1"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Open Tickets"
            value={stats?.openTickets ?? 0}
            icon={<CustomerServiceOutlined />}
            change={stats?.ticketsChange}
            color="#fa8c16"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Pipeline Summary"
            className="dashboard-chart-card"
            loading={pipelineLoading}
          >
            <PipelineChart data={pipelineData} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Recent Activities"
            className="dashboard-chart-card"
            loading={activitiesLoading}
            bodyStyle={{ maxHeight: 380, overflowY: 'auto' }}
          >
            <RecentActivities activities={activities} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
