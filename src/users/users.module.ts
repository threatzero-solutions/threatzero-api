import { Module } from '@nestjs/common';
import { Note } from './entities/note.entity';
import { UserRepresentation } from './entities/user-representation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Note, UserRepresentation])],
})
export class UsersModule {}
