import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { StatelessUser } from 'src/auth/user.factory';
import { Location } from 'src/organizations/locations/entities/location.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { LEVEL, WRITE, READ } from '../permissions';
import { Action } from './actions';
import { ThreatAssessment } from 'src/safety-management/threat-assessments/entities/threat-assessment.entity';
import { Form } from 'src/forms/forms/entities/form.entity';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import { Tip } from 'src/safety-management/tips/entities/tip.entity';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { VideoEvent } from 'src/media/entities/video-event.entity';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';
import { POCFile } from 'src/safety-management/poc-files/entities/poc-file.entity';
import { ViolentIncidentReport } from 'src/safety-management/violent-incident-reports/entities/violent-incident-report.entity';
import { Language } from 'src/languages/entities/language.entity';
import { SendTrainingLinksDto } from 'src/safety-management/training-admin/dto/send-training-links.dto';
import { WatchStatsDto } from 'src/safety-management/training-admin/dto/watch-stats.dto';
import { ItemCompletion } from 'src/training/items/entities/item-completion.entity';

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

const OrganizationsSubjects = [Organization, Unit, Location];
type OrganizationsSubjectTypes = InferSubjects<
  (typeof OrganizationsSubjects)[number]
>;

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
  | SafetyManagementSubjectTypes
  | FormsSubjectTypes
  | ResourceSubjectTypes
  | MediaSubjects
  | UserSubjectTypes
  | LanguageSubjectTypes;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: StatelessUser) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

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
    if (user.hasPermission(LEVEL.ADMIN, WRITE.ORGANIZATIONS)) {
      can(Action.Manage, OrganizationsSubjects);
    }

    if (user.hasPermission(READ.ORGANIZATIONS)) {
      can(Action.Read, OrganizationsSubjects);
    }

    // Anyone can read their own organization/unit. Fine grained access is managed
    // in organization service.
    can(Action.Read, [Organization, Unit]);

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
