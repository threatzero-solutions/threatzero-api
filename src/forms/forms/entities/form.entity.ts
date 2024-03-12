import { Base } from 'src/common/base.entity';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import {
  Entity,
  Check,
  Unique,
  Column,
  Index,
  OneToMany,
  Relation,
} from 'typeorm';
import { FormSubmission } from './form-submission.entity';

export enum FormState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity()
@Check("state = 'draft' OR (state = 'published' AND version > 0)")
@Unique(['slug', 'version'])
export class Form extends Base {
  @Index()
  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Field, (field) => field.form, {
    eager: true,
  })
  fields: Relation<Field>[];

  @OneToMany(() => FieldGroup, (group) => group.form, {
    eager: true,
  })
  groups: Relation<FieldGroup>[];

  @OneToMany(() => FormSubmission, (formSubmission) => formSubmission.form)
  formSubmissions: Relation<FormSubmission>[];

  @Column({ default: FormState.DRAFT })
  state: FormState;
}
