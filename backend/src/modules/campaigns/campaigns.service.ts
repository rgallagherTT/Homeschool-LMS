import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class CampaignsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all campaigns with pagination and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      owner_id?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('campaigns')
      .select('*', { count: 'exact' });

    // Apply type filter
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    // Apply owner_id filter
    if (query.owner_id) {
      queryBuilder = queryBuilder.eq('owner_id', query.owner_id);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch campaigns: ${error.message}`,
      );
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
   * Find a single campaign by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Campaign not found');
    }

    return data;
  }

  /**
   * Create a new campaign.
   */
  async create(createCampaignDto: CreateCampaignDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('campaigns')
      .insert({
        ...createCampaignDto,
        organization_id: user.organization_id,
        created_by: user.id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create campaign: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing campaign.
   */
  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('campaigns')
      .update({
        ...updateCampaignDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update campaign: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Campaign not found');
    }

    return data;
  }

  /**
   * Delete a campaign by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete campaign: ${error.message}`,
      );
    }

    return { message: 'Campaign deleted successfully' };
  }
}
