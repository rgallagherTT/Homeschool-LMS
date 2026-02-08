// =============================================
// Organization
// =============================================
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// User / Profile
// =============================================
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'sales_rep' | 'support_agent' | 'viewer';
  organization_id: string;
  avatar_url?: string;
  phone?: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Lead
// =============================================
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted';

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'cold_call'
  | 'email_campaign'
  | 'trade_show'
  | 'advertisement'
  | 'other';

export interface Lead {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  owner_id?: string;
  owner?: User;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  converted_at?: string;
  converted_contact_id?: string;
  converted_account_id?: string;
  converted_deal_id?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Contact
// =============================================
export interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  account_id?: string;
  account?: Account;
  owner_id?: string;
  owner?: User;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  date_of_birth?: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Account
// =============================================
export type AccountType = 'customer' | 'prospect' | 'partner' | 'vendor' | 'other';

export interface Account {
  id: string;
  organization_id: string;
  name: string;
  type: AccountType;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  annual_revenue?: number;
  employees?: number;
  owner_id?: string;
  owner?: User;
  parent_account_id?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Deal / Pipeline
// =============================================
export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Pipeline {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  name: string;
  amount: number;
  stage: DealStage;
  pipeline_id?: string;
  pipeline_stage_id?: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  account_id?: string;
  account?: Account;
  contact_id?: string;
  contact?: Contact;
  owner_id?: string;
  owner?: User;
  description?: string;
  loss_reason?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Activity
// =============================================
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

export interface Activity {
  id: string;
  organization_id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  due_date?: string;
  completed_at?: string;
  owner_id?: string;
  owner?: User;
  lead_id?: string;
  lead?: Lead;
  contact_id?: string;
  contact?: Contact;
  account_id?: string;
  account?: Account;
  deal_id?: string;
  deal?: Deal;
  created_at: string;
  updated_at: string;
}

// =============================================
// Ticket (Support)
// =============================================
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  organization_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  contact_id?: string;
  contact?: Contact;
  account_id?: string;
  account?: Account;
  assigned_to_id?: string;
  assigned_to?: User;
  created_by_id?: string;
  created_by?: User;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user?: User;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Campaign
// =============================================
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'email' | 'social' | 'ads' | 'webinar' | 'event' | 'other';

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  expected_revenue?: number;
  description?: string;
  owner_id?: string;
  owner?: User;
  created_at: string;
  updated_at: string;
}

// =============================================
// API Response Types
// =============================================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// =============================================
// Dashboard Types
// =============================================
export interface DashboardStats {
  totalLeads: number;
  openDeals: number;
  pipelineValue: number;
  openTickets: number;
  leadsChange: number;
  dealsChange: number;
  pipelineChange: number;
  ticketsChange: number;
}

export interface PipelineChartData {
  stage: string;
  count: number;
  value: number;
}
