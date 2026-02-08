import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceRoleKey: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    this.supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // Admin client uses service role key - bypasses RLS
    this.adminClient = createClient(
      this.supabaseUrl,
      this.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * Get the admin Supabase client (bypasses RLS).
   * Use for server-side operations that need full access.
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Get a Supabase client scoped to a specific user's JWT.
   * This respects Row Level Security policies.
   */
  getClientForUser(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Verify a JWT token and return the user data.
   */
  async verifyToken(accessToken: string) {
    const {
      data: { user },
      error,
    } = await this.adminClient.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    return user;
  }
}
