import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class UserIdChangeDto {
  @IsString()
  @IsNotEmpty()
  oldId: string;

  @IsString()
  @IsNotEmpty()
  newId: string;
}

export class UserIdChangesDto {
  @Type(() => UserIdChangeDto)
  @ValidateNested()
  changes: UserIdChangeDto[];
}
