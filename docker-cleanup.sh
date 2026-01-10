#!/bin/bash

# Docker Cleanup Script for EC2
# This script cleans up Docker resources to free up disk space

echo "🧹 Starting Docker cleanup..."

# Stop all running containers
echo "⏹️  Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"

# Remove all stopped containers
echo "🗑️  Removing stopped containers..."
docker container prune -f

# Remove all unused images
echo "🖼️  Removing unused images..."
docker image prune -a -f

# Remove all unused volumes
echo "💾 Removing unused volumes..."
docker volume prune -f

# Remove all build cache
echo "📦 Removing build cache..."
docker builder prune -a -f

# Show disk space after cleanup
echo ""
echo "📊 Disk space after cleanup:"
df -h /

echo ""
echo "✅ Docker cleanup completed!"

