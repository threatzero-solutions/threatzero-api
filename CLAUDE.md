# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run start:dev

# Run in debug mode
npm run start:debug

# Production mode
npm run start:prod
```

### Building
```bash
# Build the application
npm run build
```

### Testing
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Debug tests
npm run test:debug

# Run a single test file
npm run test -- path/to/file.spec.ts
```

### Code Quality
```bash
# Lint and auto-fix code
npm run lint

# Format code with Prettier
npm run format
```

### Database Migrations
```bash
# Create a new migration
npm run migrations:create -- --name=MigrationName

# Generate migration from entity changes
npm run migrations:generate -- --name=MigrationName

# Run migrations
npm run migrations

# Revert last migration
npm run migrations:revert
```

## Architecture Overview

### Technology Stack
- **Framework**: NestJS (v10) - Progressive Node.js framework
- **Language**: TypeScript with strict type checking
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Keycloak integration with JWT tokens and CASL for authorization
- **Queue System**: BullMQ with Redis for background jobs
- **Cloud Services**: AWS (S3, SES, Pinpoint SMS)
- **API**: RESTful with global `/api` prefix

### Module Structure

The application follows NestJS's modular architecture with domain-driven organization:

#### Core Infrastructure Modules
- **AuthModule**: Keycloak integration, JWT validation, CASL-based authorization, opaque token management
- **AwsModule**: AWS services integration (S3, SES, Pinpoint SMS)
- **NotificationsModule**: Queue-based notification processing

#### Business Domain Modules
- **OrganizationsModule**: Multi-tenant organization management with hierarchical units, locations, and user enrollment
- **TrainingModule**: Learning management system with courses, sections, items, audiences, and completion tracking
- **SafetyManagementModule**: Safety reporting (tips, threat assessments, violent incident reports), POC files, and watch statistics
- **FormsModule**: Dynamic form builder with field groups, submissions, and PDF generation
- **MediaModule**: Video management with Vimeo integration and event tracking
- **ResourcesModule**: Resource management system
- **LanguagesModule**: Multi-language support

### Key Patterns

#### Entity Base Class
All entities extend from `Base` entity (src/common/base.entity.ts) providing:
- UUID primary key
- CreatedOn/UpdatedOn timestamps with timezone

#### Service Architecture
- Services extend `BaseEntityService` for common CRUD operations
- Repository pattern with TypeORM
- DTOs for request/response validation using class-validator
- Query DTOs support pagination, filtering, and ordering

#### Authentication & Authorization
- JWT tokens validated through Keycloak
- CASL-based permission system with ability factory
- Guards for route protection
- User context available via CLS (Continuation Local Storage)

#### Request Processing Pipeline
1. Global throttling (600 requests/minute)
2. Helmet security headers and CORS
3. JWT authentication guard
4. CASL authorization policies
5. Scoped validation pipe for DTOs
6. TypeORM error filtering
7. Scoped class serializer for response transformation

#### Event-Driven Architecture
- NestJS EventEmitter for internal events
- BullMQ for async job processing
- Listeners for organization changes, tip submissions, audience updates

#### Multi-tenancy
- Organization-based data isolation
- Hierarchical structure: Organization → Units → Locations
- User enrollment and role management per organization

### Database Patterns
- Migrations in `src/migrations/` - ordered by timestamp
- Material views for performance (e.g., watch_stats)
- JSON columns for flexible metadata storage
- Soft deletes where applicable

### Testing Strategy
- Unit tests alongside source files (`*.spec.ts`)
- E2E tests in `test/` directory
- Jest as test runner with TypeScript support
- Test database configuration separate from development

### Environment Configuration
- ConfigModule with environment validation
- Modular config files in `src/config/`
- Support for AWS, Redis, Keycloak, Vimeo configurations
- Environment variables expanded and cached

### API Conventions
- RESTful endpoints with consistent naming
- Global `/api` prefix
- Paginated responses using `PaginatedDto`
- Query parameter validation and transformation
- Consistent error handling with TypeORM filter

### Security Considerations
- Helmet for security headers
- Rate limiting with throttler
- Input validation on all endpoints
- Scoped serialization to prevent data leaks
- Keycloak-based authentication
- Row-level security via CASL abilities