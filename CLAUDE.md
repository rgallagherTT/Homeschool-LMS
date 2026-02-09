# CLAUDE.md - AI Assistant Guide for Zoho CRM Plus Clone

## Project Overview

This repository contains a **Zoho CRM Plus Clone** - a unified customer experience platform combining CRM (sales automation), marketing automation, customer service/helpdesk, analytics, and team collaboration into a single platform.

**Target users**: Small to Medium Businesses (5-500 employees)
**Current status**: Pre-implementation (requirements phase). The `README.md` contains the full Product Requirements Document (PRD).

## Repository Structure

```
/
├── README.md          # Full PRD (56KB) - the source of truth for all requirements
├── CLAUDE.md          # This file - AI assistant guide
└── .git/              # Git repository
```

No source code has been implemented yet. Development begins with Phase 1 (MVP).

## Tech Stack (from PRD)

### Backend
- **Framework**: Node.js with NestJS or Express (alternatively Python with Django/FastAPI)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ (primary relational store)
- **Analytics DB**: ClickHouse or TimescaleDB
- **Cache**: Redis 7+ (sessions, real-time features)
- **Search**: Elasticsearch 8+ (full-text search)
- **Queue**: RabbitMQ or Apache Kafka (async processing)
- **Object Storage**: MinIO or AWS S3

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Components**: Material-UI or Ant Design
- **Charts**: Chart.js, Recharts, or D3.js
- **Real-time**: Socket.io or WebSockets
- **Mobile**: React Native (iOS/Android)

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## Architecture

### 5-Layer Architecture
1. **Client Layer**: Web (React), Mobile (React Native), API clients, Webhooks
2. **API Gateway**: Authentication, rate limiting, load balancing
3. **Application Layer**: Modular - CRM, Marketing, Desk, Analytics, Projects, Social, Campaigns, Surveys, SalesIQ
4. **Service Layer**: Auth, Workflow Engine, AI/ML, Email, Notifications, File Storage, Search
5. **Data Layer**: PostgreSQL, Redis, Elasticsearch, ClickHouse, S3/MinIO

### Backend Patterns
- **Clean Architecture**: Controller → Service → Repository
- **Domain-Driven Design** for complex business logic
- **Repository Pattern** for data access abstraction
- **Dependency Injection** for loose coupling

### Frontend Patterns
- **Atomic Design**: atoms, molecules, organisms, pages
- **Custom React Hooks** for reusable logic
- **Context API or Redux** for state management
- **Code Splitting** by route

## Core Modules (by Priority)

| Module | Priority | Phase |
|--------|----------|-------|
| CRM (Leads, Contacts, Accounts, Deals) | P0 | 1 |
| Activities & Workflows | P0 | 1 |
| Basic Reporting | P0 | 1 |
| Marketing Automation | P0/P1 | 2 |
| Helpdesk & Live Chat | P0/P1 | 2 |
| Knowledge Base | P1 | 2 |
| Analytics Dashboard | P1 | 3 |
| AI Assistant (Zia) | P1 | 3 |
| Project Management | P2 | 3 |
| Team Collaboration | P1 | 3 |
| Enterprise Features (SSO, Portals) | P2 | 4 |

## Data Model Conventions

### Multi-Tenancy
- Every entity includes `organization_id` for tenant isolation
- Row-level security enforces tenant boundaries

### Standard Fields
All entities should include:
- `id`: UUID primary key
- `organization_id`: UUID foreign key (tenant isolation)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `created_by`: UUID (FK to User)
- `is_deleted`: Boolean (soft deletes)

### Key Entities
- **Organization**: Top-level tenant with subdomain, settings
- **User**: Belongs to organization, has role
- **Role**: Permissions stored as JSON, supports custom roles
- **Lead**: Capture → Score → Convert to Contact/Account/Deal
- **Contact**: Linked to Account, tracks activity timeline
- **Account**: Supports parent-child hierarchy
- **Deal**: Pipeline stages, linked to Account + Contact
- **Activity**: Polymorphic (task/event/call/email/note), linked to any entity
- **Campaign / EmailCampaign**: Marketing module
- **Ticket**: Multi-channel support, SLA tracking
- **KnowledgeArticle**: Public/internal articles with versioning

### Naming
- **Database columns**: `snake_case` (e.g., `created_at`, `organization_id`)
- **JSON/JSONB**: Use for truly dynamic data only (custom fields, social profiles)

## Authentication & Authorization

### Auth Stack
- OAuth 2.0 with JWT tokens
- Password hashing: bcrypt (minimum 10 rounds)
- TLS 1.3 for all connections

### Default Roles
1. **Administrator** - Full access
2. **Sales Manager** - Full CRM access
3. **Sales Representative** - Own records only
4. **Marketing Manager** - Full marketing access
5. **Support Manager** - Full helpdesk access
6. **Support Agent** - Assigned tickets only

Custom roles with granular per-module, per-action, and field-level permissions are supported.

## Development Conventions

### Code Quality
- **TypeScript** for all JavaScript code (strict mode)
- **ESLint** with Airbnb config
- **Prettier** for formatting
- **JSDoc** comments on all public functions
- **Unit tests** for business logic (target 70% coverage)

### Git Conventions
- Use **conventional commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Branch naming: `claude/<description>-<session-id>`
- Always push with `-u origin <branch-name>`

### File & Code Naming
- **Files**: `kebab-case` (e.g., `user-service.ts`, `lead-controller.ts`)
- **Classes/Interfaces**: `PascalCase` (e.g., `UserService`, `IUser`)
- **Variables/Functions**: `camelCase` (e.g., `getUserById`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`)
- **Database tables/columns**: `snake_case`

### Planned Directory Structure

**Backend:**
```
src/
├── modules/
│   ├── crm/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   ├── marketing/
│   ├── service/
│   └── analytics/
├── middleware/
├── utils/
├── config/
└── main.ts
```

**Frontend:**
```
src/
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── pages/
├── hooks/
├── context/
├── services/
├── utils/
└── App.tsx
```

## API Design

- **RESTful**: Standard CRUD endpoints per resource (`GET /v1/leads`, `POST /v1/leads`, etc.)
- **Versioning**: URL-based (`/v1/`, `/v2/`)
- **Pagination**: Offset-based or cursor-based
- **Response format**: JSON with consistent error responses
- **Rate limiting**: Per user, per IP, per endpoint (100/1000/10000 req/hr by tier)
- **Webhooks**: Event-driven (e.g., `lead.created`, `deal.stage_changed`) with HMAC verification

## Security Requirements

- Input validation on all endpoints
- Parameterized queries (no raw SQL) - use ORM
- Output encoding to prevent XSS
- CSRF protection on forms
- Content Security Policy headers
- Rate limiting on all API endpoints
- Audit logs for all data changes (who, what, when)
- GDPR compliance: data export, deletion, consent management

## Performance Targets

- **Page load**: < 2 seconds (median)
- **API response**: < 200ms (95th percentile)
- **Database queries**: < 100ms (95th percentile)
- **Real-time updates**: < 1 second latency
- **Concurrent users**: 10,000+ per instance
- **Data import**: 1000+ records/minute

## Development Phases

1. **Phase 1 (MVP)**: Core CRM - leads, contacts, accounts, deals, activities, basic workflows, basic reports, user management, email integration
2. **Phase 2**: Marketing campaigns, email builder, landing pages, helpdesk, live chat, knowledge base, mobile app (read-only)
3. **Phase 3**: Unified analytics, AI assistant, social media, surveys, project management, third-party integrations, mobile CRUD
4. **Phase 4**: Enterprise features - portals, territory management, SSO/SAML, sandbox, white-label, GraphQL API

## Key Reminders for AI Assistants

1. **Read the PRD** (`README.md`) before making architectural decisions - it contains detailed specs, data models, and acceptance criteria
2. **Multi-tenancy is mandatory** - every query must be scoped to `organization_id`
3. **Soft deletes** - use `is_deleted` flag, never hard delete user data
4. **Follow the phased approach** - don't build Phase 3 features during Phase 1
5. **Security first** - validate inputs, use parameterized queries, enforce RBAC on every endpoint
6. **Test as you build** - write unit tests alongside business logic (70% coverage target)
7. **Use migrations** for all database schema changes
8. **Index strategically** - foreign keys and frequently queried fields
9. **Avoid N+1 queries** - eager load related data where needed
10. **Keep the API consistent** - same patterns across all modules (CRUD, filtering, pagination, error responses)
