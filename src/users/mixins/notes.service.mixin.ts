import { BaseEntityService } from 'src/common/base-entity.service';
import { EntityTarget } from 'typeorm';
import { UsersService } from '../users.service';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { NotableEntity } from '../interfaces/notable-entity.interface';
import { CreateNoteDto } from '../dto/create-note.dto';

export interface NotesServiceMixinRequiredProperties<E extends NotableEntity> {
  usersService: UsersService;
  entity: EntityTarget<E>;
  foreignKeyColumn: string;
}

type Constructor<E extends NotableEntity> = new (
  ...args: any[]
) => BaseEntityService<E>;

export function NotesServiceMixin<E extends NotableEntity>() {
  return function <TBase extends Constructor<E>>(Base: TBase) {
    return class extends Base {
      usersService: UsersService;
      entity: EntityTarget<E>;
      foreignKeyColumn: string;

      async addNote(entityId: E['id'], createNoteDto: CreateNoteDto) {
        const valid = await this.exists(entityId);
        if (valid) {
          return await this.usersService.addNote(
            this.entity,
            this.foreignKeyColumn,
            entityId,
            createNoteDto,
          );
        }
      }

      async getNotes(entityId: E['id'], query: BaseQueryDto) {
        const valid = await this.exists(entityId);
        if (valid) {
          return await this.usersService.getNotes(
            this.foreignKeyColumn,
            entityId,
            query,
          );
        }
      }

      async editNote(
        entityId: E['id'],
        noteId: string,
        updateNoteDto: UpdateNoteDto,
      ) {
        const valid = await this.exists(entityId);
        if (valid) {
          return await this.usersService.editNote(
            this.foreignKeyColumn,
            entityId,
            noteId,
            updateNoteDto,
          );
        }
      }

      async removeNote(entityId: E['id'], noteId: string) {
        const valid = await this.exists(entityId);
        if (valid) {
          return await this.usersService.removeNote(
            this.foreignKeyColumn,
            entityId,
            noteId,
          );
        }
      }

      exists(entityId: E['id']) {
        return this.getQbSingle(entityId).getExists();
      }
    };
  };
}
