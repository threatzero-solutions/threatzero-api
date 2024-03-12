import { Base } from 'src/common/base.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { Column, Entity, ManyToOne, type Relation } from 'typeorm';
import { Field } from './field.entity';

@Entity()
class FieldResponse extends Base {
  @Column({ type: 'jsonb' })
  value: any;

  @ManyToOne(() => Field, {
    eager: true,
  })
  field: Relation<Field>;

  @ManyToOne(
    () => FormSubmission,
    (formResponse) => formResponse.fieldResponses,
    {
      onDelete: 'CASCADE',
    },
  )
  formResponse: Relation<FormSubmission>;

  loadedValue?: any;

  // @AfterLoad()
  // afterLoad() {
  // 	this.loadedValue = this.value;

  // 	if (
  // 		typeof this.value === "object" &&
  // 		this.value.dataType === "file-uploads" &&
  // 		this.value.keys
  // 	) {
  // 		this.loadedValue = (this.value.keys as string[]).map((fileKey) => ({
  // 			key: fileKey,
  // 			token: getSignedTokenForKey(fileKey),
  // 		}));
  // 	}
  // }

  // @BeforeInsert()
  // @BeforeUpdate()
  // async beforeSave() {
  // 	if (
  // 		typeof this.value === "object" &&
  // 		this.value.dataType === "file-uploads" &&
  // 		this.value.keys
  // 	) {
  // 		this.value.keys = (this.value.keys as unknown[]).map((fileKey) =>
  // 			`${fileKey}`.replace(/^\//, ""),
  // 		);

  // 		for (let idx = 0; idx < this.value.keys.length; idx++) {
  // 			const fileKeyToPersist = this.value.keys[idx];
  // 			try {
  // 				// Will ignore non-temp files as they are considered already persisted.
  // 				this.value.keys[idx] = await persistFileUpload(fileKeyToPersist);
  // 			} catch (e) {
  // 				logger.error({
  // 					error: e,
  // 					message:
  // 						"Failed to persist file upload for key: " + fileKeyToPersist,
  // 				});

  // 				throw Error(
  // 					"Failed to persist file upload for key: " + fileKeyToPersist,
  // 				);
  // 			}
  // 		}
  // 	}
  // }
}

export default FieldResponse;
