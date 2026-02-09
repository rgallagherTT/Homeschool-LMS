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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Campaigns')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all campaigns with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'owner_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Campaigns list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('owner_id') owner_id?: string,
  ) {
    return this.campaignsService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      type,
      status,
      owner_id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign returned' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.campaignsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.campaignsService.create(createCampaignDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.campaignsService.update(id, updateCampaignDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.campaignsService.remove(id, user);
  }
}
