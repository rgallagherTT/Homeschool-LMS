import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class ActivitiesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all activities with pagination and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      related_to_type?: string;
      related_to_id?: string;
      assigned_to?: string;
      completed?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('activities')
      .select('*', { count: 'exact' });

    // Apply type filter
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    // Apply related_to_type filter
    if (query.related_to_type) {
      queryBuilder = queryBuilder.eq('related_to_type', query.related_to_type);
    }

    // Apply related_to_id filter
    if (query.related_to_id) {
      queryBuilder = queryBuilder.eq('related_to_id', query.related_to_id);
    }

    // Apply assigned_to filter
    if (query.assigned_to) {
      queryBuilder = queryBuilder.eq('assigned_to', query.assigned_to);
    }

    // Apply completed filter
    if (query.completed !== undefined) {
      const isCompleted = query.completed === 'true';
      queryBuilder = queryBuilder.eq('completed', isCompleted);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch activities: ${error.message}`,
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
   * Find a single activity by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Activity not found');
    }

    return data;
  }

  /**
   * Create a new activity.
   */
  async create(createActivityDto: CreateActivityDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .insert({
        ...createActivityDto,
        organization_id: user.organization_id,
        created_by: user.id,
        assigned_to: createActivityDto.assigned_to || user.id,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create activity: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing activity.
   */
  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .update({
        ...updateActivityDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update activity: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Activity not found');
    }

    return data;
  }

  /**
   * Delete an activity by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete activity: ${error.message}`,
      );
    }

    return { message: 'Activity deleted successfully' };
  }

  /**
   * Mark an activity as completed.
   */
  async markComplete(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to complete activity: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Activity not found');
    }

    return data;
  }

  /**
   * Get activities for a specific entity (lead, contact, deal, etc.).
   */
  async getForEntity(
    relatedToType: string,
    relatedToId: string,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .select('*')
      .eq('related_to_type', relatedToType)
      .eq('related_to_id', relatedToId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(
        `Failed to fetch activities: ${error.message}`,
      );
    }

    return data;
  }
}
