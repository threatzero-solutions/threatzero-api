import { Module } from '@nestjs/common';
import { Note } from './entities/note.entity';
import { UserRepresentation } from './entities/user-representation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Note, UserRepresentation])],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
