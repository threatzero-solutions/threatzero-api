import { Base } from 'src/common/base.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import { Form } from 'src/forms/forms/entities/form.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
  type Relation,
  EntityManager,
} from 'typeorm';

@Entity()
@Tree('closure-table')
export class FieldGroup extends Base {
  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Form, (form) => form.groups, {
    onDelete: 'CASCADE',
  })
  form: Relation<Form>;

  @OneToMany(() => Field, (field) => field.group, {
    eager: true,
  })
  fields: Field[];

  @TreeParent({
    onDelete: 'CASCADE',
  })
  parentGroup: Relation<FieldGroup> | null;

  @TreeChildren()
  childGroups: Relation<FieldGroup>[];

  async clone(manager: EntityManager, form?: Form, parentGroup?: FieldGroup) {
    let newDraft = manager.create(FieldGroup, {
      ...this,
      id: undefined,
      form,
      parentGroup,
    });
    newDraft = await manager.save(newDraft);

    await Promise.all(
      this.fields.map((f) => f.clone(manager, undefined, newDraft)),
    );
    await Promise.all(
      this.childGroups.map((g) => g.clone(manager, undefined, newDraft)),
    );
  }
}
