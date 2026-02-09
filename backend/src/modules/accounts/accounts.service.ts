import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class AccountsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find all accounts with pagination, search, and filters.
   */
  async findAll(
    user: IRequestUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      industry?: string;
    },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = client
      .from('accounts')
      .select('*', { count: 'exact' });

    // Apply search filter by name or industry
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.search}%,industry.ilike.%${query.search}%`,
      );
    }

    // Apply industry filter
    if (query.industry) {
      queryBuilder = queryBuilder.eq('industry', query.industry);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch accounts: ${error.message}`,
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
   * Find a single account by ID.
   */
  async findOne(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Account not found');
    }

    return data;
  }

  /**
   * Create a new account.
   */
  async create(createAccountDto: CreateAccountDto, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('accounts')
      .insert({
        ...createAccountDto,
        organization_id: user.organization_id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create account: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing account.
   */
  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    user: IRequestUser,
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('accounts')
      .update({
        ...updateAccountDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update account: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Account not found');
    }

    return data;
  }

  /**
   * Delete an account by ID.
   */
  async remove(id: string, user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { error } = await client
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete account: ${error.message}`,
      );
    }

    return { message: 'Account deleted successfully' };
  }

  /**
   * Get all contacts associated with an account.
   */
  async getContacts(
    accountId: string,
    user: IRequestUser,
    query: { page?: number; limit?: number },
  ) {
    const client = this.supabaseService.getClientForUser(user.access_token);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Verify account exists
    const { data: account, error: accountError } = await client
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new NotFoundException('Account not found');
    }

    const { data, error, count } = await client
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch contacts for account: ${error.message}`,
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
}
