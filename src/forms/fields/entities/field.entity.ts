import { BadRequestException } from '@nestjs/common';
import { Base } from 'src/common/base.entity';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Form, FormState } from 'src/forms/forms/entities/form.entity';
import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  ManyToOne,
  type Relation,
} from 'typeorm';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  TEXTAREA = 'textarea',
  FILE = 'file',
  EMAIL = 'email',
  TEL = 'tel',
  RADIO = 'radio',
  RANGE = 'range',
  COLOR = 'color',
  DATETIME_LOCAL = 'datetime-local',
  SEARCH = 'search',
  TIME = 'time',
  URL = 'url',
  NONE = 'none',
}

@Entity()
export class Field extends Base {
  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true })
  placeholder: string | null;

  @Column({ type: 'text', nullable: true })
  helpText: string | null;

  @Column({ default: FieldType.TEXT })
  type: FieldType;

  @Column({ type: 'jsonb', nullable: true })
  elementProperties: any;

  @Column({ type: 'jsonb', nullable: true })
  typeParams: any;

  @Column({ default: false })
  required: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  hidden: boolean;

  @ManyToOne(() => Form, (form) => form.fields, {
    onDelete: 'CASCADE',
  })
  form: Relation<Form> | null;

  @ManyToOne(() => FieldGroup, (group) => group.fields, {
    onDelete: 'CASCADE',
  })
  group: Relation<FieldGroup> | null;

  async clone(manager: EntityManager, form?: Form, group?: FieldGroup) {
    await manager.insert(Field, {
      ...this,
      id: undefined,
      form,
      group,
    });
  }

  validateChanges(form: Form, changes: DeepPartial<Field>) {
    const fieldsToCompare = ['label', 'type'];

    if (
      this.type !== FieldType.NONE &&
      form?.state === FormState.PUBLISHED &&
      Object.entries(changes).some(([key, value]) => {
        if (!fieldsToCompare.includes(key)) {
          return false;
        }
        return this[key as keyof Field] !== value;
      })
    ) {
      throw new BadRequestException(
        `Form field values ${fieldsToCompare} cannot be altered once published.`,
      );
    }
  }
}
