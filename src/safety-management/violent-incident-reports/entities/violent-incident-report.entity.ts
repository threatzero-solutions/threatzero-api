import { SafetyResourceBase } from 'src/safety-management/common/safety-resource-base.entity';
import { POCFile } from 'src/safety-management/poc-files/entities/poc-file.entity';
import { Note } from 'src/users/entities/note.entity';
import { Column, Entity, ManyToMany, OneToMany, type Relation } from 'typeorm';

export enum ViolentIncidentReportStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
}

@Entity()
export class ViolentIncidentReport extends SafetyResourceBase {
  @Column({ default: ViolentIncidentReportStatus.NEW })
  status: ViolentIncidentReportStatus;

  @ManyToMany(() => POCFile, (pocFile) => pocFile.violentIncidentReports)
  pocFiles: Relation<POCFile>[];

  @OneToMany(() => Note, (note) => note.violentIncidentReport)
  notes: Relation<Note>[];
}
