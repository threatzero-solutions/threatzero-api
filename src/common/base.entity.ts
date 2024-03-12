import {
  CreateDateColumn,
  ObjectLiteral,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Base entity class that all other entities extend from.
export abstract class Base implements ObjectLiteral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdOn: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedOn: Date;
}
