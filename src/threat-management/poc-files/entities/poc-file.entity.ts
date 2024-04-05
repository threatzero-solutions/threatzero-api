import { Base } from 'src/common/base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ThreatAssessment } from 'src/threat-management/threat-assessments/entities/threat-assessment.entity';
import { Tip } from 'src/threat-management/tips/entities/tip.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Relation,
} from 'typeorm';

@Entity()
export class POCFile extends Base {
  @ManyToMany(() => Tip, (tip) => tip.pocFiles)
  @JoinTable()
  tips: Relation<Tip>[];

  @ManyToMany(() => ThreatAssessment, (assessment) => assessment.pocFiles)
  @JoinTable()
  assessments: Relation<ThreatAssessment>[];

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
