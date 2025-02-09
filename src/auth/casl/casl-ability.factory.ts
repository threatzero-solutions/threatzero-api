import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { StatelessUser } from 'src/auth/user.factory';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import { Form } from 'src/forms/forms/entities/form.entity';
import { Language } from 'src/languages/entities/language.entity';
import { VideoEvent } from 'src/media/entities/video-event.entity';
import { Location } from 'src/organizations/locations/entities/location.entity';
import { CreateOrganizationIdpDto } from 'src/organizations/organizations/dto/create-organization-idp.dto';
import { OrganizationUserDto } from 'src/organizations/organizations/dto/organization-user.dto';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { POCFile } from 'src/safety-management/poc-files/entities/poc-file.entity';
import { ThreatAssessment } from 'src/safety-management/threat-assessments/entities/threat-assessment.entity';
import { Tip } from 'src/safety-management/tips/entities/tip.entity';
import { SendTrainingLinksDto } from 'src/safety-management/training-admin/dto/send-training-links.dto';
import { WatchStatsDto } from 'src/safety-management/training-admin/dto/watch-stats.dto';
import { ViolentIncidentReport } from 'src/safety-management/violent-incident-reports/entities/violent-incident-report.entity';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { ItemCompletion } from 'src/training/items/entities/item-completion.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';
import { LEVEL, READ, WRITE } from '../permissions';
import { Action, LmsScormPackageSubject, LmsTokenSubject } from './constants';

export const CASL_ABILITY_FACTORY = 'CASL_ABILITY_FACTORY';

const FormsSubjects = [Form, FieldGroup, Field];
type FormsSubjectTypes = InferSubjects<(typeof FormsSubjects)[number]>;

const TrainingSubjects = [
  TrainingCourse,
  TrainingSection,
  Audience,
  TrainingItem,
];
type TrainingSubjectTypes = InferSubjects<(typeof TrainingSubjects)[number]>;

const OrganizationsSubjectsAllowRead = [
  Organization,
  Unit,
  Location,
  CourseEnrollment,
];
const OrganizationsSubjectsRestrictedRead = [
  CreateOrganizationIdpDto,
  OrganizationUserDto,
  LmsTokenSubject,
  LmsScormPackageSubject,
];
type OrganizationsSubjectTypes = InferSubjects<
  | (typeof OrganizationsSubjectsAllowRead)[number]
  | (typeof OrganizationsSubjectsRestrictedRead)[number]
>;
type OrganizationUserSubjectType = InferSubjects<OrganizationUserDto>;

const SafetyManagementSubjects = [
  ThreatAssessment,
  Tip,
  POCFile,
  ViolentIncidentReport,
  WatchStatsDto,
  ItemCompletion,
  SendTrainingLinksDto,
];
type SafetyManagementSubjectTypes = InferSubjects<
  (typeof SafetyManagementSubjects)[number]
>;

const ResourceSubjects = [ResourceItem];
type ResourceSubjectTypes = InferSubjects<(typeof ResourceSubjects)[number]>;

type MediaSubjects = InferSubjects<typeof VideoEvent>;

const UserSubjects = [UserRepresentation];
type UserSubjectTypes = InferSubjects<(typeof UserSubjects)[number]>;

const LanguageSubjects = [Language];
type LanguageSubjectTypes = InferSubjects<(typeof LanguageSubjects)[number]>;

type AllSubjectTypes =
  | TrainingSubjectTypes
  | OrganizationsSubjectTypes
  | OrganizationUserSubjectType
  | SafetyManagementSubjectTypes
  | FormsSubjectTypes
  | ResourceSubjectTypes
  | MediaSubjects
  | UserSubjectTypes
  | LanguageSubjectTypes;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: StatelessUser) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    // --------- FORMS ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.FORMS)) {
      can(Action.Manage, FormsSubjects);
    }

    if (user.hasPermission(READ.FORMS)) {
      can(Action.Read, FormsSubjects);
    }

    // --------- TRAINING ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.COURSES)) {
      can(Action.Manage, TrainingSubjects);
    }

    if (user.hasPermission(READ.COURSES)) {
      can(Action.Read, TrainingSubjects);
    }

    // --------- ORGANIZATIONS ---------
    if (user.hasPermission(WRITE.ORGANIZATIONS)) {
      can(Action.Manage, [Organization, Unit, Location]);
    }

    // IMPORTANT: Only global admins can create organizations.
    if (!user.hasPermission(LEVEL.ADMIN)) {
      cannot(Action.Create, Organization);
    }

    if (user.hasPermission(WRITE.UNITS)) {
      can(Action.Manage, [Unit, Location]);
    }

    if (user.hasPermission(WRITE.COURSE_ENROLLMENTS)) {
      can(Action.Manage, [CourseEnrollment]);
    }

    if (user.hasPermission(WRITE.ORGANIZATIONS)) {
      can(Action.Manage, [Unit, Location]);
      can(Action.Update, [Organization]);
    }

    if (user.hasPermission(READ.ORGANIZATION_USERS)) {
      can(Action.Read, [OrganizationUserDto]);
    }

    if (user.hasPermission(WRITE.ORGANIZATION_USERS)) {
      can(Action.Manage, [OrganizationUserDto]);
    }

    if (user.hasPermission(READ.ORGANIZATION_IDPS)) {
      can(Action.Read, [CreateOrganizationIdpDto]);
    }

    if (user.hasPermission(WRITE.ORGANIZATION_IDPS)) {
      can(Action.Manage, [CreateOrganizationIdpDto]);
    }

    if (user.hasPermission(READ.ORGANIZATION_LMS_CONTENT)) {
      can(Action.Read, [LmsTokenSubject, LmsScormPackageSubject]);
    }

    if (user.hasPermission(WRITE.ORGANIZATION_LMS_CONTENT)) {
      can(Action.Manage, [LmsTokenSubject, LmsScormPackageSubject]);
    }

    // Anyone can read their own organization/unit. Fine grained access is managed
    // in organization service.
    can(Action.Read, OrganizationsSubjectsAllowRead);

    // --------- SAFETY MANAGEMENT ---------
    if (user.hasPermission(READ.TRAINING_STATS)) {
      can(Action.Read, [WatchStatsDto, ItemCompletion]);
    }

    if (user.hasPermission(WRITE.TRAINING_LINKS)) {
      can(Action.Manage, SendTrainingLinksDto);
    }

    if (user.hasPermission(LEVEL.ADMIN, WRITE.THREAT_ASSESSMENTS)) {
      can(Action.Manage, ThreatAssessment);
    }

    if (user.hasPermission(LEVEL.ADMIN, WRITE.TIPS)) {
      can(Action.Manage, Tip);
    }

    if (user.hasPermission(LEVEL.ADMIN, WRITE.VIOLENT_INCIDENT_REPORTS)) {
      can(Action.Manage, ViolentIncidentReport);
    }

    if (
      user.hasPermission(LEVEL.ORGANIZATION, WRITE.THREAT_ASSESSMENTS) ||
      user.hasPermission(LEVEL.UNIT, WRITE.THREAT_ASSESSMENTS)
    ) {
      can(Action.Create, ThreatAssessment);
      can(Action.Update, ThreatAssessment);
    }

    if (
      user.hasPermission(LEVEL.ORGANIZATION, WRITE.TIPS) ||
      user.hasPermission(LEVEL.UNIT, WRITE.TIPS)
    ) {
      can(Action.Update, Tip);
    }

    if (
      user.hasPermission(LEVEL.ORGANIZATION, WRITE.VIOLENT_INCIDENT_REPORTS) ||
      user.hasPermission(LEVEL.UNIT, WRITE.VIOLENT_INCIDENT_REPORTS)
    ) {
      can(Action.Create, ViolentIncidentReport);
      can(Action.Update, ViolentIncidentReport);
    }

    if (user.hasPermission(READ.THREAT_ASSESSMENTS)) {
      can(Action.Read, ThreatAssessment);
    }

    if (user.hasPermission(READ.TIPS)) {
      can(Action.Read, Tip);
    }

    if (user.hasPermission(READ.VIOLENT_INCIDENT_REPORTS)) {
      can(Action.Read, ViolentIncidentReport);
    }

    // Anyone can submit a tip.
    can(Action.Create, [Tip]);

    // --------- RESOURCES ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.RESOURCES)) {
      can(Action.Manage, ResourceSubjects);
    }

    if (user.hasPermission(READ.RESOURCES)) {
      can(Action.Read, ResourceSubjects);
    }

    // --------- MEDIA ---------

    // Anyone can create video events.
    can(Action.Create, VideoEvent);

    // --------- USERS ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.USERS)) {
      can(Action.Manage, UserSubjects);
    }

    // --------- LANGUAGES ---------
    if (user.hasPermission(WRITE.LANGUAGES)) {
      can(Action.Manage, LanguageSubjects);
    }

    // Anyone can read available languages.
    can(Action.Read, LanguageSubjects);

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<AllSubjectTypes>,
    });
  }
}
