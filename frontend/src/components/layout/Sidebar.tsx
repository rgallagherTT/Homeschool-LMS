import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserAddOutlined,
  ContactsOutlined,
  BankOutlined,
  DollarOutlined,
  ScheduleOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';

const { Sider } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/leads',
    icon: <UserAddOutlined />,
    label: 'Leads',
  },
  {
    key: '/contacts',
    icon: <ContactsOutlined />,
    label: 'Contacts',
  },
  {
    key: '/accounts',
    icon: <BankOutlined />,
    label: 'Accounts',
  },
  {
    key: 'deals-group',
    icon: <DollarOutlined />,
    label: 'Deals',
    children: [
      {
        key: '/deals',
        label: 'All Deals',
      },
      {
        key: '/deals/pipeline',
        icon: <FunnelPlotOutlined />,
        label: 'Pipeline',
      },
    ],
  },
  {
    key: '/activities',
    icon: <ScheduleOutlined />,
    label: 'Activities',
  },
  {
    key: '/tickets',
    icon: <CustomerServiceOutlined />,
    label: 'Tickets',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key !== 'deals-group') {
      navigate(key);
    }
  };

  // Determine the selected key from the current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/deals/pipeline')) return '/deals/pipeline';
    if (path.startsWith('/deals')) return '/deals';
    if (path.startsWith('/leads')) return '/leads';
    if (path.startsWith('/contacts')) return '/contacts';
    if (path.startsWith('/accounts')) return '/accounts';
    if (path.startsWith('/activities')) return '/activities';
    if (path.startsWith('/tickets')) return '/tickets';
    if (path.startsWith('/settings')) return '/settings';
    return '/dashboard';
  };

  // Determine which submenu should be open
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/deals')) return ['deals-group'];
    return [];
  };

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={setSidebarCollapsed}
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
      theme="dark"
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1
          style={{
            color: '#fff',
            margin: 0,
            fontSize: sidebarCollapsed ? 16 : 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {sidebarCollapsed ? 'CRM' : 'CRM Plus'}
        </h1>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  );
}

export default Sidebar;
