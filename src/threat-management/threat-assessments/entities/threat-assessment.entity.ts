import { IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Base } from 'src/common/base.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { POCFile } from 'src/threat-management/poc-files/entities/poc-file.entity';
import { Note } from 'src/users/entities/note.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
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

  @ManyToMany(() => POCFile, (pocFile) => pocFile.assessments)
  pocFiles: Relation<POCFile>[];

  @Column({ default: AssessmentStatus.IN_PROGRESS })
  @IsEnum(AssessmentStatus)
  @IsOptional()
  status: AssessmentStatus;

  @OneToOne(() => FormSubmission, {
    // Use forms service to validate and save submissions.
    eager: false,
    cascade: true,
  })
  @JoinColumn()
  @IsNotEmpty()
  submission: Relation<FormSubmission>;

  @OneToMany(() => Note, (note) => note.assessment)
  notes: Relation<Note>[];
}
