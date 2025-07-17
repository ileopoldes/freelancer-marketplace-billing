# 🚀 Freelancer Marketplace Billing System

> A comprehensive multi-format billing system for freelancer marketplace platforms with multi-tenant architecture, supporting pay-as-you-go, prepaid credits, and seat-based subscription models.

## ✨ Overview

This project provides a robust billing infrastructure designed specifically for freelancer marketplace platforms. It handles complex organizational structures, flexible billing models, and secure multi-tenant operations with a clean TypeScript implementation.

## 🏗️ Architecture

### 🏢 Multi-Tenant Structure

```
Organizations (Companies)
├── 🏤 Entities (Business Units/Countries)
│   ├── 👥 Teams (Departments/Project Groups)
│   ├── 👤 Users (via EntityUser relationships)
│   ├── 💰 Credit Balances
│   ├── 📋 Subscriptions
│   └── 📊 Marketplace Events
└── 🌐 Global Users (can belong to multiple entities)
```

### 🔥 Key Features

#### 💳 Multi-Format Billing Models

- **💸 Pay-as-you-go**: Charge per project posted or freelancer hired
- **🎫 Prepaid Credits**: Credit packages with simplified management (no expiration)
- **💺 Seat-based Subscriptions**: Monthly billing per team member
- **🔄 Single Model Per Entity**: Simplified billing approach (one model per entity)

#### 🏢 Multi-Tenant Architecture

- **🏛️ Organization Level**: Top-level tenant isolation
- **🏤 Entity Level**: Business units with independent billing
- **👥 Team Level**: Department/project-based organization
- **👤 User Level**: Cross-entity user management

#### 💰 Credit Management

- Entity-level credit balances
- User-specific credit limits
- Simplified balance management (no expiration)
- Credit package purchasing workflows

#### 📊 Real-time Event Processing

- Marketplace event ingestion
- Usage-based billing calculations
- Overage detection and automatic fallback to invoicing

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

## Key Assumptions

### Billing Models (Current Implementation)

1. **Single Model Per Entity**: Each entity uses one billing model (simplified approach)
2. **Simplified Proration**: Basic monthly billing cycles for subscriptions
3. **No Credit Expiration**: Credits don't expire (simplified management)
4. **No Grace Period**: Payment failures immediately trigger fallback to invoicing
5. **Real-time Overage**: Immediate fallback to invoicing when credits insufficient

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

## 📚 Project Structure

```
📁 freelancer-marketplace-billing/
├── 💰 apps/
│   ├── 💴 backend/          # NestJS API server
│   └── 🕷️ frontend/         # Next.js dashboard
├── 📦 packages/
│   └── 🔗 shared/           # Shared types and utilities
├── 📝 docs/               # Documentation files
├── 🔧 .vscode/            # VS Code workspace settings
├── 🔌 .husky/             # Git hooks for code quality
├── 🐳 docker-compose.yml  # PostgreSQL development setup
└── 💾 package.json        # Workspace configuration
```

### 📝 Documentation Files

- **README.md**: This file - project overview and setup
- **SYSTEM_ARCHITECTURE.md**: Detailed architecture diagrams and design decisions
- **CODE_QUALITY.md**: Code standards, linting rules, and development workflow
- **ADAPTATION_PLAN.md**: Implementation roadmap and requirements coverage
- **CLAUDE.md**: AI assistant conversation history and decision log

### 🔧 Development Tools

- **`.vscode/`**: VS Code workspace settings, extensions, and debugging configurations
- **`.husky/`**: Git hooks for:
  - Pre-commit: ESLint fixes and Prettier formatting
  - Pre-push: Test execution
  - Commit message validation with conventional commits

## 💻 Tech Stack

### 💴 Backend

- **Runtime**: Node.js 18+ with **NestJS**
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with comprehensive test coverage
- **Validation**: Zod schemas for runtime type checking
- **Logging**: NestJS Logger for structured logging

### 🕷️ Frontend

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **UI Components**: Custom accessible components

### 🔗 Shared

- **Types**: Zod schemas shared between frontend and backend
- **Money**: decimal.js for precise financial calculations
- **Dates**: RRULE.js for recurrence patterns
- **Utilities**: Common validation, formatting, and business logic

## Contributing

This is a take-home challenge project for Able. The implementation focuses on demonstrating:

- Multi-tenant architecture design
- Complex billing model implementation
- Clean code architecture
- Production-ready patterns

## License

This project is part of a technical assessment and is not intended for production use.
