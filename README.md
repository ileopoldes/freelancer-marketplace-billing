# Freelancer Marketplace Billing System

## Overview
A comprehensive multi-format billing system for freelancer marketplace platforms, supporting pay-as-you-go, prepaid credits, and seat-based subscription models with multi-tenant architecture.

## Architecture

### Multi-Tenant Structure
```
Organizations
├── Entities (company divisions/countries)
│   ├── Teams (departments/project groups)
│   ├── Users (via EntityUser relationships)
│   ├── Credit Balances
│   ├── Subscriptions
│   └── Marketplace Events
└── Global Users (can belong to multiple entities)
```

### Key Features

#### 🔥 Multi-Format Billing Models
- **Pay-as-you-go**: Charge per project posted or freelancer hired
- **Prepaid Credits**: Credit packages with expiration and limits
- **Seat-based Subscriptions**: Monthly/annual billing per team member
- **Hybrid Models**: Mix different billing approaches per entity

#### 🏢 Multi-Tenant Architecture
- **Organization Level**: Top-level tenant isolation
- **Entity Level**: Business units with independent billing
- **Team Level**: Department/project-based organization
- **User Level**: Cross-entity user management

#### 💳 Credit Management
- Entity-level credit balances
- User-specific credit limits
- Automatic expiration handling
- Credit package purchasing

#### 📊 Real-time Event Processing
- Marketplace event ingestion
- Usage-based billing calculations
- Overage detection and notifications

## Database Schema

### Core Multi-Tenant Tables

#### Organization
- Root tenant level representing companies
- Contains multiple entities

#### Entity
- Business units within organizations
- Independent billing settings and status
- Can represent different countries/divisions

#### Team
- Organizational units within entities
- Inherit entity billing settings
- Support custom billing models

#### User
- Global user identity across organizations
- Can belong to multiple entities

#### EntityUser
- Many-to-many relationship with roles
- Credit limits and seat allocations
- Entity-specific permissions

### Billing-Specific Tables

#### CreditPackage
- Predefined credit packages for purchase
- Configurable pricing and validity

#### EntityCreditBalance
- Credit balances per entity
- Expiration tracking

#### MarketplaceEvent
- Pay-as-you-go billing events
- Event-based pricing calculations

#### EntitySubscription
- Seat-based subscriptions per entity
- Monthly/annual billing cycles

### Legacy Tables (Maintained for Compatibility)
- Customer, Contract, Invoice, Payment
- Will be gradually migrated to new structure

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Project structure cleanup
- [x] Core class renaming
- [x] Import statement updates
- [x] Package.json updates

### ✅ Phase 2: Database Schema (COMPLETED)
- [x] Multi-tenant table design
- [x] Entity relationships
- [x] Credit management tables
- [x] Marketplace event tables
- [x] Subscription management tables

### 🔄 Phase 3: Core Business Logic (IN PROGRESS)
- [ ] Pay-as-you-go billing implementation
- [ ] Credit package management
- [ ] Seat-based subscription logic
- [ ] Multi-tenant billing engine

## Key Assumptions

### Billing Models
1. **Mixed Billing**: Entities can use multiple billing models simultaneously
2. **Proration**: Monthly proration for subscription changes
3. **Credit Expiration**: 12-month default expiration for credits
4. **Grace Period**: 7-day grace period after payment failure
5. **Overage Calculation**: Daily calculation, monthly invoicing

### Multi-Tenant Architecture
6. **Organization Scope**: Top-level tenant isolation
7. **Entity Independence**: Independent billing status per entity
8. **Cross-Entity Users**: Users can belong to multiple entities/organizations
9. **Team Inheritance**: Teams inherit entity billing settings
10. **Credit Limits**: Per-user per-entity credit limits

### System Integration
11. **Event-Driven**: Billing events trigger permission updates
12. **Webhook Integration**: External system notifications
13. **Tenant Isolation**: Complete data isolation between organizations

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm 9+

### Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### Development
```bash
# Start development servers
npm run dev

# Run tests
npm test

# Database studio
npm run db:studio
```

## API Structure

### Multi-Tenant Endpoints
```
/api/organizations/:orgId/entities
/api/entities/:entityId/teams
/api/entities/:entityId/users
/api/entities/:entityId/billing
```

### Billing Endpoints
```
/api/billing/run
/api/billing/jobs
/api/credits/packages
/api/credits/purchase
/api/subscriptions/seats
/api/events/marketplace
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Fastify
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with comprehensive test coverage
- **Validation**: Zod schemas for runtime type checking

### Frontend
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **UI Components**: Custom accessible components

### Shared
- **Types**: Zod schemas shared between frontend and backend
- **Money**: decimal.js for precise financial calculations
- **Dates**: RRULE.js for recurrence patterns

## Next Steps

1. **Complete Core Business Logic** (Phase 3)
   - Implement pay-as-you-go billing
   - Enhance credit package management
   - Build seat-based subscription logic

2. **API Implementation** (Phase 5)
   - Multi-tenant API endpoints
   - Billing-specific APIs
   - Authentication and authorization

3. **Frontend Dashboard** (Phase 6)
   - Organization management interface
   - Entity billing dashboards
   - User management tools

4. **Testing & Validation** (Phase 7)
   - Multi-tenant isolation tests
   - Billing accuracy validation
   - Performance optimization

## Contributing

This is a take-home challenge project for Able. The implementation focuses on demonstrating:
- Multi-tenant architecture design
- Complex billing model implementation
- Clean code architecture
- Production-ready patterns

## License

This project is part of a technical assessment and is not intended for production use.
