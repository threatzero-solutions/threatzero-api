import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class SaveByIdDto<E extends { id: string }> {
  @IsNotEmpty()
  @IsUUID()
  id: E['id'];
}

export class OptionalSaveByIdDto<E extends { id: string }> {
  @IsOptional()
  @IsUUID()
  id?: E['id'];
}
