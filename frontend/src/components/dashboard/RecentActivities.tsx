import { Timeline, Typography, Tag } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Activity, ActivityType } from '../../types';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface RecentActivitiesProps {
  activities: Activity[];
}

const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string; label: string }> = {
  call: { icon: <PhoneOutlined />, color: '#52c41a', label: 'Call' },
  email: { icon: <MailOutlined />, color: '#1890ff', label: 'Email' },
  meeting: { icon: <CalendarOutlined />, color: '#722ed1', label: 'Meeting' },
  task: { icon: <CheckSquareOutlined />, color: '#fa8c16', label: 'Task' },
  note: { icon: <FileTextOutlined />, color: '#8c8c8c', label: 'Note' },
};

function RecentActivities({ activities }: RecentActivitiesProps) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <Text type="secondary">No recent activities</Text>
      </div>
    );
  }

  const items = activities.map((activity) => {
    const config = activityConfig[activity.type] || activityConfig.note;
    return {
      key: activity.id,
      dot: (
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `${config.color}15`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.color,
            fontSize: 14,
          }}
        >
          {config.icon}
        </span>
      ),
      children: (
        <div style={{ paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Tag
              color={config.color}
              style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
            >
              {config.label}
            </Tag>
            <Text strong style={{ fontSize: 13 }}>
              {activity.subject}
            </Text>
          </div>
          {activity.description && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
              {activity.description.length > 80
                ? `${activity.description.substring(0, 80)}...`
                : activity.description}
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
            {dayjs(activity.created_at).fromNow()}
            {activity.owner && ` by ${activity.owner.first_name} ${activity.owner.last_name}`}
          </Text>
        </div>
      ),
    };
  });

  return <Timeline items={items} />;
}

export default RecentActivities;
