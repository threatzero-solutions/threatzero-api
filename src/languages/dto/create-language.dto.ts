import { IsString, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @Length(2, 128)
  name: string;

  @IsString()
  @Length(2, 128)
  nativeName: string;

  @IsString()
  @Length(2, 2)
  code: string;
}
