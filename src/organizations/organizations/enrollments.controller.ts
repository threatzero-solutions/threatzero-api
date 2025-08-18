import {
  Body,
  Controller,
  Delete,
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
import { LatestCourseEnrollmentsQueryDto } from './dto/latest-course-enrollments-query.dto';
import { RelativeCourseEnrollmentsQueryDto } from './dto/relative-course-enrollments-query.dto';
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

  @Get('latest')
  getLatestEnrollments(
    @Param('id') id: string,
    @Query() query: LatestCourseEnrollmentsQueryDto,
  ) {
    return this.enrollmentsService.getLatestEnrollments(id, query);
  }

  @Get(':enrollmentId/relative')
  getRelativeEnrollment(
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Query() query: RelativeCourseEnrollmentsQueryDto,
  ) {
    return this.enrollmentsService.getRelativeEnrollment(
      id,
      enrollmentId,
      query,
    );
  }

  @Get(':enrollmentId/previous')
  getPreviousEnrollment(
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Query() query: RelativeCourseEnrollmentsQueryDto,
  ) {
    return this.enrollmentsService.getPreviousEnrollment(
      id,
      enrollmentId,
      query,
    );
  }

  @Get(':enrollmentId/next')
  getNextEnrollment(
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Query() query: RelativeCourseEnrollmentsQueryDto,
  ) {
    return this.enrollmentsService.getNextEnrollment(id, enrollmentId, query);
  }

  @Post()
  createEnrollment(
    @Param('id') id: string,
    @Body() createEnrollmentDto: CreateCourseEnrollmentDto,
  ) {
    return this.enrollmentsService.create({
      ...createEnrollmentDto,
      organization: { id },
    });
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

  @Delete(':enrollmentId')
  removeEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.enrollmentsService.remove(enrollmentId);
  }
}
