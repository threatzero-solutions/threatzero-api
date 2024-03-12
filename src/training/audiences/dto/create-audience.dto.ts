import { Length, Matches } from 'class-validator';

export class CreateAudienceDto {
  @Matches(/^[a-z0-9-]+$/)
  @Length(4, 32)
  slug: string;
}
