import { IsString, IsOptional, IsEnum } from 'class-validator';

export class GenerateCoverLetterDto {
  @IsString()
  jobTitle: string;

  @IsString()
  company: string;

  @IsString()
  jobDescription: string;

  @IsOptional()
  @IsString()
  resumeId?: string;

  @IsString()
  senderName: string;

  @IsOptional()
  @IsString()
  whyInterested?: string;

  @IsOptional()
  @IsString()
  relevantExperience?: string;

  @IsOptional()
  @IsString()
  keyStrengths?: string;

  @IsOptional()
  @IsEnum(['professional', 'enthusiastic', 'formal', 'creative'])
  tone?: 'professional' | 'enthusiastic' | 'formal' | 'creative';
}

