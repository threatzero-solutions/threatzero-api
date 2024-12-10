import { MongoAbility } from '@casl/ability';
import { Action } from 'src/auth/casl/constants';
import { PolicyHandlerContext } from 'src/auth/casl/policies.guard';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export class EntityAbilityChecker {
  private target: EntityTarget<ObjectLiteral>;

  constructor(target: EntityTarget<ObjectLiteral>) {
    this.target = target;
  }

  handle(ability: MongoAbility, context: PolicyHandlerContext): boolean {
    let action: Action;
    switch (context.request.method) {
      case 'GET':
        action = Action.Read;
        break;
      case 'POST':
        action = Action.Create;
        break;
      case 'PATCH':
        action = Action.Update;
        break;
      case 'DELETE':
        action = Action.Delete;
        break;
      default:
        action = Action.Read;
        break;
    }

    return ability.can(action, this.target);
  }
}
