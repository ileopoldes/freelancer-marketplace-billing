# 🚀 Freelancer Marketplace Billing System

> A comprehensive multi-format billing system for freelancer marketplace platforms with multi-tenant architecture, supporting pay-as-you-go, prepaid credits, and seat-based subscription models.

## 📋 Index

1. [Overview](#-overview)
2. [GitHub Repository](#-github-repository)
3. [Deployed Link](#-deployed-link)
4. [Notes on Trade-offs](#-notes-on-trade-offs)
5. [Feature Selection Explanation](#-feature-selection-explanation)
6. [Architecture](#-architecture)
7. [Getting Started](#getting-started)
8. [Database Schema](#database-schema)
9. [Key Assumptions](#key-assumptions)
10. [API Structure](#api-structure)
11. [Project Structure](#-project-structure)
12. [Tech Stack](#-tech-stack)
13. [Contributing](#contributing)
14. [License](#license)

## ✨ Overview

This project provides a robust billing infrastructure designed specifically for freelancer marketplace platforms. It handles complex organizational structures, flexible billing models, and secure multi-tenant operations with a clean TypeScript implementation.

## 📂 GitHub Repository

- [Access the repository here](https://github.com/ileopoldes/freelancer-marketplace-billing)

## 🌍 Deployed Link

- [Check it out on Railway here](#)

## ⚖️ Notes on Trade-offs

While developing this project, several trade-offs were made to balance implementation complexity and feature completeness:

### 🧪 Testing & Quality Assurance

- **Test Coverage**: While backend unit tests are comprehensive, frontend E2E testing and load testing are planned but not fully implemented
- **API Documentation**: OpenAPI/Swagger documentation is missing but would be valuable for production use

### 🔐 Permission & Security System

- **Permission Checks**: Basic role-based permissions (Admin, Manager, Freelancer) are implemented with UI restrictions, but advanced custom role definitions and hierarchical permissions are simplified
- **Real-time Permission Updates**: Permission changes are handled asynchronously via webhooks rather than real-time enforcement
- **Granular Feature Controls**: Feature-level permissions exist but could be more granular

### 💰 Billing & Financial Features

- **Proration Logic**: Seat subscription prorations are simplified and don't fully handle mid-cycle changes
- **Payment Integration**: Architecture supports external payment processors (Stripe) but actual integration is not implemented
- **Credit Expiration**: Credits are managed without expiration for simplicity
- **Billing Notifications**: Email alerts and billing threshold notifications are not implemented

### 🏗️ System Architecture

- **Real-time Updates**: Billing status changes affect permissions asynchronously rather than immediately
- **Marketplace Search**: Multi-criteria freelancer search and matching engine is not implemented (would be a separate major feature)
- **Scalability**: While the architecture supports horizontal scaling, advanced caching and performance optimizations are minimal

### 🚀 Deployment & Operations

- **Monitoring**: Basic logging is in place but advanced monitoring, metrics, and alerting are not fully configured
- **Database Optimization**: Basic indexing is present but query optimization for large-scale operations could be improved

## ❔ Feature Selection Explanation

### Why Multi-Format Billing Solution?

The **Multi-Format Billing Solution** was selected from the available challenge options for several strategic reasons:

#### 🏢 Professional Experience

- **Real-world Familiarity**: Having worked with similar billing architectures at companies like Deel, this domain expertise enabled efficient development of a robust, production-ready system
- **Domain Knowledge**: Deep understanding of multi-tenant billing challenges, financial calculations, and the complexities of handling different billing models at scale

#### 🏗️ Technical Complexity

- **Architecture Showcase**: Multi-tenant systems with complex billing models demonstrate advanced system design skills
- **Financial Precision**: Working with money requires careful handling of decimal calculations, transaction integrity, and audit trails
- **Integration Patterns**: Billing systems must integrate with multiple external services (payments, permissions, notifications)

#### 🚀 Business Impact

- **Revenue Critical**: Billing systems are mission-critical infrastructure that directly impacts business revenue
- **Scalability Requirements**: Must handle growing organizations, multiple billing models, and increasing transaction volumes
- **Compliance Considerations**: Financial systems require proper audit trails, data integrity, and often regulatory compliance

#### 🔧 Technical Depth

- **Event-Driven Architecture**: Demonstrates asynchronous processing, webhook integrations, and eventual consistency patterns
- **Complex Data Modeling**: Multi-tenant relationships, hierarchical organizations, and financial entities showcase advanced database design
- **API Design**: RESTful APIs with proper tenant isolation, authentication, and authorization patterns

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
