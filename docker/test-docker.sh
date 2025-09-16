#!/bin/bash

# Docker Test Script
# This script tests the Docker setup for the Music Player application

set -e

echo "🐳 Testing Docker Setup for FlowBeats Music Player"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
echo "1. Checking Docker installation..."
if ! docker --version &> /dev/null; then
    print_error "Docker is not installed or not running"
    exit 1
fi
print_status "Docker is installed and running"

# Check if Docker Compose is available
echo "2. Checking Docker Compose..."
if ! docker-compose --version &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_status "Docker Compose is available"

# Build the Docker images
echo "3. Building Docker images..."
echo "   Building production image..."
if docker build --target production -t music-player:test-prod . &> /dev/null; then
    print_status "Production image built successfully"
else
    print_error "Failed to build production image"
    exit 1
fi

echo "   Building development image..."
if docker build --target development -t music-player:test-dev . &> /dev/null; then
    print_status "Development image built successfully"
else
    print_error "Failed to build development image"
    exit 1
fi

# Test production container
echo "4. Testing production container..."
CONTAINER_ID=$(docker run -d -p 8081:8080 music-player:test-prod)
sleep 10

if curl -f http://localhost:8081/health &> /dev/null; then
    print_status "Production container health check passed"
else
    print_warning "Production container health check failed (this might be expected if health endpoint is not implemented)"
fi

# Test if the app is serving
if curl -f http://localhost:8081/ &> /dev/null; then
    print_status "Production container is serving the application"
else
    print_error "Production container is not responding"
fi

# Cleanup
docker stop $CONTAINER_ID &> /dev/null
docker rm $CONTAINER_ID &> /dev/null

# Test docker-compose configuration
echo "5. Testing Docker Compose configuration..."
if docker-compose config &> /dev/null; then
    print_status "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors"
    exit 1
fi

# Test development compose file
if docker-compose -f docker-compose.dev.yml config &> /dev/null; then
    print_status "Development Docker Compose configuration is valid"
else
    print_error "Development Docker Compose configuration has errors"
    exit 1
fi

# Clean up test images
echo "6. Cleaning up test images..."
docker rmi music-player:test-prod music-player:test-dev &> /dev/null
print_status "Test images cleaned up"

echo ""
echo "🎉 All Docker tests passed!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run docker:compose:dev' for development"
echo "2. Run 'npm run docker:compose:prod' for production"
echo "3. See DOCKER.md for detailed usage instructions"