# Docker Setup Guide

This document provides comprehensive instructions for running the FlowBeats Music Player using Docker.

## 🐳 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## 📁 Docker Files Overview

- `Dockerfile` - Multi-stage build for React frontend
- `Dockerfile.backend` - Backend-specific Docker configuration
- `docker-compose.yml` - Production and development services
- `docker-compose.dev.yml` - Development-focused configuration
- `.dockerignore` - Files to exclude from Docker build context
- `docker/nginx.conf` - Nginx configuration for production

## 🚀 Quick Start

### Production Build

```bash
# Build and run production version
npm run docker:compose:prod

# Or using docker-compose directly
docker-compose up music-player-prod
```

The application will be available at: http://localhost:8080

### Development Mode

```bash
# Run development version with hot reload
npm run docker:compose:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up
```

The development server will be available at: http://localhost:5173

## 🔧 Available Docker Commands

### Building Images

```bash
# Build all images
npm run docker:build

# Build production image only
npm run docker:build:prod

# Build development image only
npm run docker:build:dev
```

### Running Containers

```bash
# Run production container
npm run docker:run

# Run development container with volume mounting
npm run docker:run:dev

# Run with docker-compose (recommended)
npm run docker:compose

# Run and rebuild images
npm run docker:compose:build
```

### Managing Services

```bash
# Stop all services
npm run docker:compose:down

# View logs
npm run docker:compose:logs

# Clean up unused Docker resources
npm run docker:clean

# Clean up everything (use with caution)
npm run docker:clean:all
```

## 🏗️ Multi-Stage Dockerfile Explained

### Frontend Dockerfile

The main `Dockerfile` uses a multi-stage build approach:

1. **Builder Stage**: 
   - Uses Node.js 20 Alpine image
   - Installs dependencies and builds the React application
   - Outputs optimized production files

2. **Production Stage**:
   - Uses Nginx Alpine image
   - Serves the built application with optimized configuration
   - Includes security headers and gzip compression
   - Runs as non-root user for security

3. **Development Stage**:
   - Uses Node.js 20 Alpine image
   - Supports hot reload with volume mounting
   - Includes development dependencies

### Backend Dockerfile

The `Dockerfile.backend` provides:

1. **Production Stage**:
   - Builds TypeScript to JavaScript
   - Optimized for production deployment

2. **Development Stage**:
   - Includes nodemon for hot reload
   - Mounts source code as volumes

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root for environment-specific configuration:

```env
# Application
NODE_ENV=production
VITE_HOST=0.0.0.0
VITE_PORT=5173

# Backend
PORT=3001
API_URL=http://localhost:3001

# Database (if using)
POSTGRES_DB=musicplayer
POSTGRES_USER=musicuser
POSTGRES_PASSWORD=musicpass

# Redis (if using)
REDIS_URL=redis://redis:6379
```

### Nginx Configuration

The nginx configuration (`docker/nginx.conf`) includes:

- **SPA Routing**: Handles client-side routing for React
- **Static Asset Caching**: 1-year cache for JS/CSS/images
- **Security Headers**: XSS protection, CSRF prevention
- **Gzip Compression**: Reduces bundle size
- **Health Check Endpoint**: `/health` for monitoring

## 🗂️ Service Profiles

Docker Compose uses profiles to organize services:

### Default Services
- `music-player-prod` - Production frontend

### Development Profile (`dev`)
- `music-player-dev` - Development frontend with hot reload

### Backend Profile (`backend`)
- `music-player-backend` - Backend API server

### Database Profile (`database`)
- `database` - PostgreSQL database
- Includes health checks and data persistence

### Cache Profile (`cache`)
- `redis` - Redis caching service

### Running with Profiles

```bash
# Run with development profile
docker-compose --profile dev up

# Run with backend and database
docker-compose --profile backend --profile database up

# Run everything
docker-compose --profile dev --profile backend --profile database --profile cache up
```

## 📊 Health Checks

All services include health checks:

- **Frontend**: Checks HTTP response on main port
- **Backend**: Checks API health endpoint
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping command

View health status:
```bash
docker-compose ps
```

## 🔒 Security Features

### Container Security
- **Non-root user**: Services run as unprivileged users
- **Read-only filesystem**: Where possible
- **Security headers**: Comprehensive HTTP security headers
- **Minimal base images**: Alpine Linux for smaller attack surface

### Network Security
- **Internal networks**: Services communicate on private networks
- **Port exposure**: Only necessary ports are exposed
- **Environment isolation**: Clear separation between dev/prod

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied (Windows)**
   ```bash
   # Ensure Docker Desktop is running as administrator
   # Check Docker settings for drive sharing
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :8080
   
   # Stop conflicting services or change port in docker-compose.yml
   ```

3. **Volume Mounting Issues**
   ```bash
   # For Windows, ensure drive is shared in Docker Desktop settings
   # Use absolute paths if relative paths fail
   ```

4. **Hot Reload Not Working**
   ```bash
   # Ensure VITE_HOST=0.0.0.0 is set
   # Check that volumes are properly mounted
   # Restart development container
   ```

### Debugging

```bash
# Enter a running container
docker exec -it music-player-dev sh

# View container logs
docker logs music-player-dev -f

# Inspect container configuration
docker inspect music-player-dev

# Check resource usage
docker stats
```

## 🚀 Deployment

### Production Deployment

1. **Build optimized image**:
   ```bash
   docker build --target production -t music-player:prod .
   ```

2. **Run with docker-compose**:
   ```bash
   docker-compose up -d music-player-prod
   ```

3. **Or deploy to cloud platforms**:
   - Push image to registry (Docker Hub, AWS ECR, etc.)
   - Deploy using cloud-specific tools (ECS, Kubernetes, etc.)

### Environment-Specific Builds

```bash
# Build for different environments
docker build --build-arg NODE_ENV=staging -t music-player:staging .
docker build --build-arg NODE_ENV=production -t music-player:prod .
```

## 📝 Best Practices

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Multi-stage builds**: Separate build and runtime environments
3. **Health checks**: Always include health checks for monitoring
4. **Security**: Run as non-root user, use security headers
5. **Caching**: Optimize layer caching by copying package files first
6. **Environment variables**: Use environment-specific configuration
7. **Logging**: Configure proper logging for production
8. **Monitoring**: Include health endpoints and metrics

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build --target production -t music-player:${{ github.sha }} .
          
      - name: Run tests in container
        run: |
          docker run --rm music-player:${{ github.sha }} npm test
          
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # Your deployment script here
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker and container logs
3. Ensure your Docker installation is up to date
4. Check the project's GitHub issues for similar problems

Happy containerizing! 🎵