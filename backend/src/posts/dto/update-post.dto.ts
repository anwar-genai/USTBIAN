import { IsArray, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  content?: string;

  @IsOptional()
  @IsArray()
  @MaxLength(10, { each: false })
  mediaUrls?: string[];
}


