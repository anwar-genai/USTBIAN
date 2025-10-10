import { IsString, IsOptional } from 'class-validator';

export class OptimizeResumeDto {
  @IsString()
  resumeId: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;
}

