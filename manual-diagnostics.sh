#!/bin/bash

# Manual diagnostic steps for WebUI connection issue

echo "=== Manual WebUI Diagnostics ==="
echo ""

echo "Step 1: Check if WebUI process is running"
echo "Command: ps aux | grep -E '(next|enterprise-it-helpdesk-webui|node.*3001)' | grep -v grep"
echo ""

echo "Step 2: Check what ports are listening"
echo "Command: sudo netstat -tlnp | grep :3001"
echo "Command: sudo ss -tlnp | grep :3001"
echo ""

echo "Step 3: Test local connectivity"
echo "Command: curl -v http://localhost:3001"
echo ""

echo "Step 4: Test external connectivity"
echo "Command: curl -v http://192.168.0.187:3001"
echo ""

echo "Step 5: Check firewall status"
echo "Command: sudo ufw status"
echo "Command: sudo firewall-cmd --list-all 2>/dev/null || echo 'firewalld not available'"
echo ""

echo "Step 6: Check WebUI logs"
echo "Command: cd enterprise-it-helpdesk-webui && tail -f .next/server.log 2>/dev/null || echo 'No server log found'"
echo ""

echo "Step 7: Manually start WebUI for testing"
echo "Command: cd enterprise-it-helpdesk-webui && HOST=0.0.0.0 PORT=3001 npm start"
echo ""

echo "=== End Diagnostics ==="