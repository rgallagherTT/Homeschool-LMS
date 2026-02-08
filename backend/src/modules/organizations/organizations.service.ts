import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class OrganizationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get the current user's organization.
   */
  async findCurrent(user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Organization not found');
    }

    return data;
  }

  /**
   * Get organization by ID with members.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('organizations')
      .select('*, profiles(id, user_id, full_name, email, role, avatar_url)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Organization not found');
    }

    return data;
  }

  /**
   * Update organization details.
   */
  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
    user: IRequestUser,
  ) {
    // Verify user is admin of this org
    if (user.organization_id !== id) {
      throw new ForbiddenException(
        'You can only update your own organization',
      );
    }

    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ForbiddenException(
        'Only admins can update organization details',
      );
    }

    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('organizations')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update organization: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Get organization members.
   */
  async getMembers(organizationId: string, user: IRequestUser) {
    if (user.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You can only view members of your own organization',
      );
    }

    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('profiles')
      .select('id, user_id, full_name, email, role, avatar_url, phone, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(
        `Failed to fetch members: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Invite a member to the organization.
   */
  async inviteMember(
    organizationId: string,
    inviteData: { email: string; role: string; full_name: string },
    user: IRequestUser,
  ) {
    if (user.organization_id !== organizationId) {
      throw new ForbiddenException('You can only invite members to your own organization');
    }

    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ForbiddenException('Only admins can invite members');
    }

    const adminClient = this.supabaseService.getAdminClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: inviteData.email,
        email_confirm: false,
        user_metadata: {
          full_name: inviteData.full_name,
        },
      });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    // Create profile for the invited user
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: inviteData.email,
        full_name: inviteData.full_name,
        role: inviteData.role || 'member',
        organization_id: organizationId,
      })
      .select()
      .single();

    if (profileError) {
      // Clean up auth user on failure
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(
        `Failed to create member profile: ${profileError.message}`,
      );
    }

    return profile;
  }
}
