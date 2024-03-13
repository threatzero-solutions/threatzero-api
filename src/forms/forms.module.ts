import { Module } from '@nestjs/common';
import { FormsModule as FormsEntityModule } from './forms/forms.module';
import { FieldGroupsModule } from './field-groups/field-groups.module';
import { FieldsModule } from './fields/fields.module';

@Module({
  imports: [FormsEntityModule, FieldGroupsModule, FieldsModule],
  exports: [FormsEntityModule],
})
export class FormsModule {}
