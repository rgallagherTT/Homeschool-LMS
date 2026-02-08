import { ReactNode } from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  change?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  loading?: boolean;
}

function StatsCard({
  title,
  value,
  icon,
  change,
  prefix,
  suffix,
  color = '#1890ff',
  loading = false,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? '#52c41a' : '#ff4d4f';

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Text>
          <Statistic
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}
          />
          {change !== undefined && (
            <div style={{ marginTop: 4 }}>
              {isPositive ? (
                <ArrowUpOutlined style={{ color: changeColor, fontSize: 12 }} />
              ) : (
                <ArrowDownOutlined style={{ color: changeColor, fontSize: 12 }} />
              )}
              <Text style={{ color: changeColor, fontSize: 13, marginLeft: 4 }}>
                {Math.abs(change)}%
              </Text>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                vs last month
              </Text>
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default StatsCard;
