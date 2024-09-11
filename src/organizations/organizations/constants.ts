export const ALLOWED_DEFAULT_ROLE_GROUPS = ['Training Participant'] as const;
export type AllowedDefaultRoleGroups =
  (typeof ALLOWED_DEFAULT_ROLE_GROUPS)[number];
