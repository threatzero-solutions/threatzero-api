import { Exclude } from 'class-transformer';
import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import { Section } from 'src/training/sections/entities/section.entity';
import {
  Entity,
  Column,
  Relation,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum TrainingVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

@Entity()
export class Course extends Base {
  @Column(() => TrainingMetadata)
  metadata: Relation<TrainingMetadata>;

  @Column({
    type: 'enum',
    enum: TrainingVisibility,
    default: TrainingVisibility.HIDDEN,
  })
  visibility: TrainingVisibility;

  @OneToMany(() => Section, (section) => section.course, {
    eager: true,
  })
  sections: Relation<Section>[];

  @ManyToMany(() => Audience, (audience) => audience.trainingCourses, {
    eager: true,
  })
  @JoinTable()
  audiences: Relation<Audience>[];

  @ManyToMany(() => Audience, (audience) => audience.trainingCourses, {
    eager: true,
  })
  @JoinTable()
  presentableBy: Relation<Audience>[];

  @ManyToMany(() => Organization, (organization) => organization.courses, {
    eager: true,
  })
  @JoinTable()
  organizations: Relation<Organization>[];

  async loadVideoThumbnails(
    getVimeoThumbnail: (url: string) => Promise<string | null>,
  ) {
    await Promise.all(
      this.sections?.map((section) => {
        section.loadVideoThumbnails(getVimeoThumbnail);
      }) ?? [],
    );
  }
}
