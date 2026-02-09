import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class DealsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all deals with pagination and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      pipeline_id?: string;
      stage_id?: string;
      owner_id?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('deals')
      .select('*, accounts(id, name), contacts(id, first_name, last_name)', {
        count: 'exact',
      });

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    // Apply pipeline_id filter
    if (query.pipeline_id) {
      queryBuilder = queryBuilder.eq('pipeline_id', query.pipeline_id);
    }

    // Apply stage_id filter
    if (query.stage_id) {
      queryBuilder = queryBuilder.eq('stage_id', query.stage_id);
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
        `Failed to fetch deals: ${error.message}`,
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
   * Find a single deal by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('deals')
      .select('*, accounts(id, name), contacts(id, first_name, last_name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Deal not found');
    }

    return data;
  }

  /**
   * Create a new deal.
   */
  async create(createDealDto: CreateDealDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('deals')
      .insert({
        ...createDealDto,
        organization_id: user.organization_id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create deal: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing deal.
   */
  async update(id: string, updateDealDto: UpdateDealDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('deals')
      .update({
        ...updateDealDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update deal: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Deal not found');
    }

    return data;
  }

  /**
   * Delete a deal by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete deal: ${error.message}`,
      );
    }

    return { message: 'Deal deleted successfully' };
  }

  /**
   * Get deals for a specific pipeline, grouped by stage.
   */
  async getPipelineView(pipelineId: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    // Fetch all stages for the pipeline
    const { data: stages, error: stagesError } = await client
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('position', { ascending: true });

    if (stagesError) {
      throw new BadRequestException(
        `Failed to fetch pipeline stages: ${stagesError.message}`,
      );
    }

    // Fetch all deals for this pipeline
    const { data: deals, error: dealsError } = await client
      .from('deals')
      .select('*, accounts(id, name), contacts(id, first_name, last_name)')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false });

    if (dealsError) {
      throw new BadRequestException(
        `Failed to fetch pipeline deals: ${dealsError.message}`,
      );
    }

    // Group deals by stage
    const pipeline = (stages || []).map((stage) => ({
      ...stage,
      deals: (deals || []).filter((deal) => deal.stage_id === stage.id),
      total_amount: (deals || [])
        .filter((deal) => deal.stage_id === stage.id)
        .reduce((sum, deal) => sum + (deal.amount || 0), 0),
    }));

    return pipeline;
  }

  /**
   * Update the stage of a deal (move it in the pipeline).
   */
  async updateStage(
    id: string,
    stageId: string,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('deals')
      .update({
        stage_id: stageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update deal stage: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Deal not found');
    }

    return data;
  }
}
