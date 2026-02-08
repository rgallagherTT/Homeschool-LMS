import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class ContactsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all contacts with pagination, search, and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      account_id?: string;
      owner_id?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('contacts')
      .select('*, accounts(id, name)', { count: 'exact' });

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
      );
    }

    // Apply account_id filter
    if (query.account_id) {
      queryBuilder = queryBuilder.eq('account_id', query.account_id);
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
        `Failed to fetch contacts: ${error.message}`,
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
   * Find a single contact by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('contacts')
      .select('*, accounts(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Contact not found');
    }

    return data;
  }

  /**
   * Create a new contact.
   */
  async create(createContactDto: CreateContactDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('contacts')
      .insert({
        ...createContactDto,
        organization_id: user.organization_id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create contact: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing contact.
   */
  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('contacts')
      .update({
        ...updateContactDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update contact: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Contact not found');
    }

    return data;
  }

  /**
   * Delete a contact by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete contact: ${error.message}`,
      );
    }

    return { message: 'Contact deleted successfully' };
  }
}
