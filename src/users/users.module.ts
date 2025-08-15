import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Note } from './entities/note.entity';
import { UserRepresentation } from './entities/user-representation.entity';
import { UserSyncTask } from './tasks/user-sync.task';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note, UserRepresentation]), AuthModule],
  providers: [UsersService, UserSyncTask],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
