@echo off
cd /d "%~dp0"
echo Starting Doctor Booking on network (port 8000)...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%a
set IP=%IP: =%
echo Phone URL: http://%IP%:8000
echo API test:  http://%IP%:8000/api/public/doctor
php artisan serve --host=0.0.0.0 --port=8000
