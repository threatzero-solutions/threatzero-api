import { Base } from 'src/common/base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ThreatAssessment } from 'src/safety-management/threat-assessments/entities/threat-assessment.entity';
import { Tip } from 'src/safety-management/tips/entities/tip.entity';
import { ViolentIncidentReport } from 'src/safety-management/violent-incident-reports/entities/violent-incident-report.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity()
export class POCFile extends Base {
  @ManyToMany(() => Tip, (tip) => tip.pocFiles)
  @JoinTable()
  tips: Relation<Tip>[];

  @ManyToMany(() => ThreatAssessment, (assessment) => assessment.pocFiles)
  @JoinTable()
  assessments: Relation<ThreatAssessment>[];

  @ManyToMany(() => ViolentIncidentReport, (report) => report.pocFiles)
  @JoinTable()
  violentIncidentReports: Relation<ViolentIncidentReport>[];

  @ManyToOne(() => Unit)
  unit: Relation<Unit>;

  @ManyToMany(() => Unit)
  @JoinTable()
  peerUnits: Relation<Unit>[];

  @Column({ type: 'varchar', length: 64, nullable: true })
  pocFirstName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  pocLastName: string | null;
}
