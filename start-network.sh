#!/usr/bin/env bash
# Run Doctor Booking API + web on your LAN IP (for Android APK / mobile testing)
# Access from phone: http://YOUR_IP:8000
# API test:         http://YOUR_IP:8000/api/public/doctor

set -e
cd "$(dirname "$0")"

IP=$(ipconfig 2>/dev/null | grep -i "IPv4" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' || echo "192.168.31.201")

echo "=============================================="
echo " Doctor Booking — Network Server"
echo "=============================================="
echo " PC browser:    http://127.0.0.1:8000"
echo " Phone/APK:     http://${IP}:8000"
echo " API test:      http://${IP}:8000/api/public/doctor"
echo ""
echo " Keep this terminal open. Press Ctrl+C to stop."
echo "=============================================="

php artisan serve --host=0.0.0.0 --port=8000
