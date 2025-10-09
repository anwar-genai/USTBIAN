import { IsString, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShortenTextDto {
  @ApiProperty({ 
    description: 'Text to shorten',
    example: 'This is a very long post that exceeds the character limit and needs to be shortened...' 
  })
  @IsString()
  @MinLength(1, { message: 'Text cannot be empty' })
  text: string;

  @ApiProperty({ 
    description: 'Target character length',
    example: 500,
    default: 500 
  })
  @IsInt()
  @Min(50)
  @Max(500)
  targetLength: number;
}

