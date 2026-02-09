import { useState, useEffect } from 'react';
import { Tabs, Form, Input, Select, Button, Card, message, Spin, Descriptions } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (\u00A5)' },
  { value: 'INR', label: 'INR (\u20B9)' },
];

const sizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501+', label: '501+ employees' },
];

const industryOptions = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Education', label: 'Education' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Other', label: 'Other' },
];

function SettingsPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [profileForm] = Form.useForm();
  const [orgForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, orgRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/organizations/current'),
        ]);
        setProfile(profileRes.data);
        setOrganization(orgRes.data);
        profileForm.setFieldsValue(profileRes.data);
        orgForm.setFieldsValue(orgRes.data);
      } catch {
        message.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, profileForm, orgForm]);

  const handleSaveProfile = async (values: any) => {
    try {
      setSavingProfile(true);
      await api.put('/auth/profile', values);
      message.success('Profile updated successfully');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveOrg = async (values: any) => {
    try {
      setSavingOrg(true);
      await api.put(`/organizations/${organization.id}`, values);
      message.success('Organization updated successfully');
    } catch {
      message.error('Failed to update organization');
    } finally {
      setSavingOrg(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const items = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: (
        <Card>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleSaveProfile}
            style={{ maxWidth: 500 }}
          >
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
              <Input placeholder="First name" />
            </Form.Item>

            <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
              <Input placeholder="Last name" />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input placeholder="Phone number" />
            </Form.Item>

            <Form.Item name="timezone" label="Timezone">
              <Select options={timezoneOptions} placeholder="Select timezone" />
            </Form.Item>

            <Form.Item name="language" label="Language">
              <Select options={languageOptions} placeholder="Select language" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                Save Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'organization',
      label: (
        <span>
          <SettingOutlined /> Organization
        </span>
      ),
      children: (
        <Card>
          {organization && (
            <Descriptions size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Subscription Plan">
                <strong>{organization.subscription_plan?.toUpperCase() || 'FREE'}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Subdomain">
                {organization.subdomain}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Form
            form={orgForm}
            layout="vertical"
            onFinish={handleSaveOrg}
            style={{ maxWidth: 500 }}
          >
            <Form.Item name="name" label="Organization Name" rules={[{ required: true }]}>
              <Input placeholder="Organization name" />
            </Form.Item>

            <Form.Item name="industry" label="Industry">
              <Select options={industryOptions} placeholder="Select industry" allowClear />
            </Form.Item>

            <Form.Item name="size" label="Company Size">
              <Select options={sizeOptions} placeholder="Select size" />
            </Form.Item>

            <Form.Item name="timezone" label="Timezone">
              <Select options={timezoneOptions} placeholder="Select timezone" />
            </Form.Item>

            <Form.Item name="currency" label="Currency">
              <Select options={currencyOptions} placeholder="Select currency" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={savingOrg}>
                Save Organization
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Settings" />
      <Tabs items={items} defaultActiveKey="profile" />
    </div>
  );
}

export default SettingsPage;
