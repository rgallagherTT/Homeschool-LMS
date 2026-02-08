import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Space,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
  const navigate = useNavigate();
  const { fullName, initials, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useAppStore();
  const [searchValue, setSearchValue] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{fullName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {profile?.role || 'User'}
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'theme',
      icon: theme === 'light' ? <MoonOutlined /> : <SunOutlined />,
      label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
      onClick: toggleTheme,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleSignOut,
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Search */}
      <Input
        placeholder="Search leads, contacts, deals..."
        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        style={{ maxWidth: 400, borderRadius: 8 }}
        allowClear
      />

      {/* Right section */}
      <Space size="large" align="center">
        {/* Notifications */}
        <Badge count={3} size="small">
          <BellOutlined
            style={{ fontSize: 18, cursor: 'pointer', color: '#555' }}
          />
        </Badge>

        {/* User Menu */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }} align="center">
            <Avatar
              style={{ backgroundColor: '#1890ff' }}
              size={36}
            >
              {initials}
            </Avatar>
            <Text strong style={{ fontSize: 14 }}>
              {fullName}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}

export default Header;
