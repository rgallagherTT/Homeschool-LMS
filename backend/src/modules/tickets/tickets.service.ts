import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class TicketsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all tickets with pagination and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      priority?: string;
      assigned_to?: string;
      category?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('tickets')
      .select('*, contacts(id, first_name, last_name), accounts(id, name)', {
        count: 'exact',
      });

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `subject.ilike.%${query.search}%,description.ilike.%${query.search}%`,
      );
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    // Apply priority filter
    if (query.priority) {
      queryBuilder = queryBuilder.eq('priority', query.priority);
    }

    // Apply assigned_to filter
    if (query.assigned_to) {
      queryBuilder = queryBuilder.eq('assigned_to', query.assigned_to);
    }

    // Apply category filter
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch tickets: ${error.message}`,
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
   * Find a single ticket by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('tickets')
      .select('*, contacts(id, first_name, last_name), accounts(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Ticket not found');
    }

    return data;
  }

  /**
   * Create a new ticket.
   */
  async create(createTicketDto: CreateTicketDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('tickets')
      .insert({
        ...createTicketDto,
        organization_id: user.organization_id,
        created_by: user.id,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create ticket: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing ticket.
   */
  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('tickets')
      .update({
        ...updateTicketDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update ticket: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Ticket not found');
    }

    return data;
  }

  /**
   * Delete a ticket by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete ticket: ${error.message}`,
      );
    }

    return { message: 'Ticket deleted successfully' };
  }

  /**
   * Get comments for a ticket.
   */
  async getComments(ticketId: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await client
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const { data, error } = await client
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(
        `Failed to fetch comments: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Add a comment to a ticket.
   */
  async addComment(
    ticketId: string,
    createCommentDto: CreateCommentDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await client
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const { data, error } = await client
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        body: createCommentDto.body,
        is_internal: createCommentDto.is_internal || false,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to add comment: ${error.message}`,
      );
    }

    return data;
  }
}
