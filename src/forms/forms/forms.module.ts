import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form } from './entities/form.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSubmission } from './entities/form-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormSubmission])],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
