import { Base } from 'src/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class OpaqueToken<T extends object = object> extends Base {
  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'jsonb' })
  value: T;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  type: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;
}
