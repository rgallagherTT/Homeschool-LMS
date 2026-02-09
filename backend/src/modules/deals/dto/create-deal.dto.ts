import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'Enterprise License Deal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Pipeline ID' })
  @IsUUID()
  @IsNotEmpty()
  pipeline_id: string;

  @ApiPropertyOptional({ description: 'Stage ID' })
  @IsOptional()
  @IsUUID()
  stage_id?: string;

  @ApiPropertyOptional({ description: 'Associated account ID' })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({ description: 'Associated contact ID' })
  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 75, description: 'Win probability (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expected_close_date?: string;

  @ApiPropertyOptional({ example: { source: 'referral' } })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
