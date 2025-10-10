import { PartialType } from '@nestjs/mapped-types';
import { CreateResumeDto } from './create-resume.dto';
import { IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SuggestionDto {
  @IsOptional()
  category?: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  priority?: 'low' | 'medium' | 'high';
}

export class UpdateResumeDto extends PartialType(CreateResumeDto) {
  @IsOptional()
  @IsNumber()
  optimizationScore?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestionDto)
  suggestions?: SuggestionDto[];
}

