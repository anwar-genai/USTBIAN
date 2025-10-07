import { IsArray, IsOptional, IsString, Length, MaxLength, Matches } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(1, 500)
  @Matches(/^(?!.*\n{3,}).*$/s, {
    message: 'Post cannot contain more than 2 consecutive line breaks',
  })
  content: string;

  @IsOptional()
  @IsArray()
  @MaxLength(10, { each: false })
  mediaUrls?: string[];
}


