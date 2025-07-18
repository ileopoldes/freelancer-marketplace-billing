# Docker Setup Guide

This guide covers Docker setup for the Freelancer Marketplace Billing application, including both development and production environments.

## Quick Start

### Development with Docker Compose

1. **Build and start all services**:

   ```bash
   docker-compose up --build
   ```

2. **Run migrations and seed data**:

   ```bash
   # Wait for containers to be ready, then run migrations
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npm run db:seed
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Production Docker Images

Build production images individually:

```bash
# Build backend
docker build -f apps/backend/Dockerfile -t fmb-backend .

# Build frontend
docker build -f apps/frontend/Dockerfile -t fmb-frontend .
```

## Services Overview

### PostgreSQL Database

- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: freelancer_marketplace_billing
- **User**: fmb_user
- **Password**: fmb_password

### Backend API

- **Port**: 3001
- **Framework**: NestJS
- **Database**: Prisma ORM
- **Health Check**: GET /api/health

### Frontend

- **Port**: 3000
- **Framework**: Next.js
- **API Connection**: http://localhost:3001

## Docker Files

### Backend Dockerfile

- **Base Image**: node:18-slim
- **Multi-stage build**: Base builder + Production runner
- **Security**: Non-root user (marketplace:nodejs)
- **Health Check**: Built-in health endpoint monitoring
- **Optimizations**: Prisma generation, dependency caching

### Frontend Dockerfile

- **Base Image**: node:18-slim
- **Multi-stage build**: Base builder + Production runner
- **Security**: Non-root user (nextjs:nodejs)
- **Health Check**: Built-in Next.js health monitoring
- **Optimizations**: Standalone output, static file optimization

## Environment Variables

### Backend Environment

```env
DATABASE_URL=postgresql://fmb_user:fmb_password@postgres:5432/freelancer_marketplace_billing?schema=public
PORT=3001
NODE_ENV=development
```

### Frontend Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
```

## Common Commands

### Development

```bash
# Start all services
docker-compose up

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild services
docker-compose build

# Access service shell
docker-compose exec backend bash
docker-compose exec frontend bash
```

### Database Management

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database
docker-compose exec backend npm run db:seed

# Reset database
docker-compose exec backend npx prisma migrate reset --force

# Access database directly
docker-compose exec postgres psql -U fmb_user -d freelancer_marketplace_billing
```

### Production

```bash
# Build production images
docker build -f apps/backend/Dockerfile -t fmb-backend .
docker build -f apps/frontend/Dockerfile -t fmb-frontend .

# Run production containers
docker run -d -p 3001:3001 --name backend fmb-backend
docker run -d -p 3000:3000 --name frontend fmb-frontend
```

## Volume Management

### Development Volumes

- `postgres_data`: Persistent database storage
- `./apps/backend:/app/apps/backend`: Backend source code hot-reload
- `./apps/frontend:/app/apps/frontend`: Frontend source code hot-reload
- `./packages/shared:/app/packages/shared`: Shared package hot-reload

### Production Volumes

- `postgres_data`: Database persistence only
- No source code volumes (built into images)

## Health Checks

### Backend Health Check

```bash
curl http://localhost:3001/api/health
```

### Frontend Health Check

```bash
curl http://localhost:3000
```

### Database Health Check

```bash
docker-compose exec postgres pg_isready -U fmb_user
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:

   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   ```

2. **Database connection errors**:

   ```bash
   # Check database is running
   docker-compose ps postgres

   # Check database logs
   docker-compose logs postgres
   ```

3. **Build failures**:

   ```bash
   # Clean build cache
   docker-compose build --no-cache

   # Remove all containers and rebuild
   docker-compose down
   docker-compose up --build
   ```

4. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Performance Optimization

1. **Use BuildKit for faster builds**:

   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

2. **Prune unused Docker resources**:

   ```bash
   docker system prune -a
   ```

3. **Use .dockerignore files**:
   - Exclude node_modules, .git, logs, etc.
   - Reduces build context size

## Security Considerations

1. **Non-root users**: Both containers run as non-root users
2. **Health checks**: Built-in monitoring for container health
3. **Environment variables**: Sensitive data should use Docker secrets in production
4. **Network isolation**: Services communicate through Docker networks
5. **Volume permissions**: Proper file ownership and permissions

## Monitoring

### Container Stats

```bash
docker stats
```

### Service Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Container Inspection

```bash
# Inspect container
docker inspect fmb-backend

# Check container processes
docker-compose exec backend ps aux
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Backend
        run: docker build -f apps/backend/Dockerfile -t fmb-backend .
      - name: Build Frontend
        run: docker build -f apps/frontend/Dockerfile -t fmb-frontend .
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
