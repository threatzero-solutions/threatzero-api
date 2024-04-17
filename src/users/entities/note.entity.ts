import { Base } from 'src/common/base.entity';
import { ThreatAssessment } from 'src/safety-management/threat-assessments/entities/threat-assessment.entity';
import { Tip } from 'src/safety-management/tips/entities/tip.entity';
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { UserRepresentation } from './user-representation.entity';
import { ViolentIncidentReport } from 'src/safety-management/violent-incident-reports/entities/violent-incident-report.entity';

@Entity()
export class Note extends Base {
  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 100 })
  userExternalId: string | null;

  @ManyToOne(() => UserRepresentation, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'userExternalId',
    referencedColumnName: 'externalId',
  })
  user: Relation<UserRepresentation> | null;

  @Column({ nullable: true })
  tipId: string | null;

  @ManyToOne(() => Tip, (tracking) => tracking.notes, {
    nullable: true,
  })
  tip: Relation<Tip>;

  @Column({ nullable: true })
  assessmentId: string | null;

  @ManyToOne(() => ThreatAssessment, (assessment) => assessment.notes, {
    nullable: true,
  })
  assessment: Relation<ThreatAssessment>;

  @Column({ nullable: true })
  violentIncidentReportId: string | null;

  @ManyToOne(() => ViolentIncidentReport, (report) => report.notes, {
    nullable: true,
  })
  violentIncidentReport: Relation<ViolentIncidentReport>;
}
