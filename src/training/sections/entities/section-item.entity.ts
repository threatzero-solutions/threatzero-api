import { Base } from 'src/common/base.entity';
import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { TrainingSection } from './section.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';

@Entity()
export class SectionItem extends Base {
  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  sectionId: string | null;

  @ManyToOne(() => TrainingSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  section: Relation<TrainingSection>;

  @ManyToOne(() => TrainingItem, (item) => item.sectionItems, {
    eager: true,
    onDelete: 'CASCADE',
  })
  item: Relation<TrainingItem>;
}
