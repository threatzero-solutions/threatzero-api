import { BadRequestException, Injectable } from '@nestjs/common';
import { Field } from './entities/field.entity';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { FormState } from '../forms/entities/form.entity';

@Injectable()
export class FieldsService extends BaseEntityService<Field> {
  constructor(
    @InjectRepository(Field) private fieldsRepository: Repository<Field>,
    private groupsService: FieldGroupsService,
  ) {
    super();
  }

  getRepository() {
    return this.fieldsRepository;
  }

  async update(id: Field['id'], updateFieldDto: DeepPartial<Field>) {
    const [existingField, form] = await this.getFieldAndForm(id);

    // Validate changes.
    if (form) {
      existingField.validateChanges(form, updateFieldDto);
    }

    // Save changes if validation passes.
    const entity = await this.getRepository().save({
      id,
      ...updateFieldDto,
    });
    return await this.mapResult(entity);
  }

  async beforeRemove(id: string): Promise<void> {
    const form = (await this.getFieldAndForm(id))[1];
    if (form && form.state === FormState.PUBLISHED) {
      throw new BadRequestException('Cannot delete field from published form.');
    }
  }

  private async getFieldAndForm(id: Field['id']) {
    const existingField = await this.getRepository().findOneOrFail({
      where: { id },
      relations: {
        group: true,
        form: true,
      },
    });
    const form = await this.getFormByField(existingField);

    return [existingField, form] as const;
  }

  private async getFormByField(field?: Field | null) {
    if (field?.group) {
      const rootGroup = await this.groupsService.getRootGroup(field.group);
      return rootGroup?.form;
    }

    return field?.form;
  }
}
