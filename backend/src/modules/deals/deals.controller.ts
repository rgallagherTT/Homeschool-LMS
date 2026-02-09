import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Deals')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deals with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'pipeline_id', required: false, type: String })
  @ApiQuery({ name: 'stage_id', required: false, type: String })
  @ApiQuery({ name: 'owner_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Deals list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('pipeline_id') pipeline_id?: string,
    @Query('stage_id') stage_id?: string,
    @Query('owner_id') owner_id?: string,
  ) {
    return this.dealsService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      status,
      pipeline_id,
      stage_id,
      owner_id,
    });
  }

  @Get('pipeline/:pipelineId')
  @ApiOperation({ summary: 'Get pipeline view with deals grouped by stage' })
  @ApiResponse({ status: 200, description: 'Pipeline view returned' })
  async getPipelineView(
    @Param('pipelineId') pipelineId: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.getPipelineView(pipelineId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiResponse({ status: 200, description: 'Deal returned' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  async create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.create(createDealDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a deal' })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.update(id, updateDealDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiResponse({ status: 200, description: 'Deal deleted' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.remove(id, user);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update the stage of a deal' })
  @ApiResponse({ status: 200, description: 'Deal stage updated' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async updateStage(
    @Param('id') id: string,
    @Body('stage_id') stageId: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.dealsService.updateStage(id, stageId, user);
  }
}
