import { IPostgresInterval } from 'postgres-interval';
import { Base } from 'src/common/base.entity';
import { intervalTransformer } from 'src/common/entity.utils';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import { SectionItem } from 'src/training/sections/entities/section-item.entity';
import {
  Entity,
  TableInheritance,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  Relation,
} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Item extends Base {
  @Column(() => TrainingMetadata)
  metadata: TrainingMetadata;

  @Column({ type: 'varchar', length: '128', nullable: true })
  thumbnailKey: string | null;
  thumbnailUrl: string | null;

  @OneToMany(() => SectionItem, (sectionItem) => sectionItem.item)
  sectionItems: Promise<SectionItem[]>;

  @ManyToMany(() => Item, (item) => item.prerequiredByItems)
  @JoinTable()
  prerequisiteItems: Relation<Item>[];

  @ManyToMany(() => Item, (item) => item.prerequisiteItems)
  prerequiredByItems: Relation<Item>[];

  @Column({ insert: false, select: false, nullable: true, update: false })
  prerequisitesFulfilled: boolean;

  @Column({
    type: 'interval',
    nullable: true,
    transformer: intervalTransformer,
  })
  estCompletionTime: IPostgresInterval | null;
}
