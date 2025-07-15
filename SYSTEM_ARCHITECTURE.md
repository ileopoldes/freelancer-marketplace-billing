# Freelancer Marketplace Billing System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FREELANCER MARKETPLACE BILLING                      │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   FRONTEND      │    │   API LAYER     │    │   PERMISSION    │          │
│  │   (Next.js)     │◄──►│   (NestJS)      │◄──►│   SYSTEM        │          │
│  │                 │    │                 │    │   (External)    │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       BILLING ENGINE LAYER                             │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │ PayAsYouGo      │  │ CreditPackage   │  │ SeatBased       │        │ │
│  │  │ Pricer          │  │ Manager         │  │ Pricer          │        │ │
│  │  │                 │  │                 │  │                 │        │ │
│  │  │ • Event pricing │  │ • Credit limits │  │ • Proration     │        │ │
│  │  │ • Bulk discounts│  │ • Expiration    │  │ • Seat tracking │        │ │
│  │  │ • Tiered rates  │  │ • Deduction     │  │ • Billing cycles│        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │ Marketplace     │  │ Marketplace     │  │ Invoice         │        │ │
│  │  │ Event           │  │ Billing         │  │ Generator       │        │ │
│  │  │ Processor       │  │ Engine          │  │                 │        │ │
│  │  │                 │  │                 │  │ • Multi-tenant  │        │ │
│  │  │ • Real-time     │  │ • Orchestration │  │ • Credit app    │        │ │
│  │  │ • Validation    │  │ • Mixed models  │  │ • Proration     │        │ │
│  │  │ • Overage check │  │ • Billing runs  │  │ • Line items    │        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       DATABASE LAYER (PostgreSQL)                      │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │ MULTI-TENANT    │  │ BILLING DATA    │  │ LEGACY SUPPORT  │        │ │
│  │  │                 │  │                 │  │                 │        │ │
│  │  │ • Organization  │  │ • CreditPackage │  │ • Customer      │        │ │
│  │  │ • Entity        │  │ • EntityCredit  │  │ • Contract      │        │ │
│  │  │ • Team          │  │ • Marketplace   │  │ • Invoice       │        │ │
│  │  │ • User          │  │   Event         │  │ • UsageEvent    │        │ │
│  │  │ • EntityUser    │  │ • Entity        │  │ • Payment       │        │ │
│  │  │                 │  │   Subscription  │  │ • Credit        │        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Tenant Data Flow

```
Organization (Company)
    │
    ├── Entity (Company US)
    │   ├── Team (Engineering)
    │   │   ├── User (Alice) [Credit Limit: $500]
    │   │   └── User (Bob)   [Credit Limit: $300]
    │   │
    │   ├── EntitySubscription (10 seats, $50/month)
    │   ├── EntityCreditBalance (5000 credits, expires 2024-12-31)
    │   └── MarketplaceEvent (project_posted, freelancer_hired)
    │
    └── Entity (Company UK)
        ├── Team (Sales)
        │   ├── User (Carol) [Credit Limit: $200]
        │   └── User (Alice) [Credit Limit: $400] # Same user, different entity
        │
        ├── EntitySubscription (5 seats, $50/month)
        ├── EntityCreditBalance (2000 credits, expires 2024-11-30)
        └── MarketplaceEvent (project_posted, freelancer_hired)
```

## Billing Model Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BILLING CALCULATION FLOW                           │
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ Marketplace     │                                                        │
│  │ Event           │                                                        │
│  │                 │                                                        │
│  │ • project_posted│                                                        │
│  │ • freelancer_   │                                                        │
│  │   hired         │                                                        │
│  └─────────────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ Credit          │    │ Pay-as-you-go   │    │ Subscription    │        │
│  │ Available?      │    │ Pricing         │    │ Billing         │        │
│  │                 │    │                 │    │                 │        │
│  │ Check:          │    │ Calculate:      │    │ Track:          │        │
│  │ • Entity balance│    │ • Event cost    │    │ • Seat usage    │        │
│  │ • User limits   │    │ • Bulk discounts│    │ • Proration     │        │
│  │ • Expiration    │    │ • Tiered rates  │    │ • Billing cycle │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                       │                       │                │
│           ▼                       ▼                       ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          INVOICE GENERATION                             │ │
│  │                                                                         │ │
│  │  Credit Deduction + Pay-as-you-go Charges + Subscription Fees          │ │
│  │  → Consolidated Invoice with Multi-tenant Isolation                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Permission System Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERMISSION SYSTEM INTEGRATION                        │
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ Billing Event   │                                                        │
│  │                 │                                                        │
│  │ • Payment failed│                                                        │
│  │ • Credits low   │                                                        │
│  │ • Overage       │                                                        │
│  │ • Suspension    │                                                        │
│  └─────────────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Event Emitter   │                                                        │
│  │                 │                                                        │
│  │ • Standardize   │                                                        │
│  │ • Enrich        │                                                        │
│  │ • Queue         │                                                        │
│  └─────────────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ Webhook         │    │ Permission      │    │ Access Control  │        │
│  │ Delivery        │    │ System          │    │ Update          │        │
│  │                 │    │                 │    │                 │        │
│  │ • Retry logic   │    │ • Receive event │    │ • Update user   │        │
│  │ • Payload       │    │ • Process rules │    │   permissions   │        │
│  │ • Security      │    │ • Determine     │    │ • Enable/disable│        │
│  │                 │    │   actions       │    │   features      │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                  │
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ MarketplaceBilling                                                       │
│  │ Engine                                                                   │
│  │                 │                                                        │
│  │ • Orchestrates  │                                                        │
│  │   all billing   │                                                        │
│  │ • Mixed models  │                                                        │
│  │ • Entity scope  │                                                        │
│  └─────────────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ Pricing         │  │ Credit          │  │ Event           │            │
│  │ Services        │  │ Management      │  │ Processing      │            │
│  │                 │  │                 │  │                 │            │
│  │ • PayAsYouGo    │  │ • Purchase      │  │ • Validation    │            │
│  │ • SeatBased     │  │ • Deduction     │  │ • Real-time     │            │
│  │ • Proration     │  │ • Limits        │  │ • Overage       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│           │                       │                       │                │
│           ▼                       ▼                       ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       SHARED UTILITIES                                  │ │
│  │                                                                         │ │
│  │  • Money calculations    • Date/time handling    • Recurrence rules    │ │
│  │  • Type definitions      • Validation schemas    • Error handling      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Multi-Tenant Architecture
- **Organization → Entity → Team → User** hierarchy
- Entity-level billing isolation
- Users can belong to multiple entities
- Credit limits are per user per entity

### 2. Billing Model Flexibility
- **Pay-as-you-go**: Event-based billing with tiered pricing
- **Prepaid credits**: Entity-level balances with expiration
- **Seat-based**: Subscription with proration support
- **Mixed models**: Entities can use multiple billing types

### 3. Event-Driven Design
- Real-time event processing
- Billing status propagation
- Permission system integration via webhooks
- Overage detection and notifications

### 4. Technology Stack
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js with React
- **Architecture**: Clean separation of concerns

### 5. Data Isolation
- Row-level security at entity level
- Proper foreign key constraints
- Audit trails for billing events
- Secure multi-tenant access patterns

This architecture provides a robust foundation for a freelancer marketplace billing system that can handle complex organizational structures, flexible billing models, and secure multi-tenant operations.
