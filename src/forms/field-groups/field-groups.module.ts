import { Module } from '@nestjs/common';
import { FieldGroupsService } from './field-groups.service';
import { FieldGroupsController } from './field-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldGroup } from './entities/field-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FieldGroup])],
  controllers: [FieldGroupsController],
  providers: [FieldGroupsService],
})
export class FieldGroupsModule {}
