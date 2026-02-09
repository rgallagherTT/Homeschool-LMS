import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketChannel {
  EMAIL = 'email',
  PHONE = 'phone',
  WEB = 'web',
  CHAT = 'chat',
  SOCIAL = 'social',
}

export class CreateTicketDto {
  @ApiProperty({ example: 'Cannot access dashboard' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    example: 'When trying to load the dashboard, I get a 500 error',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'bug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Associated contact ID' })
  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @ApiPropertyOptional({ description: 'Associated account ID' })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({ enum: TicketChannel })
  @IsOptional()
  @IsEnum(TicketChannel)
  channel?: TicketChannel;

  @ApiPropertyOptional({ example: ['billing', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { browser: 'Chrome 120' } })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
