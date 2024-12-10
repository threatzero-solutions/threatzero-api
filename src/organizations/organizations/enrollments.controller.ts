import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { CourseEnrollmentQueryDto } from './dto/course-enrollment-query.dto';
import { CreateCourseEnrollmentDto } from './dto/create-course-enrollment.dto';
import { UpdateCourseEnrollmentDto } from './dto/update-course-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';
import { CourseEnrollment } from './entities/course-enrollment.entity';

@Controller('organizations/organizations/:id/enrollments')
@CheckPolicies(new EntityAbilityChecker(CourseEnrollment))
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  getEnrollments(
    @Param('id') id: string,
    @Query() query: CourseEnrollmentQueryDto,
  ) {
    query['organization.id'] = id;
    return this.enrollmentsService.findAll(query);
  }

  @Post()
  createEnrollment(@Body() createEnrollmentDto: CreateCourseEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get(':enrollmentId')
  findOneEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.enrollmentsService.findOne(enrollmentId);
  }

  @Patch(':enrollmentId')
  updateEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateEnrollmentDto: UpdateCourseEnrollmentDto,
  ) {
    return this.enrollmentsService.update(enrollmentId, updateEnrollmentDto);
  }
}
