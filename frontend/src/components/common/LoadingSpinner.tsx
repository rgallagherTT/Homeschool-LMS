import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  tip?: string;
  size?: 'small' | 'default' | 'large';
}

function LoadingSpinner({
  fullScreen = false,
  tip = 'Loading...',
  size = 'large',
}: LoadingSpinnerProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 40 : 24 }} spin />;

  if (fullScreen) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          background: '#f5f5f5',
        }}
      >
        <Spin indicator={antIcon} tip={tip} size={size}>
          <div style={{ padding: 50 }} />
        </Spin>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 0',
      }}
    >
      <Spin indicator={antIcon} tip={tip} size={size}>
        <div style={{ padding: 50 }} />
      </Spin>
    </div>
  );
}

export default LoadingSpinner;
