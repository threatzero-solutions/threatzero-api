import { IPostgresInterval } from 'postgres-interval';
import { Base } from 'src/common/base.entity';
import { intervalTransformer } from 'src/common/entity.utils';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import { TrainingSectionItem } from 'src/training/sections/entities/section-item.entity';
import { Entity, TableInheritance, Column, OneToMany, Relation } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class TrainingItem extends Base {
  @Column(() => TrainingMetadata)
  metadata: TrainingMetadata;

  @Column({ type: 'varchar', length: '128', nullable: true })
  thumbnailKey: string | null;
  thumbnailUrl: string | null;

  @OneToMany(() => TrainingSectionItem, (sectionItem) => sectionItem.item)
  sectionItems: Promise<TrainingSectionItem[]>;

  // @ManyToMany(() => TrainingItem, (item) => item.prerequiredByItems)
  // @JoinTable()
  prerequisiteItems: Relation<TrainingItem>[] = [];

  // @ManyToMany(() => TrainingItem, (item) => item.prerequisiteItems)
  prerequiredByItems: Relation<TrainingItem>[] = [];

  // @Column({ insert: false, select: false, nullable: true, update: false })
  prerequisitesFulfilled: boolean = true;

  @Column({
    type: 'interval',
    nullable: true,
    transformer: intervalTransformer,
  })
  estCompletionTime: IPostgresInterval | null;
}
