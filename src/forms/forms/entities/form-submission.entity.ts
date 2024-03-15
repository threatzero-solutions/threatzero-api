import { Base } from 'src/common/base.entity';
import { Column, Entity, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { Form } from './form.entity';
import FieldResponse from 'src/forms/fields/entities/field-response.entity';

export enum FormSubmissionState {
  NOT_COMPLETE = 'not_complete',
  COMPLETE = 'complete',
}

@Entity()
export class FormSubmission extends Base {
  @OneToMany(
    () => FieldResponse,
    (fieldResponse) => fieldResponse.formResponse,
    {
      cascade: ['insert', 'update'],
      eager: true,
    },
  )
  fieldResponses: Relation<FieldResponse>[];

  @Column({ nullable: true })
  formId: string | null;

  @ManyToOne(() => Form, (form) => form.formSubmissions)
  form: Relation<Form>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  userId: string | null;

  @Column({ type: 'inet', nullable: true })
  ipv4: string | null;

  @Column({ type: 'inet', nullable: true })
  ipv6: string | null;

  @Column({ default: FormSubmissionState.NOT_COMPLETE })
  status: FormSubmissionState;

  sign(signer: (key: string) => string) {
    this.fieldResponses &&= this.fieldResponses.map((fieldResponse) =>
      fieldResponse.sign(signer),
    );
  }

  async persistUploads(onPersist: (key: string) => Promise<string>) {
    this.fieldResponses &&= await Promise.all(
      this.fieldResponses.map((fieldResponse) =>
        fieldResponse.persistUploads(onPersist),
      ),
    );

    return this;
  }
}
