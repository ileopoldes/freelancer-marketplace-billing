# Freelancer Marketplace Billing Adaptation Plan

## Project Overview
Adapting BillForge codebase to implement a multi-format billing system for the Able Freelancer Marketplace platform with multi-tenant architecture.

## Key Business Requirements & Assumptions

### Core Requirements from Challenge
1. **Multi-Format Billing Support**:
   - Pay-as-you-go: Charge per project posted or freelancer hired
   - Prepaid credits: Companies buy credit packages for platform usage
   - Seat-based: Monthly/annual subscription per team member

2. **Internal Controls**: Group admins can set credit limits for individual team members
3. **System Integration**: Billing status affects feature access (permission system integration)
4. **Billing Operations**: Handle overage scenarios and send notifications

### Key Assumptions We Are Making

#### 🔑 Billing Model Assumptions
- **ASSUMPTION 1**: Companies can mix billing models (e.g., seat-based + pay-as-you-go)
- **ASSUMPTION 2**: Subscription changes (adding/removing seats) are prorated monthly
- **ASSUMPTION 3**: Prepaid credits expire after 12 months if unused
- **ASSUMPTION 4**: Grace period of 7 days after payment failure before access revocation
- **ASSUMPTION 5**: Overages are calculated daily and invoiced monthly

#### 🔑 Multi-Tenant Architecture Assumptions
- **ASSUMPTION 6**: An Organization represents a company (top-level tenant)
- **ASSUMPTION 7**: An Entity represents an entity in the real world. An organization can have multiple entities.
- **ASSUMPTION 8**: Teams exist within entities and inherit billing setting. They can represent an entire or partial department/division within an entity.
- **ASSUMPTION 9**: A team also can represent a group of people across the entities, in the organization level. For example: executives.
- **ASSUMPTION 10**: Users can belong to multiple entities across organizations (contractors/consultants)
- **ASSUMPTION 11**: Credit limits are set per user per entity (not globally)

#### 🔑 Permission Integration Assumptions
- **ASSUMPTION 11**: Billing events trigger permission updates via webhook/event system
- **ASSUMPTION 12**: Permission system handles user access based on billing status
- **ASSUMPTION 13**: Each entity has independent billing status (can be suspended individually)

## Phase 1: Foundation & Data Model Updates ✅ (COMPLETED)

### 1.1 Project Structure Cleanup ✅
- [x] Remove unnecessary documentation files
- [x] Update package.json files for new project naming
- [x] Rename core classes and files to reflect marketplace context
- [x] Update import statements

### 1.2 Core File Renames ✅
- [x] `BillingEngine.ts` → `MarketplaceBillingEngine.ts`
- [x] `CreditManager.ts` → `CreditPackageManager.ts`
- [x] `TieredUsagePricer.ts` → `PayAsYouGoPricer.ts`
- [x] `FlatFeePricer.ts` → `SeatBasedPricer.ts`

## Phase 2: Multi-Tenant Database Schema Design ✅ (COMPLETED)

### 2.1 New Core Tables for Multi-Tenant Architecture ✅
- [x] **Organization** table
  - id, name, domain, billing_email, status, created_at, updated_at
  - Root tenant level - represents companies
  
- [x] **Entity** table  
  - id, organization_id, name, description, billing_settings, status, created_at, updated_at
  - The company in a specific country
  
- [x] **Team** table
  - id, entity_id, name, description, team_lead_id, billing_model, created_at, updated_at
  - Team level within entity. A entire or partial department/division level within organization
  
- [x] **User** table (enhanced)
  - id, email, name, global_role, created_at, updated_at
  - Global user identity across all organizations
  
- [x] **EntityUser** table (many-to-many with roles)
  - id, entity_id, user_id, role, credit_limit, seat_allocation, status, created_at, updated_at
  - User membership in entities with billing controls

* We could include **OrganizationUser** and **TeamUser** to, since we can have users linked to different levels. And this approach makes the settings more flexible.

### 2.2 Billing-Specific Tables ✅
- [x] **CreditPackage** table
  - id, name, credits_amount, price, validity_days, description, active, created_at, updated_at
  - Predefined credit packages for purchase
  
- [x] **EntityCreditBalance** table
  - id, entity_id, total_credits, used_credits, expires_at, created_at, updated_at
  - Credit balance per entity
  
- [x] **MarketplaceEvent** table
  - id, entity_id, user_id, event_type, quantity, unit_price, timestamp, metadata, created_at
  - Pay-as-you-go billing events (project_posted, freelancer_hired)
  
- [x] **EntitySubscription** table
  - id, entity_id, subscription_type, seat_count, monthly_price, annual_price, billing_cycle, status, next_billing_date, created_at, updated_at
  - Seat-based subscriptions per entity

### 2.3 Enhanced Existing Tables (Legacy Support)
- [x] Maintain **Contract** table for backward compatibility
- [x] Maintain **Invoice** table for existing billing logic
- [x] Maintain **UsageEvent** table for current usage tracking
- [x] Maintain **Payment** table for payment processing

### 2.4 Schema Migration & Seed Data
- [ ] Create Prisma migration files for new schema
- [ ] Create seed data for testing:
  - 3 organizations with 2-3 entities each
  - Mixed billing models across entities
  - Sample users with multi-entity memberships
  - Credit packages and balances
  - Sample marketplace events

## Phase 3: Core Business Logic Implementation ✅ (COMPLETED)

### 3.1 Pay-as-you-go Billing System ✅
- [x] **PayAsYouGoPricer** class enhancement
  - Event-based pricing (project_posted: $10, freelancer_hired: $25)
  - Configurable rates per organization/entity
  - Bulk pricing discounts for high-volume entities
  
- [x] **MarketplaceEventProcessor** service
  - Event ingestion and validation
  - Real-time billing calculations
  - Overage detection and notifications
  
- [x] **Event Integration Points**
  - Real-time event processing pipeline
  - Failed event retry mechanisms
  - Note: Webhook endpoints will be implemented in Phase 5 (API Layer)

### 3.2 Enhanced Prepaid Credits System ✅
- [x] **CreditPackageManager** enhancements
  - Credit package purchase workflows
  - Entity-level credit balance management
  - Credit expiration handling (12-month default)
  - Credit limit enforcement per user per entity
  
- [x] **CreditDeductionEngine** (integrated into CreditPackageManager)
  - Real-time credit deduction for pay-as-you-go events
  - Credit allocation across teams within entities
  - Low balance and expiration notifications
  
- [x] **Credit Reporting & Analytics**
  - Credit usage analytics per entity
  - Utilization reports for credit optimization
  - Predictive credit depletion alerts

### 3.3 Seat-based Subscription Management ✅
- [x] **SeatBasedPricer** enhancements
  - Dynamic seat counting based on active entity users
  - Pro-ration for mid-cycle seat changes
  - Monthly/annual billing cycle support
  
- [x] **SeatManagementService** (integrated into SeatBasedPricer)
  - Automatic seat allocation/deallocation
  - Seat limit enforcement
  - Seat utilization tracking and optimization
  
- [x] **SubscriptionProrationEngine** (integrated into SeatBasedPricer)
  - Mid-cycle subscription changes
  - Upgrade/downgrade proration calculations
  - Billing cycle management

### 3.4 Mixed Billing Model Support ✅
- [x] **HybridBillingEngine** (integrated into MarketplaceBillingEngine)
  - Support for entities using multiple billing models
  - Consolidated invoicing across billing types
  - Billing preference management per entity

## Phase 4: Permission System Integration

### 4.1 Event-Driven Architecture
- [ ] **BillingEventEmitter** service
  - Entity-level billing status events
  - Credit depletion warnings
  - Payment failure notifications
  - Subscription status changes
  
- [ ] **Event Types Implementation**
  - `entity.billing.payment_succeeded`
  - `entity.billing.payment_failed`
  - `entity.billing.subscription_delinquent`
  - `entity.billing.credits_depleted`
  - `entity.billing.grace_period_started`
  - `entity.billing.access_suspended`

### 4.2 Billing Status Management
- [ ] **EntityBillingStatusManager**
  - Entity-level billing status tracking
  - Grace period management (7-day default)
  - Automated access suspension/restoration
  - Billing status inheritance for teams/users

### 4.3 Integration Points
- [ ] **Permission System Webhooks**
  - Outbound webhooks for billing events
  - Retry mechanisms for failed deliveries
  - Event payload standardization
  
- [ ] **Access Control Integration**
  - Entity-level access control based on billing status
  - User-level access based on credit limits
  - Team-level access inheritance

## Phase 5: API Layer Implementation

### 5.1 Multi-Tenant API Structure
- [ ] **Organization Management API**
  - CRUD operations for organizations
  - Organization-level billing settings
  - Multi-tenant request routing
  
- [ ] **Entity Management API**
  - Entity CRUD with organization context
  - Entity billing configuration
  - Entity user management
  
- [ ] **Team Management API**
  - Team CRUD within entities
  - Team billing model configuration
  - Team member management

### 5.2 Billing-Specific APIs
- [ ] **Credit Package API**
  - Credit package catalog
  - Credit purchase workflows
  - Credit balance queries
  
- [ ] **Pay-as-you-go API**
  - Event ingestion endpoints
  - Real-time billing calculations
  - Usage analytics
  
- [ ] **Subscription Management API**
  - Seat-based subscription management
  - Subscription changes and proration
  - Billing cycle management

### 5.3 Enhanced Existing APIs
- [ ] Update billing run endpoints for multi-tenant context
- [ ] Add entity-scoped reporting endpoints
- [ ] Implement tenant isolation in all billing operations

## Phase 6: Frontend Dashboard Updates

### 6.1 Organization-Level Dashboard
- [ ] **Organization Overview**
  - Multi-entity billing summary
  - Organization-wide spend analytics
  - Cross-entity user management
  
- [ ] **Entity Management Interface**
  - Entity creation and configuration
  - Entity billing model selection
  - Entity user assignment

### 6.2 Entity-Level Billing Management
- [ ] **Entity Billing Dashboard**
  - Entity-specific billing overview
  - Credit balance and usage tracking
  - Subscription management
  
- [ ] **Team Management Interface**
  - Team billing configuration
  - Team member credit limits
  - Team usage analytics

### 6.3 User-Level Views
- [ ] **Multi-Entity User Dashboard**
  - User's entities and roles
  - Credit limits across entities
  - Usage tracking per entity

## Phase 7: Testing & Validation

### 7.1 Multi-Tenant Testing
- [ ] **Tenant Isolation Tests**
  - Data isolation between organizations
  - Billing calculation accuracy per entity
  - User access control validation
  
- [ ] **Mixed Billing Model Tests**
  - Pay-as-you-go + seat-based combinations
  - Credit + subscription billing
  - Proration accuracy tests

### 7.2 Integration Testing
- [ ] **Permission System Integration Tests**
  - Event delivery reliability
  - Billing status propagation
  - Access control enforcement
  
- [ ] **End-to-End Billing Workflows**
  - Complete billing cycles
  - Payment processing
  - Invoice generation

### 7.3 Performance & Scale Testing
- [ ] **Multi-Tenant Load Testing**
  - Concurrent billing runs across entities
  - Event processing throughput
  - Database performance under load
  
- [ ] **Billing Accuracy Tests**
  - Edge cases in proration
  - Credit deduction accuracy
  - Currency precision validation

## Phase 8: Documentation & Deployment

### 8.1 Technical Documentation
- [ ] **Multi-Tenant Architecture Guide**
  - Tenant isolation patterns
  - Data model relationships
  - Security considerations
  
- [ ] **API Documentation**
  - Multi-tenant API patterns
  - Billing model integration guides
  - Webhook documentation

### 8.2 Business Documentation
- [ ] **Billing Model Explanation**
  - How mixed billing models work
  - Credit package strategies
  - Subscription optimization guides
  
- [ ] **Permission System Integration**
  - Event-based access control
  - Billing status impacts
  - Grace period management

## Implementation Priority

### Phase 1 (Weeks 1-2): Foundation
1. Database schema design and migration
2. Basic multi-tenant data models
3. Core entity/organization management

### Phase 2 (Weeks 3-4): Core Billing Logic
1. Pay-as-you-go billing implementation
2. Enhanced credit package management
3. Seat-based subscription logic

### Phase 3 (Weeks 5-6): Integration & APIs
1. Permission system integration
2. Multi-tenant API implementation
3. Event-driven architecture

### Phase 4 (Weeks 7-8): Testing & Polish
1. Comprehensive testing suite
2. Performance optimization
3. Documentation and deployment

## Success Metrics

### Business Requirements Validation
- [ ] All three billing models operational within entities
- [ ] Credit limits enforced per user per entity
- [ ] Permission system integration functional
- [ ] Overage notifications working
- [ ] Multi-tenant isolation verified

### Technical Requirements
- [ ] 99.9% billing accuracy across all models
- [ ] Sub-second response times for billing queries
- [ ] Successful multi-tenant billing runs
- [ ] Zero cross-tenant data leakage
- [ ] Event delivery reliability > 99%

## Risk Mitigation

### High-Risk Areas
1. **Multi-tenant data isolation**: Comprehensive testing required
2. **Mixed billing model complexity**: Careful edge case handling
3. **Permission system integration**: Reliable event delivery critical
4. **Credit limit enforcement**: Real-time validation performance

### Mitigation Strategies
- Extensive automated testing at each phase
- Database-level tenant isolation constraints
- Event delivery retry mechanisms
- Performance monitoring and alerting
- Staged rollout with feature flags

---

*This plan reflects the multi-tenant architecture requirements and key assumptions for the Freelancer Marketplace Billing system.*

When implementing these changes, let's focus on the described requirements for the exercise. And, keep everything else as a list of itens to improve in the near future.
