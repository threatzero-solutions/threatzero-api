import { Base } from 'src/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class SafetyContact extends Base {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;
}
