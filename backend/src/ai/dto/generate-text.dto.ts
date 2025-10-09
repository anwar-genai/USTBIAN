import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateTextDto {
  @ApiProperty({ 
    description: 'Prompt for generating post text',
    example: 'Write a post about enjoying the weekend' 
  })
  @IsString()
  @MinLength(3, { message: 'Prompt must be at least 3 characters long' })
  prompt: string;

  @ApiPropertyOptional({ 
    description: 'Maximum length of generated text',
    example: 500,
    default: 500 
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(500)
  maxLength?: number;
}

