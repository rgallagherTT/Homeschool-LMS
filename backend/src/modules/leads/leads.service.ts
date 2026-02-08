import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class LeadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all leads with pagination, search, and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      rating?: string;
      assigned_to?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply search filter across multiple fields
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%,company.ilike.%${query.search}%`,
      );
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    // Apply rating filter
    if (query.rating) {
      queryBuilder = queryBuilder.eq('rating', query.rating);
    }

    // Apply assigned_to filter
    if (query.assigned_to) {
      queryBuilder = queryBuilder.eq('assigned_to', query.assigned_to);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch leads: ${error.message}`);
    }

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find a single lead by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Lead not found');
    }

    return data;
  }

  /**
   * Create a new lead.
   */
  async create(createLeadDto: CreateLeadDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('leads')
      .insert({
        ...createLeadDto,
        organization_id: user.organization_id,
        created_by: user.id,
        assigned_to: createLeadDto.assigned_to || user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create lead: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing lead.
   */
  async update(id: string, updateLeadDto: UpdateLeadDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('leads')
      .update({
        ...updateLeadDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update lead: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Lead not found');
    }

    return data;
  }

  /**
   * Delete a lead by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete lead: ${error.message}`,
      );
    }

    return { message: 'Lead deleted successfully' };
  }

  /**
   * Convert a lead to a contact/account/deal using the Supabase RPC function.
   */
  async convertLead(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    // Verify lead exists first
    const { data: lead, error: findError } = await client
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !lead) {
      throw new NotFoundException('Lead not found');
    }

    // Call the convert_lead RPC function
    const { data, error } = await client.rpc('convert_lead', {
      lead_id: id,
    });

    if (error) {
      throw new BadRequestException(
        `Failed to convert lead: ${error.message}`,
      );
    }

    return data;
  }
}
