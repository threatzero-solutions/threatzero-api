import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { DataSource, TreeRepository } from 'typeorm';
import { FieldGroup } from './entities/field-group.entity';
import { Form } from '../forms/entities/form.entity';

@Injectable()
export class FieldGroupsService extends BaseEntityService<FieldGroup> {
  private fieldGroupsRepository: TreeRepository<FieldGroup>;
  constructor(private dataSource: DataSource) {
    super();
    this.fieldGroupsRepository = this.dataSource.getTreeRepository(FieldGroup);
  }

  getRepository() {
    return this.fieldGroupsRepository;
  }

  async getDescendantGroupsForForm(form: Form) {
    const formGroupPromises =
      form.groups?.map((parentGroup) =>
        this.fieldGroupsRepository.findDescendantsTree(parentGroup, {
          relations: ['fields'],
        }),
      ) ?? [];

    return await Promise.all(formGroupPromises);
  }

  // Add additional field group validation.
}
