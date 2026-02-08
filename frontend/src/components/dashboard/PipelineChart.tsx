import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Typography } from 'antd';

interface PipelineChartDataItem {
  stage: string;
  amount: number;
  count: number;
}

interface PipelineChartProps {
  data: PipelineChartDataItem[];
}

const COLORS = ['#1890ff', '#36cfc9', '#ffc53d', '#ff7a45', '#52c41a', '#ff4d4f'];

const formatAmount = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '12px 16px',
          border: '1px solid #f0f0f0',
          borderRadius: 6,
          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
        }}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {label}
        </Typography.Text>
        <Typography.Text style={{ display: 'block', color: '#1890ff' }}>
          Amount: {formatAmount(payload[0].value)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {payload[0].payload.count} deal{payload[0].payload.count !== 1 ? 's' : ''}
        </Typography.Text>
      </div>
    );
  }
  return null;
};

function PipelineChart({ data }: PipelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text type="secondary">No pipeline data available</Typography.Text>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#f0f0f0' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAmount}
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#f0f0f0' }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default PipelineChart;
