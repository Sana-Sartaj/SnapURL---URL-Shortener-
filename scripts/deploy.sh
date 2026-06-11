#!/bin/bash
# =============================================================
# deploy.sh — Push updates to AWS EC2
#
# Usage: ./scripts/deploy.sh <EC2_IP> [pem-key-path]
#
# Example:
#   ./scripts/deploy.sh 54.123.45.67
#   ./scripts/deploy.sh 54.123.45.67 ~/.ssh/my-key.pem
# =============================================================

set -euo pipefail

EC2_IP="${1:?Usage: deploy.sh <EC2_IP> [pem-key]}"
PEM_KEY="${2:-~/.ssh/id_rsa}"
EC2_USER="ubuntu"
REMOTE_DIR="/opt/url-shortener"

echo "========================================"
echo " Deploying to EC2: $EC2_IP"
echo "========================================"

SSH="ssh -i $PEM_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP"
SCP="scp -i $PEM_KEY -o StrictHostKeyChecking=no -r"

# 1. Build frontend
echo "[1/4] Building frontend..."
cd frontend
npm run build
cd ..

# 2. Copy files to EC2
echo "[2/4] Syncing files..."
$SCP \
    backend/ \
    frontend/dist/ \
    docker/ \
    docker-compose.yml \
    k6/ \
    "$EC2_USER@$EC2_IP:$REMOTE_DIR/"

# 3. Rebuild and restart changed services
echo "[3/4] Rebuilding containers..."
$SSH "cd $REMOTE_DIR && docker compose build backend frontend && docker compose up -d"

# 4. Health check
echo "[4/4] Health check..."
sleep 15
STATUS=$($SSH "curl -sf http://localhost:8080/actuator/health | grep -o '\"status\":\"[^\"]*\"'" || echo "unreachable")
echo "Backend health: $STATUS"

echo ""
echo "✅ Deployed!"
echo "   URL: http://$EC2_IP:3000"
echo "   API: http://$EC2_IP:8080"
