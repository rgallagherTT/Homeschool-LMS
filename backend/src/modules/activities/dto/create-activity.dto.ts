import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  NOTE = 'note',
}

export enum ActivityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, example: ActivityType.CALL })
  @IsEnum(ActivityType)
  @IsNotEmpty()
  type: ActivityType;

  @ApiProperty({ example: 'Follow-up call with prospect' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ example: 'Discuss pricing and timeline for Q1' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'lead',
    description: 'Type of entity this activity is related to',
  })
  @IsOptional()
  @IsString()
  related_to_type?: string;

  @ApiPropertyOptional({ description: 'ID of the related entity' })
  @IsOptional()
  @IsUUID()
  related_to_id?: string;

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ example: '2025-12-31T17:00:00Z' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ enum: ActivityPriority, default: ActivityPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;
}
