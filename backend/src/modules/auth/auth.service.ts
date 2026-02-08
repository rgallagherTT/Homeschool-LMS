import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Register a new user, create their organization and profile.
   */
  async signup(signupDto: SignupDto) {
    const adminClient = this.supabaseService.getAdminClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: signupDto.email,
        password: signupDto.password,
        email_confirm: true,
        user_metadata: {
          full_name: signupDto.full_name,
        },
      });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    const userId = authData.user.id;

    try {
      // Create organization if name provided, otherwise use a default
      const orgName =
        signupDto.organization_name || `${signupDto.full_name}'s Organization`;

      const { data: org, error: orgError } = await adminClient
        .from('organizations')
        .insert({
          name: orgName,
          owner_id: userId,
        })
        .select()
        .single();

      if (orgError) {
        throw new InternalServerErrorException(
          `Failed to create organization: ${orgError.message}`,
        );
      }

      // Create user profile
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .insert({
          user_id: userId,
          email: signupDto.email,
          full_name: signupDto.full_name,
          phone: signupDto.phone || null,
          role: 'admin',
          organization_id: org.id,
        })
        .select()
        .single();

      if (profileError) {
        throw new InternalServerErrorException(
          `Failed to create profile: ${profileError.message}`,
        );
      }

      // Sign in to get tokens
      const { data: signInData, error: signInError } =
        await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: signupDto.email,
        });

      // Alternatively, sign in with email/password to get session
      const anonClient = this.supabaseService.getClientForUser('');
      const { data: session, error: sessionError } =
        await anonClient.auth.signInWithPassword({
          email: signupDto.email,
          password: signupDto.password,
        });

      if (sessionError) {
        // Return user info even if session creation fails
        return {
          user: {
            id: userId,
            email: signupDto.email,
            full_name: signupDto.full_name,
          },
          profile,
          organization: org,
          message:
            'Account created successfully. Please sign in to get your access token.',
        };
      }

      return {
        user: {
          id: userId,
          email: signupDto.email,
          full_name: signupDto.full_name,
        },
        profile,
        organization: org,
        session: {
          access_token: session.session.access_token,
          refresh_token: session.session.refresh_token,
          expires_in: session.session.expires_in,
          token_type: session.session.token_type,
        },
      };
    } catch (error) {
      // If anything fails after user creation, clean up the auth user
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      throw error;
    }
  }

  /**
   * Sign in with email and password.
   */
  async signin(signinDto: SigninDto) {
    const adminClient = this.supabaseService.getAdminClient();

    // Use a fresh client to sign in
    const anonClient = this.supabaseService.getClientForUser('');
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: signinDto.email,
      password: signinDto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Fetch profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*, organizations(id, name, logo_url)')
      .eq('user_id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name,
      },
      profile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
    };
  }

  /**
   * Sign out the current user.
   */
  async signout(accessToken: string) {
    const client = this.supabaseService.getClientForUser(accessToken);
    const { error } = await client.auth.signOut();

    if (error) {
      throw new InternalServerErrorException('Failed to sign out');
    }

    return { message: 'Successfully signed out' };
  }

  /**
   * Get the current user's profile.
   */
  async getProfile(userId: string) {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('*, organizations(id, name, logo_url, created_at)')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new BadRequestException('Profile not found');
    }

    return profile;
  }

  /**
   * Update the current user's profile.
   */
  async updateProfile(
    userId: string,
    updateData: { full_name?: string; phone?: string; avatar_url?: string },
  ) {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: profile, error } = await adminClient
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*, organizations(id, name, logo_url)')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update profile: ${error.message}`,
      );
    }

    return profile;
  }
}
