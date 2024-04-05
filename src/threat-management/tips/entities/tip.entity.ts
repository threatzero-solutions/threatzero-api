import { Base } from 'src/common/base.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { Location } from 'src/organizations/locations/entities/location.entity';
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

export enum TipStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

@Entity()
export class Tip extends Base {
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

  @ManyToOne(() => Location, {
    nullable: true,
  })
  location: Relation<Location>;

  @ManyToMany(() => POCFile, (pocFile) => pocFile.tips)
  pocFiles: Relation<POCFile>[];

  @OneToOne(() => FormSubmission, {
    // Use forms service to validate and save submissions.
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  submission: Relation<FormSubmission>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  informantFirstName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  informantLastName: string | null;

  // https://dba.stackexchange.com/questions/37014/in-what-data-type-should-i-store-an-email-address-in-database
  @Column({ type: 'varchar', length: 319, nullable: true })
  informantEmail: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  informantPhone: string | null;

  @OneToMany(() => Note, (note) => note.tip)
  notes: Relation<Note>[];

  @Column({ default: TipStatus.NEW })
  status: TipStatus;
}
