# Deployment Guide

## Railway Deployment

This project is configured for deployment on Railway, a modern cloud platform that supports monorepos and multiple services.

### Prerequisites

1. Railway CLI installed: `npm install -g @railway/cli`
2. Railway account: [https://railway.app](https://railway.app)
3. PostgreSQL database service on Railway

### Services

The application consists of three services:

1. **Backend API** (`apps/backend`)
   - NestJS application with Prisma ORM
   - Handles all API endpoints for billing operations
   - Requires PostgreSQL database connection

2. **Frontend** (`apps/frontend`)
   - Next.js application
   - Provides UI for managing billing operations
   - Connects to backend API

3. **Database**
   - PostgreSQL service on Railway
   - Stores all application data

### Environment Variables

#### Backend (`apps/backend`)

```env
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=3000
NODE_ENV=production
```

#### Frontend (`apps/frontend`)

```env
NEXT_PUBLIC_API_URL="https://your-backend-url.railway.app"
PORT=3000
NODE_ENV=production
```

### Deployment Steps

1. **Login to Railway**:

   ```bash
   railway login
   ```

2. **Create a new Railway project**:

   ```bash
   railway project create freelancer-marketplace-billing
   ```

3. **Deploy Database Service**:

   ```bash
   railway service create marketplace-db
   railway service connect marketplace-db
   railway add postgresql
   ```

4. **Deploy Backend Service**:

   ```bash
   railway service create backend
   railway service connect backend
   cd apps/backend
   railway deploy
   ```

5. **Deploy Frontend Service**:

   ```bash
   railway service create frontend
   railway service connect frontend
   cd apps/frontend
   railway deploy
   ```

6. **Set up Database**:

   ```bash
   # Generate Prisma client
   railway exec "npx prisma generate"

   # Run migrations
   railway exec "npx prisma migrate deploy"

   # Seed database (optional)
   railway exec "npm run db:seed"
   ```

### Configuration Files

- `railway.json`: Main Railway configuration
- `apps/backend/railway.json`: Backend-specific configuration
- `apps/frontend/railway.json`: Frontend-specific configuration
- `railway.yaml`: Alternative YAML configuration format

### Service URLs

After deployment, you'll get URLs like:

- Backend: `https://backend-production-xxxx.up.railway.app`
- Frontend: `https://frontend-production-xxxx.up.railway.app`
- Database: Available internally to services

### Monitoring

Railway provides built-in monitoring and logging:

- View logs: `railway logs`
- Monitor metrics: Railway dashboard
- Set up alerts: Railway project settings

### Scaling

Railway automatically scales based on usage:

- Auto-scaling for web services
- Connection pooling for databases
- Load balancing across instances

### Troubleshooting

1. **Build failures**: Check build logs in Railway dashboard
2. **Database connections**: Verify DATABASE_URL environment variable
3. **Service communication**: Ensure services are properly networked
4. **Port conflicts**: Services default to PORT environment variable

### Local Development

To run locally with Railway services:

1. **Link local project**:

   ```bash
   railway link
   ```

2. **Run with Railway environment**:

   ```bash
   railway run npm run dev
   ```

3. **Access Railway database locally**:
   ```bash
   railway shell
   ```

### Costs

Railway pricing is based on:

- Resource usage (CPU, memory, network)
- Data storage
- Egress bandwidth

Free tier includes:

- $5 credit per month
- Auto-sleep after 30 minutes of inactivity
- Limited to hobby projects

For production workloads, consider upgrading to the Developer plan.
