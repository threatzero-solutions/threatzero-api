import { Base } from 'src/common/base.entity';
import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { Section } from './section.entity';
import { Item } from 'src/training/items/entities/item.entity';

@Entity()
export class SectionItem extends Base {
  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  sectionId: string | null;

  @ManyToOne(() => Section, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  section: Relation<Section>;

  @ManyToOne(() => Item, (item) => item.sectionItems, {
    eager: true,
    onDelete: 'CASCADE',
  })
  item: Relation<Item>;
}
