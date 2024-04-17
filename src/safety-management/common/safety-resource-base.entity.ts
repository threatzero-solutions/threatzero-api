import { Base } from 'src/common/base.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import {
  Column,
  JoinColumn,
  ManyToOne,
  OneToOne,
  type Relation,
} from 'typeorm';

export abstract class SafetyResourceBase extends Base {
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  tag: string | null;

  @Column({ length: 64 })
  unitSlug: string;

  @ManyToOne(() => Unit, {
    eager: true,
  })
  @JoinColumn({
    name: 'unitSlug',
    referencedColumnName: 'slug',
  })
  unit: Relation<Unit>;

  @OneToOne(() => FormSubmission, {
    // Use forms service to validate and save submissions.
    eager: false,
    cascade: true,
  })
  @JoinColumn()
  submission: Relation<FormSubmission>;
}
