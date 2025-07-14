# Freelancer Marketplace Billing System - CLAUDE.md

## Project Overview

This is a comprehensive billing system for a freelancer marketplace, implementing multi-tenant architecture with sophisticated pricing models. The system handles pay-as-you-go billing, prepaid credit packages, and seat-based subscriptions across Organizations → Entities → Teams → Users.

## System Architecture

### Multi-Tenant Structure
- **Organizations**: Top-level billing entities with billing email and domain
- **Entities**: Sub-organizations within an organization (e.g., departments, projects)
- **Teams**: Groups within entities with specific billing models
- **Users**: Individual users with roles and seat allocations

### Core Billing Models

#### 1. Pay-as-You-Go Pricing
- Real-time event processing with marketplace events
- Tiered bulk discounts for high-volume usage
- Immediate credit deduction from entity balances
- Implemented in `PayAsYouGoPricer.ts` and `TieredUsagePricer.ts`

#### 2. Prepaid Credit Packages
- Entity-level credit balances with expiration tracking
- Credit limit enforcement per user
- Credit package purchase and management
- Implemented in `CreditPackageManager.ts` and `EntityCreditBalance` model

#### 3. Seat-Based Subscriptions
- Monthly/annual billing with proration support
- Seat count management with utilization tracking
- Subscription lifecycle management
- Implemented in `SeatBasedPricer.ts` and `ProrationEngine.ts`

### Key Services

#### MarketplaceBillingEngine
Central orchestration service coordinating all billing operations:
- Event processing and routing
- Credit balance management
- Subscription billing
- Multi-model billing support

#### MarketplaceEventProcessor
Handles marketplace events with billing implications:
- Event validation and processing
- Credit deduction
- Usage tracking
- Billing event generation

#### CreditPackageManager
Manages prepaid credit packages:
- Package creation and pricing
- Credit allocation to entities
- Expiration handling
- Balance tracking

#### ProrationEngine
Handles subscription proration:
- Mid-cycle changes
- Upgrade/downgrade calculations
- Refund processing
- Time-based billing adjustments

### Database Schema

#### Core Models
- `Organization`: Top-level tenant with billing settings
- `Entity`: Sub-organization with credit balances and subscriptions
- `Team`: Groups with billing configurations
- `User` / `EntityUser`: User memberships with roles and limits
- `EntityCreditBalance`: Credit balances with expiration
- `EntitySubscription`: Seat-based subscription tracking
- `MarketplaceEvent`: Billing events and usage tracking

#### Legacy Models (Preserved for Backward Compatibility)
- `Customer`: Legacy customer records
- `Contract`: Legacy contract billing
- `Invoice` / `InvoiceLine`: Legacy invoice system
- `Credit`: Legacy credit system
- `Payment`: Legacy payment tracking

### API Structure

#### Multi-Tenant Endpoints
- `/api/organizations` - Organization management
- `/api/entities` - Entity management and billing
- `/api/teams` - Team configuration
- `/api/users` - User management

#### Billing Endpoints
- `/api/billing/events` - Marketplace event processing
- `/api/billing/credits` - Credit management
- `/api/billing/subscriptions` - Subscription management
- `/api/billing/jobs` - Billing job processing

#### Legacy Endpoints (Preserved)
- `/api/customers` - Legacy customer operations
- `/api/invoices` - Legacy invoice operations

## Implementation Status

### ✅ Completed Features
1. **Multi-tenant architecture** with Organizations → Entities → Teams → Users
2. **Pay-as-you-go billing** with real-time event processing
3. **Prepaid credit packages** with entity-level balances
4. **Seat-based subscriptions** with proration support
5. **Marketplace event processing** with billing integration
6. **Credit balance management** with expiration tracking
7. **Billing job scheduling** with idempotency
8. **Comprehensive pricing engines** for all billing models
9. **Legacy system integration** for backward compatibility

### 🔄 Recent Cleanup
- Removed `MinimumCommitPricer.ts` and `DiscountEngine.ts` (SaaS-specific features not required)
- Streamlined `InvoiceGenerator.ts` to focus on core billing logic
- Preserved legacy systems for backward compatibility
- Focused codebase on multi-tenant marketplace billing

### 🎯 Next Development Tasks

#### Priority 1: Core Billing Enhancements
1. **Enhanced Event Processing**
   - Implement bulk event processing for high-volume scenarios
   - Add event deduplication and idempotency
   - Implement event replay and audit trails

2. **Credit System Improvements**
   - Add credit expiration notifications
   - Implement credit transfer between entities
   - Add credit usage analytics and reporting

3. **Subscription Management**
   - Implement subscription pause/resume functionality
   - Add subscription usage monitoring
   - Implement automated seat optimization

#### Priority 2: API and Integration
1. **Webhook System**
   - Implement billing event webhooks
   - Add subscription status change notifications
   - Implement credit balance alerts

2. **Analytics and Reporting**
   - Add billing analytics dashboard
   - Implement usage trend analysis
   - Add cost optimization recommendations

3. **Payment Integration**
   - Integrate with payment processors
   - Implement automatic payment retry
   - Add payment method management

#### Priority 3: Advanced Features
1. **Marketplace Features**
   - Implement revenue sharing models
   - Add marketplace commission handling
   - Implement payout management

2. **Multi-Currency Support**
   - Add currency conversion
   - Implement regional pricing
   - Add currency-specific billing

3. **Compliance and Security**
   - Add PCI compliance features
   - Implement data retention policies
   - Add audit logging

## Technical Patterns

### Money Handling
All monetary values use the `Money` type from `@marketplace/shared` with proper decimal precision:
```typescript
import { Money, createMoney, addMoney, multiplyMoney } from '@marketplace/shared';
```

### Database Operations
All database operations use Prisma with proper transaction handling:
```typescript
await this.prisma.$transaction(async (tx) => {
  // Database operations
});
```

### Event Processing
Events are processed through the `MarketplaceEventProcessor` with proper validation:
```typescript
const result = await this.eventProcessor.processEvent(event);
```

### Error Handling
Comprehensive error handling with proper error types and logging:
```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new BillingError('Operation failed', error);
}
```

## Testing Strategy

### Unit Tests
- Service layer testing with mocked dependencies
- Pricing engine validation
- Event processing logic
- Credit management operations

### Integration Tests
- Database operations with test containers
- API endpoint testing
- Multi-tenant data isolation
- Billing workflow end-to-end

### Performance Tests
- High-volume event processing
- Concurrent billing operations
- Database query optimization
- Cache performance

## Deployment and Operations

### Environment Configuration
- Database connection strings
- API keys and secrets
- Feature flags
- Monitoring configuration

### Monitoring and Alerting
- Billing job failures
- Credit balance thresholds
- Payment processing issues
- Performance metrics

### Scaling Considerations
- Database sharding by organization
- Event processing queues
- Cache layer implementation
- Read replica configuration

## Development Guidelines

### Code Organization
- Services in `/src/services/`
- Models in `/src/models/`
- Routes in `/src/routes/`
- Utilities in `/src/utils/`

### Naming Conventions
- Use descriptive names for services and methods
- Follow TypeScript naming conventions
- Use consistent file naming patterns
- Include proper JSDoc documentation

### Database Design
- Use UUIDs for all primary keys
- Include proper indexes for query optimization
- Implement soft deletes where appropriate
- Use proper foreign key constraints

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest
- Use secure communication protocols
- Implement proper access controls
- Regular security audits

### Multi-Tenancy
- Proper data isolation between organizations
- Row-level security where applicable
- Audit trails for all operations
- Secure API endpoints

## Performance Optimization

### Database Optimization
- Query optimization and indexing
- Connection pooling
- Read replicas for analytics
- Archival strategies for historical data

### Application Performance
- Caching strategies
- Asynchronous processing
- Bulk operations
- Connection optimization

## Conclusion

This billing system provides a robust, scalable foundation for marketplace billing with multi-tenant support and sophisticated pricing models. The codebase is well-structured, thoroughly tested, and ready for production deployment with proper monitoring and security measures.

The recent cleanup has focused the implementation on core marketplace billing requirements while preserving backward compatibility. Future development should focus on enhancing the core billing features, improving integration capabilities, and adding advanced marketplace-specific functionality.
