import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Divider, Row, Col } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  organizationName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { signUp, error, clearError, loading } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    clearError();
    try {
      await signUp(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
        values.organizationName
      );
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is set in the store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" bordered={false} style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <Title level={2} style={{ color: '#1890ff', marginBottom: 4 }}>
            CRM Plus
          </Title>
          <Text type="secondary">Create your account</Text>
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="First name"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="organizationName"
            label="Organization Name"
            rules={[{ required: true, message: 'Please enter your organization name' }]}
          >
            <Input
              prefix={<BankOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Your company or organization"
            />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Create a password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Confirm your password"
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
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Already have an account?
          </Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <Button type="link" style={{ fontWeight: 500 }}>
              Sign in instead
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default RegisterPage;
