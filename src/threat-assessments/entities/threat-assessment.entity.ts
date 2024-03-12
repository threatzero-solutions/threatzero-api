import { IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Base } from 'src/common/base.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Note } from 'src/users/entities/note.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  type Relation,
} from 'typeorm';

export enum AssessmentStatus {
  IN_PROGRESS = 'in_progress',
  CONCLUDED_MANAGEMENT_ONGOING = 'concluded_management_ongoing',
  CONCLUDED_MANAGEMENT_COMPLETE = 'concluded_management_complete',
  CLOSED_SUPERFICIAL_THREAT = 'closed_superficial_threat',
}

@Entity()
export class ThreatAssessment extends Base {
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

  @Column({ default: AssessmentStatus.IN_PROGRESS })
  @IsEnum(AssessmentStatus)
  @IsOptional()
  status: AssessmentStatus;

  @OneToOne(() => FormSubmission, {
    eager: true,
    cascade: true,
  })
  @JoinColumn()
  @IsNotEmpty()
  submission: Relation<FormSubmission>;

  @OneToMany(() => Note, (note) => note.assessment)
  notes: Relation<Note>[];
}
