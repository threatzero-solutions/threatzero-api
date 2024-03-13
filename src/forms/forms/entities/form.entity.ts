import { Base } from 'src/common/base.entity';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Field } from 'src/forms/fields/entities/field.entity';
import {
  Entity,
  Check,
  Unique,
  Column,
  Index,
  OneToMany,
  Relation,
  DeepPartial,
} from 'typeorm';
import { FormSubmission } from './form-submission.entity';
import { Request } from 'express';
import { isIPv4, isIPv6 } from 'net';
import { BadRequestException } from '@nestjs/common';

export enum FormState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity()
@Check("state = 'draft' OR (state = 'published' AND version > 0)")
@Unique(['slug', 'version'])
export class Form extends Base {
  @Index()
  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Field, (field) => field.form, {
    eager: true,
  })
  fields: Relation<Field>[];

  @OneToMany(() => FieldGroup, (group) => group.form, {
    eager: true,
  })
  groups: Relation<FieldGroup>[];

  @OneToMany(() => FormSubmission, (formSubmission) => formSubmission.form)
  formSubmissions: Relation<FormSubmission>[];

  @Column({ default: FormState.DRAFT })
  state: FormState;

  getAllFields() {
    const allFields = [...this.fields];
    const _addFieldsFromGroup = (group: FieldGroup) => {
      allFields.push(...group.fields);
      group.childGroups?.forEach(_addFieldsFromGroup);
    };
    this.groups.forEach(_addFieldsFromGroup);
    return allFields;
  }

  validateSubmission(
    submission: DeepPartial<FormSubmission>,
    request?: Request,
  ) {
    submission.form = this;

    // Prepare responses.
    const fieldResponseMap = new Map();
    for (const response of submission.fieldResponses ?? []) {
      const id =
        typeof response.field === 'string'
          ? response.field
          : response.field?.id;
      fieldResponseMap.set(id, response);
    }

    // Validate responses against form fields.
    const validFieldResponses = [];
    const validationErrors: string[] = [];

    for (const field of this.getAllFields()) {
      const response = fieldResponseMap.get(field.id);

      if (!response) {
        if (field.required) {
          validationErrors.push(`field "${field.name}" is required`);
        }
        continue;
      }

      // TODO: Not absolutely necessary, but it would be good to validate
      // response types against the field types.

      validFieldResponses.push(response);
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }

    submission.fieldResponses = validFieldResponses;

    if (request) {
      submission.userId = request.user?.id ?? null;

      // Add IP address if possible.
      const ip = request.ip;
      if (ip && isIPv4(ip)) {
        submission.ipv4 = ip;
      } else if (ip && isIPv6(ip)) {
        submission.ipv6 = ip;
      }
    }

    return submission;
  }
}
