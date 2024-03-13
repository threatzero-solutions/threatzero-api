import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form } from './entities/form.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSubmission } from './entities/form-submission.entity';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { S3Service } from 'src/aws/s3/s3.service';
import { UsersModule } from 'src/users/users.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form, FormSubmission]),
    UsersModule,
    MediaModule,
  ],
  controllers: [FormsController],
  providers: [FormsService, FieldGroupsService, S3Service],
  exports: [FormsService, UsersModule],
})
export class FormsModule {}
