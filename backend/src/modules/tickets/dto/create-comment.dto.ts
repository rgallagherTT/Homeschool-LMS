import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'I have investigated this issue and found the root cause.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this comment is internal (not visible to customer)',
  })
  @IsOptional()
  @IsBoolean()
  is_internal?: boolean;
}
