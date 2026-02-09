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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IRequestUser } from '../../common/interfaces/user.interface';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'assigned_to', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tickets list returned' })
  async findAll(
    @CurrentUser() user: IRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('category') category?: string,
  ) {
    return this.ticketsService.findAll(user, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      status,
      priority,
      assigned_to,
      category,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket returned' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.create(createTicketDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.update(id, updateTicketDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiResponse({ status: 200, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.remove(id, user);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a ticket' })
  @ApiResponse({ status: 200, description: 'Comments list returned' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getComments(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.getComments(id, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a ticket' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: IRequestUser,
  ) {
    return this.ticketsService.addComment(id, createCommentDto, user);
  }
}
