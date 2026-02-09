import { useState, useEffect, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Spin, message, Space } from 'antd';
import { ArrowLeftOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { Deal, Pipeline, PipelineStage } from '../../types';

const { Text } = Typography;

const defaultColumns = [
  { id: 'prospecting', name: 'Prospecting', order: 1 },
  { id: 'qualification', name: 'Qualification', order: 2 },
  { id: 'needs_analysis', name: 'Needs Analysis', order: 3 },
  { id: 'proposal', name: 'Proposal', order: 4 },
  { id: 'negotiation', name: 'Negotiation', order: 5 },
  { id: 'closed_won', name: 'Closed Won', order: 6 },
  { id: 'closed_lost', name: 'Closed Lost', order: 7 },
];

const stageHeaderColors: Record<string, string> = {
  prospecting: '#1890ff',
  qualification: '#13c2c2',
  needs_analysis: '#2f54eb',
  proposal: '#fa8c16',
  negotiation: '#faad14',
  closed_won: '#52c41a',
  closed_lost: '#ff4d4f',
};

function DealsPipelinePage() {
  const api = useApi();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<(PipelineStage | { id: string; name: string; order: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const response = await api.get('/pipelines', { params: { limit: 50 } });
      const pipelineData: Pipeline[] = response.data.data || response.data;
      if (pipelineData.length > 0 && pipelineData[0].stages && pipelineData[0].stages.length > 0) {
        setStages(pipelineData[0].stages.sort((a, b) => a.order - b.order));
      } else {
        setStages(defaultColumns);
      }
    } catch {
      setStages(defaultColumns);
    }
  }, [api]);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/deals', { params: { limit: 200 } });
      const dealData = response.data.data || response.data;
      setDeals(dealData);
    } catch {
      message.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPipeline();
    fetchDeals();
  }, [fetchPipeline, fetchDeals]);

  const getDealsForStage = (stageId: string): Deal[] => {
    return deals.filter((deal) => {
      // Match by pipeline_stage_id first
      if (deal.pipeline_stage_id === stageId) return true;
      // Fallback: match by deal.stage name
      const stageName = stages.find((s) => s.id === stageId)?.name?.toLowerCase().replace(/\s+/g, '_');
      return deal.stage === stageName || deal.stage === stageId;
    });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (!dealId) return;

    // Optimistically update the UI
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              pipeline_stage_id: stageId,
              stage: (stages.find((s) => s.id === stageId)?.name?.toLowerCase().replace(/\s+/g, '_') || d.stage) as Deal['stage'],
            }
          : d
      )
    );

    try {
      await api.patch(`/deals/${dealId}/stage`, { stage_id: stageId });
      message.success('Deal stage updated');
    } catch {
      message.error('Failed to update deal stage');
      // Revert by re-fetching
      fetchDeals();
    }

    setDraggedDealId(null);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const getTotalValue = (stageDeals: Deal[]): string => {
    const total = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    return `$${total.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipeline View"
        subtitle={`${deals.length} deals in pipeline`}
        actions={
          <Space>
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/deals')}>
              List View
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
              Back to Deals
            </Button>
          </Space>
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        {stages.map((stage) => {
          const stageDeals = getDealsForStage(stage.id);
          const isOver = dragOverStage === stage.id;
          const headerColor =
            stageHeaderColors[stage.name.toLowerCase().replace(/\s+/g, '_')] ||
            stageHeaderColors[stage.id] ||
            '#8c8c8c';

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{
                minWidth: 260,
                maxWidth: 300,
                flex: '1 0 260px',
                backgroundColor: isOver ? '#e6f7ff' : '#f5f5f5',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                transition: 'background-color 0.2s',
                border: isOver ? '2px dashed #1890ff' : '2px solid transparent',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `3px solid ${headerColor}`,
                  borderRadius: '8px 8px 0 0',
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 14 }}>{stage.name}</Text>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      backgroundColor: '#fff',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {stageDeals.length}
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {getTotalValue(stageDeals)}
                </Text>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  padding: 8,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 6,
                      padding: '12px 14px',
                      cursor: 'grab',
                      boxShadow: draggedDealId === deal.id
                        ? '0 4px 12px rgba(0,0,0,0.15)'
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      opacity: draggedDealId === deal.id ? 0.5 : 1,
                      transition: 'box-shadow 0.2s, opacity 0.2s',
                      borderLeft: `3px solid ${headerColor}`,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        display: 'block',
                        marginBottom: 6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {deal.name}
                    </Text>
                    {deal.amount > 0 && (
                      <Text style={{ fontSize: 14, color: '#52c41a', display: 'block', marginBottom: 4 }}>
                        ${deal.amount.toLocaleString()}
                      </Text>
                    )}
                    {deal.account && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                        {deal.account.name}
                      </Text>
                    )}
                    {deal.expected_close_date && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block',
                          color: dayjs(deal.expected_close_date).isBefore(dayjs())
                            ? '#ff4d4f'
                            : undefined,
                        }}
                      >
                        Close: {dayjs(deal.expected_close_date).format('MMM D, YYYY')}
                      </Text>
                    )}
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#bfbfbf',
                      fontSize: 13,
                    }}
                  >
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DealsPipelinePage;
