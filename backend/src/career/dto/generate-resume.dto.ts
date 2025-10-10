import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class GenerateResumeDto {
  @IsString()
  targetRole: string;

  @IsString()
  industry: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  education?: {
    school: string;
    degree: string;
    field: string;
    graduationYear: string;
  }[];

  @IsOptional()
  @IsArray()
  experience?: {
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
  }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projects?: string[];

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsEnum(['professional', 'creative', 'technical', 'executive'])
  tone?: 'professional' | 'creative' | 'technical' | 'executive';
}

