export interface IUser {
  id: string;
  email: string;
  role?: string;
  organization_id?: string;
  aud?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  created_at?: string;
}

export interface IRequestUser {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  access_token: string;
}

export interface IProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
