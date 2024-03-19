import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import {
  CASL_ABILITY_FACTORY,
  CaslAbilityFactory,
} from './casl-ability.factory';
import { MongoAbility } from '@casl/ability';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth.guard';

export interface PolicyHandlerContext {
  request: Request;
}

interface IPolicyHandler {
  handle(ability: MongoAbility, context: PolicyHandlerContext): boolean;
}

type PolicyHandlerCallback = (
  ability: MongoAbility,
  context: PolicyHandlerContext,
) => boolean;

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

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const policyHandlers =
      this.reflector.getAllAndMerge<PolicyHandler[]>(CHECK_POLICIES_KEY, [
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

    if (!user) {
      return false;
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const policyHandlerContext: PolicyHandlerContext = {
      request,
    };

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability, policyHandlerContext),
    );
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: MongoAbility,
    context: PolicyHandlerContext,
  ) {
    if (typeof handler === 'function') {
      return handler(ability, context);
    }
    return handler.handle(ability, context);
  }
}
