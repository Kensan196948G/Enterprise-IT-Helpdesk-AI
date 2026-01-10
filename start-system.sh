#!/bin/bash

# Enterprise IT Helpdesk AI - Full System Launcher
# This script starts both the API server and WebUI

set -e

# Configuration
API_PORT=3000
WEBUI_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to get IP address
get_ip_address() {
    # Try different methods to get IP
    IP=$(hostname -I | awk '{print $1}')
    if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
        IP=$(ip route get 1 | awk '{print $(NF-2);exit}')
    fi
    if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
        IP="localhost"
    fi
    echo $IP
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        log "Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local max_attempts=30
    local attempt=1

    log "Waiting for server at $url"

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            success "Server is ready at $url"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done

    error "Server failed to start at $url after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    log "🚀 Starting Enterprise IT Helpdesk AI System..."

    # Get IP address
    IP_ADDRESS=$(get_ip_address)
    log "Detected IP address: $IP_ADDRESS"

    # Kill any existing processes on the ports
    kill_port $API_PORT
    kill_port $WEBUI_PORT

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        warning ".env file not found. Please ensure API keys are configured."
        warning "Copy .env.example to .env and fill in your API keys."
    fi

    # Check if API server is already running
    log "Checking API server on port $API_PORT..."
    if ss -tlnp | grep -q ":$API_PORT "; then
        success "API server is already running on port $API_PORT"
        API_PID=$(ss -tlnp | grep ":$API_PORT " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
    else
        # Start API server in background
        log "Starting API server on port $API_PORT..."
        cd /mnt/LinuxHDD/Enterprise-IT-Helpdesk-AI

        # Check if API server exists
        if [ ! -f "src/api/API.ts" ]; then
            error "API server file not found. Please ensure the project is properly set up."
            exit 1
        fi

        # Start API server
        HOST=0.0.0.0 npm run api &
        API_PID=$!

        # Wait for API server to be ready
        if wait_for_server "http://localhost:$API_PORT/health"; then
            success "API server started successfully (PID: $API_PID)"
        else
            error "API server failed to start"
            kill $API_PID 2>/dev/null || true
            exit 1
        fi
    fi

    # Check if WebUI is already running
    if ss -tlnp | grep -q ":$WEBUI_PORT "; then
        success "WebUI is already running on port $WEBUI_PORT"
        WEBUI_PID=$(ss -tlnp | grep ":$WEBUI_PORT " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
        cd /mnt/LinuxHDD/Enterprise-IT-Helpdesk-AI
    else
        # Start WebUI in background
        log "Starting WebUI on port $WEBUI_PORT..."
        cd enterprise-it-helpdesk-webui

        # Check if WebUI exists
        if [ ! -f "package.json" ]; then
            error "WebUI not found. Please run setup-webui.sh first."
            exit 1
        fi

        # Start WebUI
        HOST=0.0.0.0 PORT=$WEBUI_PORT npm start &
        WEBUI_PID=$!

        # Wait for WebUI to be ready
        if wait_for_server "http://localhost:$WEBUI_PORT"; then
            success "WebUI started successfully (PID: $WEBUI_PID)"
            cd ..
        else
            error "WebUI failed to start"
            kill $WEBUI_PID 2>/dev/null || true
            if [ ! -z "$API_PID" ]; then
                kill $API_PID 2>/dev/null || true
            fi
            exit 1
        fi
    fi

    # Display success information
    echo ""
    echo "========================================"
    echo "🎉 Enterprise IT Helpdesk AI System Started!"
    echo "========================================"
    echo ""
    echo "🌐 WebUI URL: http://$IP_ADDRESS:$WEBUI_PORT"
    echo "🔗 API URL: http://$IP_ADDRESS:$API_PORT/api/v1"
    echo ""
    echo "📊 Dashboard: http://$IP_ADDRESS:$WEBUI_PORT"
    echo "📱 Inquiries: http://$IP_ADDRESS:$WEBUI_PORT/inquiries"
    echo "🤖 Agents: http://$IP_ADDRESS:$WEBUI_PORT/agents"
    echo ""
    echo "📋 API Endpoints:"
    echo "   Health: http://$IP_ADDRESS:$API_PORT/health"
    echo "   Inquiries: http://$IP_ADDRESS:$API_PORT/api/v1/inquiries"
    echo "   Agents: http://$IP_ADDRESS:$API_PORT/api/v1/agents"
    echo ""
    echo "🛑 To stop the system:"
    echo "   kill $API_PID $WEBUI_PID"
    echo ""
    echo "========================================"

    # Keep the script running to maintain the servers
    log "System is running. Press Ctrl+C to stop."

    # Wait for user interrupt
    trap "log 'Stopping servers...'; kill $API_PID $WEBUI_PID 2>/dev/null || true; exit 0" INT TERM

    # Keep the script alive
    while true; do
        sleep 60
        # Check if processes are still running
        if ! kill -0 $API_PID 2>/dev/null; then
            error "API server process died unexpectedly"
            kill $WEBUI_PID 2>/dev/null || true
            exit 1
        fi
        if ! kill -0 $WEBUI_PID 2>/dev/null; then
            error "WebUI process died unexpectedly"
            kill $API_PID 2>/dev/null || true
            exit 1
        fi
    done
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi