#!/bin/bash

# RetraLabs CI/CD Deployment Script
# This script pulls the latest code and rebuilds containers automatically

set -e  # Exit on any error

# Configuration
APP_NAME="retralabs"
APP_DIR="/opt/retralabs"  # Change this to your actual deployment directory
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Success message
success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Warning message
warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."

    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        error_exit "docker-compose.yml not found. Are you in the project root?"
    fi

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker is not running or not accessible"
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error_exit "docker-compose command not found"
    fi

    success "Pre-deployment checks passed"
}

# Backup current state
create_backup() {
    log "Creating backup..."

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

    # Create backup of current code (excluding node_modules and other build artifacts)
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='backups' \
        . 2>/dev/null || warning "Could not create code backup"

    success "Backup created: $BACKUP_FILE"
}

# Pull latest code
pull_code() {
    log "Pulling latest code from git..."

    if [ ! -d ".git" ]; then
        error_exit "Not a git repository"
    fi

    # Stash any local changes
    git stash push -m "Auto-stash before deployment $TIMESTAMP" 2>/dev/null || true

    # Pull latest changes
    git pull origin main || git pull origin master

    success "Code pulled successfully"
}

# Stop containers
stop_containers() {
    log "Stopping existing containers..."

    docker-compose down || warning "Could not stop containers gracefully"

    success "Containers stopped"
}

# Build and start containers
build_and_start() {
    log "Building and starting containers..."

    # Build with no cache to ensure fresh build
    docker-compose build --no-cache

    # Start containers
    docker-compose up -d

    success "Containers built and started"
}

# Health check
health_check() {
    log "Performing health check..."

    # Wait a moment for services to start
    sleep 10

    # Check if container is running
    if ! docker-compose ps | grep -q "Up"; then
        error_exit "Container failed to start"
    fi

    # Health check endpoint
    MAX_RETRIES=10
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f -s http://localhost/health >/dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi

        log "Health check failed, retrying in 5 seconds... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done

    error_exit "Health check failed after $MAX_RETRIES attempts"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."

    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true

    # Remove stopped containers
    docker container prune -f >/dev/null 2>&1 || true

    # Remove unused volumes
    docker volume prune -f >/dev/null 2>&1 || true

    success "Cleanup completed"
}

# Rollback function
rollback() {
    log "Starting rollback..."

    # Stop current containers
    docker-compose down || true

    # Restore from backup if available
    if [ -f "$BACKUP_FILE" ]; then
        log "Restoring from backup..."
        rm -rf * .[^.]*
        tar -xzf "$BACKUP_FILE"
        docker-compose up -d
        success "Rollback completed"
    else
        error_exit "No backup available for rollback"
    fi
}

# Send notification (optional)
send_notification() {
    local status="$1"
    local message="$2"

    # Here you could add Slack, Discord, or email notifications
    # Example for Slack webhook:
    # curl -X POST -H 'Content-type: application/json' \
    #      --data "{\"text\":\"RetraLabs Deployment $status: $message\"}" \
    #      $SLACK_WEBHOOK_URL 2>/dev/null || true

    log "Notification sent: $status - $message"
}

# Main deployment function
main() {
    log "🚀 Starting RetraLabs deployment..."

    # Export BACKUP_FILE for rollback function
    export BACKUP_FILE

    {
        pre_deployment_checks
        create_backup
        pull_code
        stop_containers
        build_and_start
        health_check
        cleanup

        success "🎉 Deployment completed successfully!"
        send_notification "SUCCESS" "Deployment completed successfully"

    } || {
        error_exit "❌ Deployment failed! Check logs at $LOG_FILE"
        send_notification "FAILED" "Deployment failed - check logs"
        # Optional: uncomment to auto-rollback on failure
        # rollback
    }
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        log "Manual rollback requested"
        export BACKUP_FILE="$BACKUP_DIR/$(ls -t $BACKUP_DIR/backup_*.tar.gz | head -1)"
        if [ -f "$BACKUP_FILE" ]; then
            rollback
        else
            error_exit "No backup file found for rollback"
        fi
        ;;
    "status")
        log "Checking deployment status..."
        docker-compose ps
        ;;
    *)
        main
        ;;
esac
