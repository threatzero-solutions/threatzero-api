import { IsNotEmpty, IsUUID } from 'class-validator';

export class SaveByIdDto<E extends { id: string }> {
  @IsNotEmpty()
  @IsUUID()
  id: E['id'];
}
