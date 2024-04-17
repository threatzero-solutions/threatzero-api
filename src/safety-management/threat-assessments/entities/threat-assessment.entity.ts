import { SafetyResourceBase } from 'src/safety-management/common/safety-resource-base.entity';
import {
  POCFile as POCFileEntity,
  type POCFile,
} from 'src/safety-management/poc-files/entities/poc-file.entity';
import { Note } from 'src/users/entities/note.entity';
import { Column, Entity, ManyToMany, OneToMany, Relation } from 'typeorm';

export enum AssessmentStatus {
  IN_PROGRESS = 'in_progress',
  CONCLUDED_MANAGEMENT_ONGOING = 'concluded_management_ongoing',
  CONCLUDED_MANAGEMENT_COMPLETE = 'concluded_management_complete',
  CLOSED_SUPERFICIAL_THREAT = 'closed_superficial_threat',
}

@Entity()
export class ThreatAssessment extends SafetyResourceBase {
  @Column({ default: AssessmentStatus.IN_PROGRESS })
  status: AssessmentStatus;

  @ManyToMany(() => POCFileEntity, (pocFile) => pocFile.assessments)
  pocFiles: POCFile[];

  @OneToMany(() => Note, (note) => note.assessment)
  notes: Relation<Note>[];
}
