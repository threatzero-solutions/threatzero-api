import { MongoAbility } from '@casl/ability';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../auth.guard';
import {
  CASL_ABILITY_FACTORY,
  CaslAbilityFactory,
} from './casl-ability.factory';

export interface PolicyHandlerContext {
  request: Request;
}

interface IPolicyHandler {
  handle(
    ability: MongoAbility,
    context: PolicyHandlerContext,
  ): boolean | Promise<boolean>;
}

type PolicyHandlerCallback = (
  ability: MongoAbility,
  context: PolicyHandlerContext,
) => boolean | Promise<boolean>;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(CASL_ABILITY_FACTORY)
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: Request = context.switchToHttp().getRequest();
    const { user } = request;

    if (isPublic) {
      return true;
    }

    if (!user || policyHandlers.length === 0) {
      return false;
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const policyHandlerContext: PolicyHandlerContext = {
      request,
    };

    return await this.execAllPolicyHandlers(
      policyHandlers,
      ability,
      policyHandlerContext,
    );
  }

  private async execPolicyHandler(
    handler: PolicyHandler,
    ability: MongoAbility,
    context: PolicyHandlerContext,
  ) {
    if (typeof handler === 'function') {
      return await handler(ability, context);
    }
    return handler.handle(ability, context);
  }

  private async execAllPolicyHandlers(
    handlers: PolicyHandler[],
    ability: MongoAbility,
    context: PolicyHandlerContext,
  ) {
    return await Promise.all(
      handlers.map((handler) =>
        this.execPolicyHandler(handler, ability, context),
      ),
    ).then((results) => results.every(Boolean));
  }
}
