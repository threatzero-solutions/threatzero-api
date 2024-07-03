import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectLiteral,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum VideoEventType {
  PLAY = 'play',
  END = 'end',
  ERROR = 'error',
  PAUSE = 'pause',
  PROGRESS = 'progress',
  READY = 'ready',
  BUFFER = 'buffer',
  DURATION = 'duration',
  START = 'start',
  SEEK = 'seek',
  BUFFER_END = 'buffer_end',
  CLICK_PREVIEW = 'click_preview',
  ENABLE_PIP = 'enable_pip',
  DISABLE_PIP = 'disable_pip',
}

@Entity()
@Index(['unitSlug', 'itemId'])
export class VideoEvent implements ObjectLiteral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: Set update to false after UserID migration.
  @Column({ length: 64, select: false, update: true })
  userId: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true })
  audienceSlugs?: string[] | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  unitSlug?: string | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'enum', enum: VideoEventType })
  type: VideoEventType;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  itemId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sectionId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  courseId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  videoId?: string | null;

  @Column({ type: 'jsonb' })
  eventData: unknown;

  @Column()
  url: string;

  @Column({ type: 'inet', nullable: true })
  ipv4: string | null;

  @Column({ type: 'inet', nullable: true })
  ipv6: string | null;
}
