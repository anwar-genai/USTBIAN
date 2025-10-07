import { IsOptional, IsString, Length, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 500)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}


