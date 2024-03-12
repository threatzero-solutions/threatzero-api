import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
  defineAbility,
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

export const CASL_ABILITY_FACTORY = 'CASL_ABILITY_FACTORY';

const TrainingSubjects = [Course, Section, Audience, Item];
type TrainingSubjectTypes = InferSubjects<(typeof TrainingSubjects)[number]>;

const OrganizationsSubjects = [Organization, Unit, Location];
type OrganizationsSubjectTypes = InferSubjects<
  (typeof OrganizationsSubjects)[number]
>;

type AllSubjectTypes = TrainingSubjectTypes | OrganizationsSubjectTypes;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: StatelessUser) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

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

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<AllSubjectTypes>,
    });
  }
}
