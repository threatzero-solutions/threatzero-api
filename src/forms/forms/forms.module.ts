import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form } from './entities/form.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSubmission } from './entities/form-submission.entity';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { S3Service } from 'src/aws/s3/s3.service';
import { MediaModule } from 'src/media/media.module';
import { FormsPdfService } from './forms-pdf.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form, FormSubmission]),
    MediaModule,
    HttpModule,
  ],
  controllers: [FormsController],
  providers: [FormsService, FieldGroupsService, S3Service, FormsPdfService],
  exports: [FormsService],
})
export class FormsModule {}
