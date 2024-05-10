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
  EntityManager,
  SelectQueryBuilder,
  Not,
  Equal,
  ManyToOne,
} from 'typeorm';
import { FormSubmission } from './form-submission.entity';
import { Request } from 'express';
import { isIPv4, isIPv6 } from 'net';
import { BadRequestException } from '@nestjs/common';
import { Language } from 'src/languages/entities/language.entity';

export enum FormState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity()
@Check("state = 'draft' OR (state = 'published' AND version > 0)")
@Unique(['slug', 'version', 'language'])
export class Form extends Base {
  @Index()
  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'int' })
  version: number;

  @ManyToOne(() => Language, {
    eager: true,
    nullable: true,
  })
  language: Relation<Language>;

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

  async validateChanges(
    changes: DeepPartial<Form>,
    qb: SelectQueryBuilder<Form>,
  ) {
    if (this.state === FormState.PUBLISHED) {
      if (changes.state === FormState.DRAFT) {
        throw new BadRequestException(
          'Form cannot be changed from published to draft.',
        );
      }

      changes.version = this.version;
    } else if (changes.slug && changes.state === FormState.PUBLISHED) {
      const previousForm = await qb
        .select('form.version')
        .where({
          slug: changes.slug,
          version: Not(Equal(0)),
          language: { id: changes.language?.id },
        })
        .orderBy({ version: 'DESC' })
        .getOne();

      if (previousForm?.version) {
        changes.version = previousForm.version + 1;
      } else {
        changes.version = 1;
      }
    }

    return changes;
  }

  async asNewDraft(manager: EntityManager, languageId: string) {
    let newDraft: Form = {
      ...this,
      version: 0,
      state: FormState.DRAFT,
      language: { id: languageId },
    };

    Reflect.deleteProperty(newDraft, 'id');
    Reflect.deleteProperty(newDraft, 'groups');
    Reflect.deleteProperty(newDraft, 'fields');
    Reflect.deleteProperty(newDraft, 'formSubmissions');

    newDraft = await manager.save(Form, newDraft);

    if (this.fields) {
      await Promise.all(this.fields.map((f) => f.clone(manager, newDraft)));
    }

    if (this.groups) {
      await Promise.all(this.groups.map((g) => g.clone(manager, newDraft)));
    }

    return newDraft;
  }

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
