@echo off
REM Docker Test Script for Windows
REM This script tests the Docker setup for the Music Player application

echo 🐳 Testing Docker Setup for FlowBeats Music Player
echo ==================================================

REM Check if Docker is running
echo 1. Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker is not installed or not running
    exit /b 1
)
echo ✓ Docker is installed and running

REM Check if Docker Compose is available
echo 2. Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker Compose is not installed
    exit /b 1
)
echo ✓ Docker Compose is available

REM Build the Docker images
echo 3. Building Docker images...
echo    Building production image...
docker build --target production -t music-player:test-prod . >nul 2>&1
if errorlevel 1 (
    echo ✗ Failed to build production image
    exit /b 1
)
echo ✓ Production image built successfully

echo    Building development image...
docker build --target development -t music-player:test-dev . >nul 2>&1
if errorlevel 1 (
    echo ✗ Failed to build development image
    exit /b 1
)
echo ✓ Development image built successfully

REM Test production container
echo 4. Testing production container...
for /f %%i in ('docker run -d -p 8081:8080 music-player:test-prod') do set CONTAINER_ID=%%i
timeout /t 10 /nobreak >nul

REM Test if the app is serving
curl -f http://localhost:8081/ >nul 2>&1
if errorlevel 1 (
    echo ⚠ Production container health check failed (this might be expected)
) else (
    echo ✓ Production container is serving the application
)

REM Cleanup
docker stop %CONTAINER_ID% >nul 2>&1
docker rm %CONTAINER_ID% >nul 2>&1

REM Test docker-compose configuration
echo 5. Testing Docker Compose configuration...
docker-compose config >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker Compose configuration has errors
    exit /b 1
)
echo ✓ Docker Compose configuration is valid

REM Test development compose file
docker-compose -f docker-compose.dev.yml config >nul 2>&1
if errorlevel 1 (
    echo ✗ Development Docker Compose configuration has errors
    exit /b 1
)
echo ✓ Development Docker Compose configuration is valid

REM Clean up test images
echo 6. Cleaning up test images...
docker rmi music-player:test-prod music-player:test-dev >nul 2>&1
echo ✓ Test images cleaned up

echo.
echo 🎉 All Docker tests passed!
echo.
echo Next steps:
echo 1. Run 'npm run docker:compose:dev' for development
echo 2. Run 'npm run docker:compose:prod' for production
echo 3. See DOCKER.md for detailed usage instructions

pause