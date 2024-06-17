import { Base } from 'src/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class OpaqueToken<T extends object = object> extends Base {
  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'jsonb' })
  value: T;
}
