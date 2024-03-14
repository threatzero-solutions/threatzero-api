import { Module } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';
import { Field } from './entities/field.entity';
import FieldResponse from './entities/field-response.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldGroupsService } from '../field-groups/field-groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([Field, FieldResponse])],
  controllers: [FieldsController],
  providers: [FieldsService, FieldGroupsService],
})
export class FieldsModule {}
