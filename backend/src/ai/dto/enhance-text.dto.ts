import { IsString, IsOptional, IsInt, Min, Max, IsIn, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnhanceTextDto {
  @ApiProperty({ 
    description: 'Text to enhance',
    example: 'had a great day today feeling awesome' 
  })
  @IsString()
  @MinLength(1, { message: 'Text cannot be empty' })
  text: string;

  @ApiPropertyOptional({ 
    description: 'Tone to apply to the text',
    enum: ['professional', 'casual', 'friendly', 'humorous'],
    example: 'friendly' 
  })
  @IsOptional()
  @IsString()
  @IsIn(['professional', 'casual', 'friendly', 'humorous'])
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous';

  @ApiPropertyOptional({ 
    description: 'Maximum length of enhanced text',
    example: 500,
    default: 500 
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(500)
  maxLength?: number;
}

