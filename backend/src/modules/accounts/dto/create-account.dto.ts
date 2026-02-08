import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber()
  employee_count?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  annual_revenue?: number;

  @ApiPropertyOptional({ example: '123 Main St, City, State 12345' })
  @IsOptional()
  @IsString()
  billing_address?: string;

  @ApiPropertyOptional({ example: '456 Warehouse Ave, City, State 12345' })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsOptional()
  @IsUUID()
  parent_account_id?: string;

  @ApiPropertyOptional({ example: { tier: 'enterprise' } })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
