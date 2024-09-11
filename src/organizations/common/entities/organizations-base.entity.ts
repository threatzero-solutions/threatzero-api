import { Base } from 'src/common/base.entity';
import { SafetyContact } from 'src/safety-management/common/entities/safety-contact.entity';
import { Index, Column, Relation, OneToOne, JoinColumn } from 'typeorm';

export class OrganizationBase extends Base {
  @Index()
  @Column({ length: 64, unique: true })
  slug: string;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @OneToOne(() => SafetyContact, {
    onDelete: 'SET NULL',
    cascade: true,
  })
  @JoinColumn()
  safetyContact: Relation<SafetyContact> | null;
}
