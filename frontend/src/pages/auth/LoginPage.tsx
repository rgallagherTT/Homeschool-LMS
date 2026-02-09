import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { signIn, error, clearError, loading } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    clearError();
    try {
      await signIn(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is set in the store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" bordered={false}>
        <div className="auth-logo">
          <Title level={2} style={{ color: '#1890ff', marginBottom: 4 }}>
            CRM Plus
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting || loading}
              block
              style={{ height: 44, fontWeight: 600, fontSize: 15 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Don't have an account?
          </Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register">
            <Button type="link" style={{ fontWeight: 500 }}>
              Create an account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
