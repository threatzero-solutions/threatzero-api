import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { DataSource, TreeRepository } from 'typeorm';
import { FieldGroup } from './entities/field-group.entity';
import { Form, FormState } from '../forms/entities/form.entity';

@Injectable()
export class FieldGroupsService extends BaseEntityService<FieldGroup> {
  private fieldGroupsRepository: TreeRepository<FieldGroup>;
  alias = 'field_group';

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

  async getRootGroup(fieldGroup: FieldGroup) {
    return this.fieldGroupsRepository
      .createAncestorsQueryBuilder('group', 'groupClosure', fieldGroup)
      .leftJoinAndSelect('group.form', 'form')
      .andWhere('form IS NOT NULL')
      .getOne();
  }

  async beforeRemove(id: string): Promise<void> {
    const [existingGroup, form] = await this.getGroupAndForm(id);
    if (form && form.state === FormState.PUBLISHED) {
      throw new BadRequestException('Cannot delete group from published form.');
    }
  }

  private async getGroupAndForm(id: FieldGroup['id']) {
    const existingGroup = await this.getRepository().findOneOrFail({
      where: { id },
      relations: {
        form: true,
      },
    });
    const form = await this.getFormByFieldGroup(existingGroup);

    return [existingGroup, form] as const;
  }

  private async getFormByFieldGroup(fieldGroup?: FieldGroup | null) {
    if (fieldGroup?.form) {
      return fieldGroup.form;
    }

    if (fieldGroup) {
      return (await this.getRootGroup(fieldGroup))?.form;
    }
  }
}
