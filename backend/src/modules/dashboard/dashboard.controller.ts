import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned' })
  async getStats(@CurrentUser() user: IRequestUser) {
    return this.dashboardService.getStats(user);
  }

  @Get('pipeline-summary')
  @ApiOperation({ summary: 'Get pipeline summary grouped by stage' })
  @ApiResponse({ status: 200, description: 'Pipeline summary returned' })
  async getPipelineSummary(@CurrentUser() user: IRequestUser) {
    return this.dashboardService.getPipelineSummary(user);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiResponse({ status: 200, description: 'Recent activities returned' })
  async getRecentActivities(@CurrentUser() user: IRequestUser) {
    return this.dashboardService.getRecentActivities(user);
  }
}
