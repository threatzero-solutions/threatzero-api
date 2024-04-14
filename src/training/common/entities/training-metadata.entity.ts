import { Column } from 'typeorm';

export class TrainingMetadata {
  @Column({ length: 100, type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 100, type: 'varchar', nullable: true })
  tag: string | null;
}
