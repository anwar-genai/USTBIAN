import { IsString, IsOptional, IsEmail, IsArray, IsEnum, IsDateString } from 'class-validator';

export class CreateCoverLetterDto {
  @IsString()
  title: string;

  @IsString()
  jobTitle: string;

  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsString()
  content: string;

  @IsString()
  senderName: string;

  @IsEmail()
  senderEmail: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  senderAddress?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientTitle?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsDateString()
  dateWritten?: Date;

  @IsOptional()
  @IsEnum(['professional', 'enthusiastic', 'formal', 'creative'])
  tone?: string;

  @IsOptional()
  @IsArray()
  keyPoints?: string[];
}

