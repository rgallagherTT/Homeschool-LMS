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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Activities')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'related_to_type', required: false, type: String })
  @ApiQuery({ name: 'related_to_id', required: false, type: String })
  @ApiQuery({ name: 'assigned_to', required: false, type: String })
  @ApiQuery({ name: 'completed', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Activities list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('related_to_type') related_to_type?: string,
    @Query('related_to_id') related_to_id?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('completed') completed?: string,
  ) {
    return this.activitiesService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      type,
      related_to_type,
      related_to_id,
      assigned_to,
      completed,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity returned' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.activitiesService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(
    @Body() createActivityDto: CreateActivityDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.activitiesService.create(createActivityDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.activitiesService.update(id, updateActivityDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.activitiesService.remove(id, user);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an activity as completed' })
  @ApiResponse({ status: 200, description: 'Activity marked as completed' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async markComplete(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.activitiesService.markComplete(id, user);
  }
}
