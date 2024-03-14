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
import { Course } from 'src/training/courses/entities/course.entity';
import { Item } from 'src/training/items/entities/item.entity';
import { Section } from 'src/training/sections/entities/section.entity';
import { LEVEL, WRITE, READ } from '../permissions';
import { Action } from './actions';
import { ThreatAssessment } from 'src/threat-assessments/entities/threat-assessment.entity';
import { Form } from 'src/forms/forms/entities/form.entity';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import { Tip } from 'src/tips/entities/tip.entity';
import { Resource } from 'src/resources/entities/resource.entity';
import { VideoEvent } from 'src/media/entities/video-event.entity';

export const CASL_ABILITY_FACTORY = 'CASL_ABILITY_FACTORY';

const FormsSubjects = [Form, FieldGroup, Field];
type FormsSubjectTypes = InferSubjects<(typeof FormsSubjects)[number]>;

const TrainingSubjects = [Course, Section, Audience, Item];
type TrainingSubjectTypes = InferSubjects<(typeof TrainingSubjects)[number]>;

const OrganizationsSubjects = [Organization, Unit, Location];
type OrganizationsSubjectTypes = InferSubjects<
  (typeof OrganizationsSubjects)[number]
>;

const ThreatAssessmentSubjects = [ThreatAssessment];
type ThreatAssessmentSubjectTypes = InferSubjects<
  (typeof ThreatAssessmentSubjects)[number]
>;

const TipSubjects = [Tip];
type TipSubjectTypes = InferSubjects<(typeof TipSubjects)[number]>;

const ResourceSubjects = [Resource];
type ResourceSubjectTypes = InferSubjects<(typeof ResourceSubjects)[number]>;

type MediaSubjects = InferSubjects<typeof VideoEvent>;

type AllSubjectTypes =
  | TrainingSubjectTypes
  | OrganizationsSubjectTypes
  | ThreatAssessmentSubjectTypes
  | FormsSubjectTypes
  | TipSubjectTypes
  | ResourceSubjectTypes
  | MediaSubjects;

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

    // --------- THREAT ASSESSMENTS ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.THREAT_ASSESSMENTS)) {
      can(Action.Manage, ThreatAssessmentSubjects);
    }

    if (
      user.hasPermission(LEVEL.ORGANIZATION, WRITE.THREAT_ASSESSMENTS) ||
      user.hasPermission(LEVEL.UNIT, WRITE.THREAT_ASSESSMENTS)
    ) {
      can(Action.Create, ThreatAssessmentSubjects);
      can(Action.Update, ThreatAssessmentSubjects);
    }

    if (user.hasPermission(READ.THREAT_ASSESSMENTS)) {
      can(Action.Read, ThreatAssessmentSubjects);
    }

    // --------- TIPS ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.TIPS)) {
      can(Action.Manage, TipSubjects);
    }

    if (
      user.hasPermission(LEVEL.ORGANIZATION, WRITE.TIPS) ||
      user.hasPermission(LEVEL.UNIT, WRITE.TIPS)
    ) {
      can(Action.Update, TipSubjects);
    }

    if (user.hasPermission(READ.TIPS)) {
      can(Action.Read, TipSubjects);
    }

    // Anyone can submit a tip.
    can(Action.Create, [Tip]);

    // --------- RESOURCES ---------
    if (user.hasPermission(LEVEL.ADMIN, WRITE.RESOURCES)) {
      can(Action.Manage, ResourceSubjects);
    }

    // Anyone can read resources.
    can(Action.Read, ResourceSubjects);

    // --------- MEDIA ---------

    // Anyone can create video events.
    can(Action.Create, VideoEvent);

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<AllSubjectTypes>,
    });
  }
}
