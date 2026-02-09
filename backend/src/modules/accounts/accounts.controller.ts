import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Accounts')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'industry', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Accounts list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('industry') industry?: string,
  ) {
    return this.accountsService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      industry,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account returned' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.accountsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async create(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.accountsService.create(createAccountDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.accountsService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.accountsService.remove(id, user);
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Get contacts for an account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Contacts list returned' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getContacts(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.accountsService.getContacts(id, user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }
}
