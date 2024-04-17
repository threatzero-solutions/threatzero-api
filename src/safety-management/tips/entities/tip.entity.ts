import { Location } from 'src/organizations/locations/entities/location.entity';
import { SafetyResourceBase } from 'src/safety-management/common/safety-resource-base.entity';
import { POCFile } from 'src/safety-management/poc-files/entities/poc-file.entity';
import { Note } from 'src/users/entities/note.entity';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

export enum TipStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

@Entity()
export class Tip extends SafetyResourceBase {
  @ManyToOne(() => Location, {
    nullable: true,
  })
  location: Relation<Location>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  informantFirstName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  informantLastName: string | null;

  // https://dba.stackexchange.com/questions/37014/in-what-data-type-should-i-store-an-email-address-in-database
  @Column({ type: 'varchar', length: 319, nullable: true })
  informantEmail: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  informantPhone: string | null;

  @Column({ default: TipStatus.NEW })
  status: TipStatus;

  @ManyToMany(() => POCFile, (pocFile) => pocFile.tips)
  pocFiles: Relation<POCFile>[];

  @OneToMany(() => Note, (note) => note.tip)
  notes: Relation<Note>[];
}
