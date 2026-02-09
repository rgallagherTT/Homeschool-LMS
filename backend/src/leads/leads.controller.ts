import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IRequestUser } from '../common/interfaces/user.interface';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard)
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
  @ApiQuery({ name: 'source', required: false, type: String })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query() query: any,
  ) {
    return this.leadsService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  async findOne(
    @CurrentUser() user: IRequestUser,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async create(
    @CurrentUser() user: IRequestUser,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(user, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  async update(
    @CurrentUser() user: IRequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  async delete(
    @CurrentUser() user: IRequestUser,
    @Param('id') id: string,
  ) {
    return this.leadsService.delete(user, id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert a lead to contact and account' })
  async convertLead(
    @CurrentUser() user: IRequestUser,
    @Param('id') id: string,
  ) {
    return this.leadsService.convertLead(user, id);
  }
}
