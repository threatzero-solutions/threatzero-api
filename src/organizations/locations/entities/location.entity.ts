import { Base } from 'src/common/base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Entity, ManyToOne, Relation, Column, Index } from 'typeorm';

@Entity()
export class Location extends Base {
  @ManyToOne(() => Unit)
  unit: Relation<Unit>;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 15, update: false, unique: true })
  locationId: string;
}
