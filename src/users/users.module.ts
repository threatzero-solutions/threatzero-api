import { Module } from '@nestjs/common';
import { Note } from './entities/note.entity';
import { UserRepresentation } from './entities/user-representation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note, UserRepresentation])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
