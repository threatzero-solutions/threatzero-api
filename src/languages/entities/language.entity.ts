import { Base } from 'src/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Language extends Base {
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  nativeName: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 2,
  })
  code: string;
}
