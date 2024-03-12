import { Base } from 'src/common/base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import {
  Entity,
  ManyToOne,
  Relation,
  Column,
  Index,
  BeforeInsert,
} from 'typeorm';
import crypto from 'crypto';

@Entity()
export class Location extends Base {
  @ManyToOne(() => Unit)
  unit: Relation<Unit>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Index()
  @Column({ type: 'varchar', length: 15, update: false, unique: true })
  locationId: string;

  @BeforeInsert()
  beforeInsert() {
    this.locationId = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '');
  }
}
