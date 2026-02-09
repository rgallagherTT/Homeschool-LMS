import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { IRequestUser } from '../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signup(dto: SignupDto) {
    const adminClient = this.supabaseService.getAdminClient();

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        first_name: dto.firstName,
        last_name: dto.lastName,
      },
    });

    if (authError) {
      throw new HttpException(authError.message, HttpStatus.BAD_REQUEST);
    }

    const userId = authData.user.id;

    // Create organization
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: dto.organizationName,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) {
      // Cleanup: remove auth user if org creation fails
      await adminClient.auth.admin.deleteUser(userId);
      throw new HttpException(orgError.message, HttpStatus.BAD_REQUEST);
    }

    // Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
        organization_id: org.id,
      });

    if (profileError) {
      await adminClient.from('organizations').delete().eq('id', org.id);
      await adminClient.auth.admin.deleteUser(userId);
      throw new HttpException(profileError.message, HttpStatus.BAD_REQUEST);
    }

    // Create organization membership with owner role
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        user_id: userId,
        organization_id: org.id,
        role: 'owner',
      });

    if (memberError) {
      await adminClient.from('profiles').delete().eq('id', userId);
      await adminClient.from('organizations').delete().eq('id', org.id);
      await adminClient.auth.admin.deleteUser(userId);
      throw new HttpException(memberError.message, HttpStatus.BAD_REQUEST);
    }

    // Sign in to get a session
    const anonClient = this.supabaseService.getAnonClient();
    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError) {
      throw new HttpException(signInError.message, HttpStatus.BAD_REQUEST);
    }

    return {
      user: {
        id: userId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      organization: org,
      session: session.session,
    };
  }

  async signin(dto: SigninDto) {
    const anonClient = this.supabaseService.getAnonClient();

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Fetch profile with organization
    const adminClient = this.supabaseService.getAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
      },
      organization: profile?.organizations || null,
      session: data.session,
    };
  }

  async signout(accessToken: string) {
    const supabase = this.supabaseService.getClientForUser(accessToken);
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Successfully signed out' };
  }

  async getProfile(user: IRequestUser) {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    // Get organization membership role
    let role = null;
    if (profile?.organization_id) {
      const { data: membership } = await adminClient
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .single();
      role = membership?.role || null;
    }

    return {
      ...profile,
      role,
    };
  }

  async updateProfile(user: IRequestUser, updates: Partial<{ first_name: string; last_name: string; phone: string; avatar_url: string }>) {
    const supabase = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return data;
  }
}
