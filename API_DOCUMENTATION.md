# ThreatZero API - Complete Endpoint & Background Process Documentation

This document provides a comprehensive inventory of all REST API endpoints and background processes in the ThreatZero API for planning a full rebuild.

---

## Table of Contents

1. [REST API Endpoints](#rest-api-endpoints)
   - [Root & Health](#root--health)
   - [Admin](#admin)
   - [Users](#users)
   - [Languages](#languages)
   - [Media](#media)
   - [Resources](#resources)
   - [Notifications](#notifications)
   - [Organizations](#organizations)
   - [Training](#training)
   - [Safety Management](#safety-management)
   - [Forms](#forms)
2. [Background Jobs (BullMQ)](#background-jobs-bullmq)
3. [Event Listeners](#event-listeners)
4. [Scheduled Tasks (Cron)](#scheduled-tasks-cron)
5. [Authentication & Authorization](#authentication--authorization)

---

## REST API Endpoints

All endpoints are prefixed with `/api` (global prefix).

### Root & Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Returns "Hello World" (basic health check) |
| GET | `/health` | **Public** | Health check endpoint (checks NestJS docs ping + database) |

---

### Admin

**Base Path:** `/api/admin`
**Authorization:** Requires `LEVEL.ADMIN` permission

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-test-training-reminder-email` | Admin | Send a test training reminder email |

---

### Users

**Base Path:** `/api/users`
**Authorization:** Entity-based ability check on `UserRepresentation`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sync-missing-users` | Admin | Sync missing local users from item completions |
| POST | `/sync-missing-local-users-from-opaque-tokens` | Admin | Sync missing local users from opaque tokens |
| GET | `/training-token/:token` | Yes | Get a specific training token by value |
| GET | `/training-token` | Yes | Find training tokens (with query filters) |
| POST | `/training-token` | Yes | Create training token(s) - accepts single or array |
| DELETE | `/training-token/:token` | Yes | Delete a training token |

---

### Languages

**Base Path:** `/api/languages`
**Authorization:** Entity-based ability check on `Language`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new language |
| GET | `/` | Yes | Get all languages (with query params) |
| GET | `/:id` | Yes | Get language by ID |
| PATCH | `/:id` | Yes | Update a language |
| DELETE | `/:id` | Yes | Delete a language |

---

### Media

**Base Path:** `/api/media`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/video/events` | **Public** | Receive video events (Vimeo webhook), query param `watch_id` optional |

---

### Resources

**Base Path:** `/api/resources`
**Authorization:** Entity-based ability check on `ResourceItem`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new resource |
| GET | `/` | Yes | Get all resources (with query params) |
| GET | `/:id` | Yes | Get resource by ID |
| PATCH | `/:id` | Yes | Update a resource |
| DELETE | `/:id` | Yes | Delete a resource |

---

### Notifications

**Base Path:** `/api/notifications`
**Authorization:** Requires `LEVEL.ADMIN` permission

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/job-queues` | Admin | Get status of all job queues |
| POST | `/job-queues/:queueName/retry-job/:jobId` | Admin | Retry a failed job |
| POST | `/job-queues/:queueName/remove-job/:jobId` | Admin | Remove a job from queue |

---

### Organizations

#### Organizations Controller

**Base Path:** `/api/organizations/organizations`
**Authorization:** Entity-based ability check on `Organization`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new organization |
| GET | `/` | Yes | Get all organizations (with query params) |
| GET | `/slug-unique` | Yes | Check if organization slug is unique |
| GET | `/idp-slug-unique` | Yes | Check if IDP alias is unique |
| GET | `/slug/:slug` | Yes | Get organization by slug |
| GET | `/mine` | **Public** | Get current user's organization |
| GET | `/:id` | Yes | Get organization by ID |
| PATCH | `/:id` | Yes | Update an organization |
| DELETE | `/:id` | Yes | Delete an organization |
| POST | `/:id/lms-tokens` | LmsTokenSubject.Create | Create LMS viewership token |
| GET | `/:id/lms-tokens` | LmsTokenSubject.Read | Get LMS tokens for organization |
| PATCH | `/:id/lms-tokens/expiration` | LmsTokenSubject.Update | Set LMS token expiration |
| GET | `/:id/lms-tokens/scorm` | LmsScormPackageSubject.Read | Download SCORM package |
| POST | `/:id/idps/load-imported-config/:protocol` | CreateOrganizationIdpDto | Import IDP configuration (file upload) |
| GET | `/:id/role-groups` | Yes | Get role groups for organization |
| GET | `/:id/idps/:slug` | CreateOrganizationIdpDto.Read | Get IDP by slug |
| POST | `/:id/idps` | CreateOrganizationIdpDto.Create | Create new IDP |
| PUT | `/:id/idps/:slug` | CreateOrganizationIdpDto.Update | Update IDP |
| DELETE | `/:id/idps/:slug` | CreateOrganizationIdpDto.Delete | Delete IDP |
| POST | `/:id/generate-policy-upload-urls` | Organization.Update | Generate presigned upload URLs for policies |

#### Organization Users Controller

**Base Path:** `/api/organizations/organizations/:id/users`
**Authorization:** Entity-based ability check on `OrganizationUserDto`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get users for organization |
| POST | `/` | Yes | Create a new organization user |
| PATCH | `/:userId` | Yes | Update an organization user |
| DELETE | `/:userId` | Yes | Delete an organization user |
| POST | `/:userId/deactivate` | Yes | Deactivate a user |
| POST | `/:userId/activate` | Yes | Activate a user |
| POST | `/:userId/assign-role-group` | Yes | Assign user to role group |
| POST | `/:userId/revoke-role-group` | Yes | Revoke user from role group |

#### Course Enrollments Controller

**Base Path:** `/api/organizations/organizations/:id/enrollments`
**Authorization:** Entity-based ability check on `CourseEnrollment`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get enrollments for organization |
| GET | `/latest` | Yes | Get latest course enrollments |
| GET | `/:enrollmentId/relative` | Yes | Get relative enrollment |
| GET | `/:enrollmentId/previous` | Yes | Get previous enrollment |
| GET | `/:enrollmentId/next` | Yes | Get next enrollment |
| POST | `/` | Yes | Create a new course enrollment |
| GET | `/:enrollmentId` | Yes | Get enrollment by ID |
| PATCH | `/:enrollmentId` | Yes | Update an enrollment |
| DELETE | `/:enrollmentId` | Yes | Delete an enrollment |

#### Units Controller

**Base Path:** `/api/organizations/units`
**Authorization:** Entity-based ability check on `Unit`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new unit |
| GET | `/` | Yes | Get all units (with query params) |
| GET | `/slug-unique` | Yes | Check if unit slug is unique within organization |
| GET | `/:id` | Yes | Get unit by ID |
| PATCH | `/:id` | Yes | Update a unit |
| DELETE | `/:id` | Yes | Delete a unit |
| POST | `/:id/generate-policy-upload-urls` | Unit.Update | Generate presigned upload URLs |

#### Locations Controller

**Base Path:** `/api/organizations/locations`
**Authorization:** Entity-based ability check on `Location`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new location |
| GET | `/` | Yes | Get all locations (with query params) |
| GET | `/:id` | Yes | Get location by ID |
| PATCH | `/:id` | Yes | Update a location |
| DELETE | `/:id` | Yes | Delete a location |
| GET | `/:id/sos-qr-code/` | Yes | Generate QR code for SOS/tip submission |

---

### Training

#### Courses Controller

**Base Path:** `/api/training/courses`
**Authorization:** Entity-based ability check on `TrainingCourse`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new course |
| GET | `/` | Yes | Get all courses (with query params) |
| GET | `/:id` | Yes | Get course by ID |
| PATCH | `/:id` | Yes | Update a course |
| DELETE | `/:id` | Yes | Delete a course |

#### Sections Controller

**Base Path:** `/api/training/sections`
**Authorization:** Entity-based ability check on `TrainingSection`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new section |
| GET | `/` | Yes | Get all sections (with query params) |
| GET | `/:id` | Yes | Get section by ID |
| PATCH | `/:id` | Yes | Update a section |
| DELETE | `/:id` | Yes | Delete a section |

#### Items Controller

**Base Path:** `/api/training/items`
**Authorization:** Entity-based ability check on `TrainingItem` (with some public endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/my-completions` | **Public** | Create completion for current user (via `watch_id` token) |
| GET | `/my-completions` | **Public** | Get completions for current user (via `watch_id` token) |
| PATCH | `/my-completions/:id` | **Public** | Update completion for current user |
| PUT | `/my-completions` | **Public** | Update or create completion for current user |
| GET | `/completions` | ItemCompletion | Get all item completions (admin) |
| GET | `/completions/summary` | ItemCompletion | Get completions summary/statistics |
| GET | `/completions/csv` | ItemCompletion | Download completions as CSV |
| POST | `/` | Yes | Create a new training item |
| GET | `/` | Yes | Get all training items (with query params) |
| GET | `/:id` | Yes | Get training item by ID |
| GET | `/watch/:id` | **Public** | Get item for watching (via `watch_id` token) |
| GET | `/lms-watch/:id` | **Public** | Get item for LMS viewing (via `lms_id` token) |
| PATCH | `/:id` | Yes | Update a training item |
| DELETE | `/:id` | Yes | Delete a training item |

#### Audiences Controller

**Base Path:** `/api/training/audiences`
**Authorization:** Entity-based ability check on `Audience`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new audience |
| GET | `/` | Yes | Get all audiences (with query params) |
| GET | `/:id` | Yes | Get audience by ID |
| PATCH | `/:id` | Yes | Update an audience |
| DELETE | `/:id` | Yes | Delete an audience |

---

### Safety Management

#### Tips Controller

**Base Path:** `/api/tips`
**Authorization:** Entity-based ability check on `Tip`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/submit` | **Public** (throttled 3/3min) | Submit a new safety tip |
| GET | `/submissions` | Yes | Get all tip submissions |
| GET | `/submissions/:id` | Yes | Get tip by ID |
| GET | `/form` | **Public** | Get tip submission form (by ID or language) |
| GET | `/forms` | **Public** | Get all tip forms |
| GET | `/submissions/:id/pdf` | Yes | Generate PDF for tip submission |
| PATCH | `/submissions/:id` | Yes | Update a tip |
| DELETE | `/submissions/:id` | Yes | Delete a tip |
| POST | `/submissions/presigned-upload-urls` | **Public** (throttled 10/30s) | Get presigned URLs for file uploads |
| POST | `/submissions/:tipId/notes` | Yes | Add note to tip |
| GET | `/submissions/:tipId/notes` | Yes | Get notes for tip |
| PATCH | `/submissions/:tipId/notes/:noteId` | Yes | Edit a note |
| DELETE | `/submissions/:tipId/notes/:noteId` | Yes | Delete a note |
| GET | `/stats` | Yes | Get tip submission statistics |

#### Threat Assessments Controller

**Base Path:** `/api/assessments`
**Authorization:** Entity-based ability check on `ThreatAssessment`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/submissions` | Yes | Create a new threat assessment |
| GET | `/submissions` | Yes | Get all threat assessments |
| GET | `/submissions/:id` | Yes | Get assessment by ID |
| GET | `/form` | Yes | Get assessment form (by ID or language) |
| GET | `/forms` | Yes | Get all assessment forms |
| GET | `/submissions/:id/pdf` | Yes | Generate PDF for assessment |
| PATCH | `/submissions/:id` | Yes | Update an assessment |
| DELETE | `/submissions/:id` | Yes | Delete an assessment |
| POST | `/submissions/presigned-upload-urls` | Yes | Get presigned URLs for file uploads |
| POST | `/submissions/:assessmentId/notes` | Yes | Add note to assessment |
| GET | `/submissions/:assessmentId/notes` | Yes | Get notes for assessment |
| PATCH | `/submissions/:assessmentId/notes/:noteId` | Yes | Edit a note |
| DELETE | `/submissions/:assessmentId/notes/:noteId` | Yes | Delete a note |
| GET | `/stats` | Yes | Get assessment statistics |

#### Violent Incident Reports Controller

**Base Path:** `/api/violent-incident-reports`
**Authorization:** Entity-based ability check on `ViolentIncidentReport`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/submissions` | Yes | Create a new violent incident report |
| GET | `/submissions` | Yes | Get all violent incident reports |
| GET | `/submissions/:id` | Yes | Get report by ID |
| GET | `/form` | Yes | Get report form (by ID or language) |
| GET | `/forms` | Yes | Get all report forms |
| GET | `/submissions/:id/pdf` | Yes | Generate PDF for report |
| PATCH | `/submissions/:id` | Yes | Update a report |
| DELETE | `/submissions/:id` | Yes | Delete a report |
| POST | `/submissions/presigned-upload-urls` | Yes | Get presigned URLs for file uploads |
| POST | `/submissions/:id/notes` | Yes | Add note to report |
| GET | `/submissions/:id/notes` | Yes | Get notes for report |
| PATCH | `/submissions/:id/notes/:noteId` | Yes | Edit a note |
| DELETE | `/submissions/:id/notes/:noteId` | Yes | Delete a note |
| GET | `/stats` | Yes | Get report statistics |

#### POC Files Controller

**Base Path:** `/api/safety-management/poc-files`
**Authorization:** Entity-based ability check on `POCFile`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new POC file |
| GET | `/` | Yes | Get all POC files |
| GET | `/:id` | Yes | Get POC file by ID |
| PATCH | `/:id` | Yes | Update a POC file |
| DELETE | `/:id` | Yes | Delete a POC file |
| PUT | `/:id/peer-units/:peerUnitId` | Yes | Add peer unit to POC file |
| DELETE | `/:id/peer-units/:peerUnitId` | Yes | Remove peer unit from POC file |
| PUT | `/:id/tips/:tipId` | Yes | Add tip to POC file |
| DELETE | `/:id/tips/:tipId` | Yes | Remove tip from POC file |
| PUT | `/:id/assessments/:assessmentId` | Yes | Add assessment to POC file |
| DELETE | `/:id/assessments/:assessmentId` | Yes | Remove assessment from POC file |

#### Training Admin Controller

**Base Path:** `/api/training-admin`
**Authorization:** Entity-based ability check on `SendTrainingLinksDto`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/invites` | Yes | Send training invitation links |
| POST | `/invites/resend` | Yes | Resend training invitation links |
| GET | `/invites` | Yes | Get training invitation links |
| GET | `/invites/csv/` | Yes | Download training links as CSV |

---

### Forms

#### Forms Controller

**Base Path:** `/api/forms`
**Authorization:** Entity-based ability check on `Form`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new form |
| POST | `/:id/new-draft` | Yes | Create a new draft version of form |
| GET | `/` | Yes | Get all forms |
| GET | `/grouped-by-slug` | Yes | Get forms grouped by slug |
| GET | `/:id` | Yes | Get form by ID |
| GET | `/:id/pdf` | Yes | Generate PDF for form |
| PATCH | `/:id` | Yes | Update a form |
| DELETE | `/:id` | Yes | Delete a form |

#### Field Groups Controller

**Base Path:** `/api/forms/groups`
**Authorization:** Entity-based ability check on `FieldGroup`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new field group |
| GET | `/` | Yes | Get all field groups |
| GET | `/:id` | Yes | Get field group by ID |
| PATCH | `/:id` | Yes | Update a field group |
| DELETE | `/:id` | Yes | Delete a field group |

#### Fields Controller

**Base Path:** `/api/forms/fields`
**Authorization:** Entity-based ability check on `Field`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create a new field |
| GET | `/` | Yes | Get all fields |
| GET | `/:id` | Yes | Get field by ID |
| PATCH | `/:id` | Yes | Update a field |
| DELETE | `/:id` | Yes | Delete a field |

---

## Background Jobs (BullMQ)

**Queue Name:** `notifications`
**Queue Prefix:** Configurable via constants

### Job Types

| Job Name | Description | Payload |
|----------|-------------|---------|
| `send-email-notification` | Send an email via AWS SES | `{ to: string[], templateName: string, context: object }` |
| `send-sms-notification` | Send an SMS via AWS Pinpoint | `{ to: string, messageBody: string }` |
| `send-new-tip-notifications` | Send notifications to TAT members for new tip | `{ tipId: string }` |

### Notification Processor Details

**File:** `src/notifications/notifications.processor.ts`

- **Email Notifications:** Uses AWS SES with templates
- **SMS Notifications:** Uses AWS Pinpoint SMS, throttled at ~3 messages/second
- **New Tip Notifications:**
  - Looks up TAT (Threat Assessment Team) members from Keycloak groups
  - Supports both legacy (per-org/unit groups) and new (role-based) TAT member assignment
  - Sends both email and SMS to TAT members with SOS notifications enabled
  - Caches TAT member contacts for 5 minutes in Redis

---

## Event Listeners

### Tip Submission Listener

**File:** `src/safety-management/tips/listeners/submit-tip.listener.ts`
**Event:** `tip.submitted`

**Behavior:**
- Triggered when a new tip is submitted
- Adds a `send-new-tip-notifications` job to the notifications queue

---

### Audience Change Listener

**File:** `src/training/listeners/audience-change.listener.ts`
**Events:** `audience.changed`, `audience.removed`

**Behavior on `audience.changed`:**
- Creates/updates a Keycloak group for the audience
- Stores the `groupId` on the Audience entity

**Behavior on `audience.removed`:**
- Deletes the corresponding Keycloak group

---

### Organization Change Listener

**File:** `src/organizations/listeners/organization-change.listener.ts`
**Events:** `organization.changed`, `organization.removed`, `unit.changed`, `unit.removed`

**Behavior on `organization.changed`:**
- Ensures organization has a default unit
- Creates/updates Keycloak group for organization
- Creates organization TAT group
- Creates "Unit TATs" subgroup

**Behavior on `organization.removed`:**
- Deletes the default unit
- Deletes the Keycloak organization group

**Behavior on `unit.changed`:**
- Creates/updates Keycloak TAT group for the unit (under "Unit TATs" parent)

**Behavior on `unit.removed`:**
- Deletes the unit's TAT group from Keycloak

---

## Scheduled Tasks (Cron)

### Training Reminder Task

**File:** `src/training/reminders/training-reminder.tasks.ts`
**Schedule:** `EVERY_DAY_AT_NOON` (12:00 PM server time)

**Behavior:**
1. Queries all active course enrollments (start date ≤ today ≤ end date)
2. For each enrollment, calculates section availability dates
3. Sends **initial reminder emails** on first weekday of section availability (if enabled)
4. Sends **follow-up reminder emails** at midpoint of section availability (if enabled) - only for users who haven't completed
5. Creates opaque tokens for training links valid for 30 days
6. Queues email notifications via BullMQ

---

### User Sync Task

**File:** `src/users/tasks/user-sync.task.ts`
**Schedule:** `0 0 * * *` (midnight daily)

**Behavior:**
- Syncs missing local users from opaque tokens
- Ensures all opaque token users have corresponding local user records

---

## Authentication & Authorization

### Authentication Methods

1. **JWT (Keycloak):** Primary authentication via Keycloak-issued JWT tokens
2. **Opaque Tokens:** Used for anonymous/unauthenticated training access
   - Created via `POST /users/training-token`
   - Validated via `watch_id` query parameter on training endpoints
3. **LMS Tokens:** Special tokens for LMS/SCORM integration
   - Created via `POST /organizations/:id/lms-tokens`
   - Validated via `lms_id` query parameter

### Authorization System

- **CASL-based:** Permissions defined using CASL ability factory
- **Entity-based checks:** Most endpoints use `EntityAbilityChecker` decorator
- **Permission levels:** `LEVEL.ADMIN` for admin-only endpoints
- **Special subjects:** `LmsTokenSubject`, `LmsScormPackageSubject` for LMS operations

### Public Endpoints (No Auth Required)

- `GET /health`
- `GET /organizations/organizations/mine`
- `POST /media/video/events`
- `POST /tips/submit`
- `GET /tips/form`
- `GET /tips/forms`
- `POST /tips/submissions/presigned-upload-urls`
- `POST /training/items/my-completions`
- `GET /training/items/my-completions`
- `PATCH /training/items/my-completions/:id`
- `PUT /training/items/my-completions`
- `GET /training/items/watch/:id`
- `GET /training/items/lms-watch/:id`

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total REST Endpoints** | ~120 |
| **Controllers** | 21 |
| **Public Endpoints** | 15 |
| **Background Job Types** | 3 |
| **Event Listeners** | 4 (handling 6 events) |
| **Scheduled Tasks** | 2 |
| **Keycloak Integrations** | Organization groups, Unit TAT groups, Audience groups, Role groups |
| **AWS Integrations** | S3 (presigned URLs), SES (email), Pinpoint SMS |
| **External Integrations** | Vimeo (video events) |

---

## Key Design Patterns to Consider for Rebuild

1. **Multi-tenancy:** Organization-based data isolation
2. **Hierarchical Structure:** Organization → Units → Locations
3. **Training Tracking:** Items → Sections → Courses → Enrollments → Completions
4. **Anonymous Access:** Opaque token system for training participants without accounts
5. **LMS Integration:** SCORM package generation, LMS-specific tokens
6. **Form Builder:** Dynamic forms with field groups, fields, and PDF generation
7. **Safety Reporting:** Tips, Threat Assessments, Violent Incident Reports with notes and attachments
8. **POC (Person of Concern) Files:** Aggregates tips and assessments
9. **Notification System:** Queue-based email/SMS with TAT member lookups
10. **Keycloak Sync:** Groups and user attributes synced to Keycloak for SSO
