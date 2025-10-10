import { IsString, IsOptional, IsArray, IsEmail, IsUrl, ValidateNested, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class EducationDto {
  @IsString()
  school: string;

  @IsString()
  degree: string;

  @IsString()
  field: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  gpa?: string;

  @IsOptional()
  @IsArray()
  achievements?: string[];
}

class ExperienceDto {
  @IsString()
  company: string;

  @IsString()
  position: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  current?: boolean;

  @IsString()
  description: string;

  @IsArray()
  achievements: string[];
}

class SkillDto {
  @IsString()
  name: string;

  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsOptional()
  @IsString()
  category?: string;
}

class ProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  technologies: string[];

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @ValidateIf((o) => o.email && o.email !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((o) => o.phone && o.phone !== '')
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((o) => o.location && o.location !== '')
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateIf((o) => o.website && o.website !== '')
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @ValidateIf((o) => o.linkedin && o.linkedin !== '')
  @IsUrl({}, { message: 'LinkedIn must be a valid URL' })
  linkedin?: string;

  @IsOptional()
  @ValidateIf((o) => o.github && o.github !== '')
  @IsUrl({}, { message: 'GitHub must be a valid URL' })
  github?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsArray()
  languages?: { name: string; proficiency: string }[];

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;
}

