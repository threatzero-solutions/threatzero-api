export const ROLE_GROUP_PREFIX = '/Role Groups/';
export const TRAINING_PARTICIPANT_GROUP_NAME = 'Training Participant';

export const AUDIENCE_GROUP_PREFIX = '/Audiences/';

export const TRAINING_PARTICIPANT_ROLE_GROUP_PATH =
  ROLE_GROUP_PREFIX + TRAINING_PARTICIPANT_GROUP_NAME;

export const ALLOWED_DEFAULT_ROLE_GROUPS = [
  TRAINING_PARTICIPANT_GROUP_NAME,
] as const;
export type AllowedDefaultRoleGroups =
  (typeof ALLOWED_DEFAULT_ROLE_GROUPS)[number];

// IMPORTANT: These attributes should never conflict with system attributes, such
// as 'unit', 'organization', 'audience', etc.
export const ALLOWED_IMPORTED_ATTRIBUTES = [
  'firstName',
  'lastName',
  'email',
  'picture',
  // For Google.
  'organizationUnitPath',
  // Others.
  'location',
  'title',
  'jobTitle',
  'school',
] as const;

export type AllowedImportedAttribute =
  (typeof ALLOWED_IMPORTED_ATTRIBUTES)[number];
