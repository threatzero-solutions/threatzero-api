import { ObjectLiteral } from 'typeorm';
import { Note } from '../entities/note.entity';

export interface NotableEntity extends ObjectLiteral {
  id: string;
  notes?: Note[];
}
