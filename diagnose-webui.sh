#!/bin/bash

# Diagnostic script for WebUI connection issues

echo "=== WebUI Connection Diagnostics ==="
echo

# Check if port 3001 is listening
echo "1. Checking port 3001 status:"
if ss -tlnp | grep -q ":3001 "; then
    echo "   ✓ Port 3001 is listening"
    ss -tlnp | grep ":3001 "
else
    echo "   ✗ Port 3001 is not listening"
fi

# Check if WebUI process is running
echo
echo "2. Checking WebUI process:"
WEBUI_PID=$(pgrep -f "next-server" || pgrep -f "enterprise-it-helpdesk-webui" || true)
if [ ! -z "$WEBUI_PID" ]; then
    echo "   ✓ WebUI process found (PID: $WEBUI_PID)"
    ps -p $WEBUI_PID -o pid,ppid,cmd
else
    echo "   ✗ No WebUI process found"
fi

# Check if API server is running
echo
echo "3. Checking API server:"
if ss -tlnp | grep -q ":3000 "; then
    echo "   ✓ API server is listening on port 3000"
else
    echo "   ✗ API server is not listening on port 3000"
fi

# Check network connectivity to localhost
echo
echo "4. Testing localhost connectivity:"
if curl -s --max-time 5 "http://localhost:3001" > /dev/null; then
    echo "   ✓ Localhost:3001 is accessible"
else
    echo "   ✗ Localhost:3001 is not accessible (connection refused)"
fi

# Check external IP connectivity
echo
echo "5. Testing external IP connectivity:"
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ ! -z "$IP_ADDR" ]; then
    echo "   System IP: $IP_ADDR"
    if curl -s --max-time 5 "http://$IP_ADDR:3001" > /dev/null; then
        echo "   ✓ $IP_ADDR:3001 is accessible"
    else
        echo "   ✗ $IP_ADDR:3001 is not accessible"
    fi
else
    echo "   Could not determine IP address"
fi

# Check firewall status
echo
echo "6. Checking firewall status:"
if command -v ufw >/dev/null 2>&1; then
    echo "   UFW status:"
    sudo ufw status | grep -E "(3001|3000|Status)"
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "   FirewallD status:"
    sudo firewall-cmd --list-all | grep -E "(3001|3000)"
else
    echo "   No common firewall detected (ufw/firewalld)"
fi

# Check WebUI configuration
echo
echo "7. Checking WebUI configuration:"
if [ -f "enterprise-it-helpdesk-webui/package.json" ]; then
    echo "   ✓ WebUI package.json exists"
    cd enterprise-it-helpdesk-webui
    if grep -q '"start"' package.json; then
        echo "   ✓ Start script found in package.json"
        grep '"start"' package.json
    else
        echo "   ✗ No start script in package.json"
    fi
    cd ..
else
    echo "   ✗ WebUI package.json not found"
fi

echo
echo "=== Diagnostics Complete ==="