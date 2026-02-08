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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Leads')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'rating', required: false, type: String })
  @ApiQuery({ name: 'assigned_to', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Leads list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('rating') rating?: string,
    @Query('assigned_to') assigned_to?: string,
  ) {
    return this.leadsService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      status,
      rating,
      assigned_to,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiResponse({ status: 200, description: 'Lead returned' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.leadsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.leadsService.create(createLeadDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.leadsService.update(id, updateLeadDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 200, description: 'Lead deleted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.leadsService.remove(id, user);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert a lead to contact/account/deal' })
  @ApiResponse({ status: 200, description: 'Lead converted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async convertLead(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.leadsService.convertLead(id, user);
  }
}
