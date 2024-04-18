import { Base } from 'src/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class WorkplaceViolencePreventionPlan extends Base {
  @Column({ type: 'varchar', length: 255 })
  pdfS3Key: string;

  pdfUrl?: string;
}
