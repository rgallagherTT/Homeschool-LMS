import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current user organization' })
  @ApiResponse({ status: 200, description: 'Organization returned' })
  async findCurrent(@CurrentUser() user: IRequestUser) {
    return this.organizationsService.findCurrent(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID with members' })
  @ApiResponse({ status: 200, description: 'Organization returned' })
  async findOne(@Param('id') id: string, @CurrentUser() user: IRequestUser) {
    return this.organizationsService.findOne(id, user);
  }

  @Put(':id')
  @Roles('admin', 'owner')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.organizationsService.update(id, updateDto, user);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  @ApiResponse({ status: 200, description: 'Members list returned' })
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.organizationsService.getMembers(id, user);
  }

  @Post(':id/members')
  @Roles('admin', 'owner')
  @ApiOperation({ summary: 'Invite a new member to the organization' })
  @ApiResponse({ status: 201, description: 'Member invited' })
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteData: { email: string; role: string; full_name: string },
    @CurrentUser() user: IRequestUser,
  ) {
    return this.organizationsService.inviteMember(id, inviteData, user);
  }
}
