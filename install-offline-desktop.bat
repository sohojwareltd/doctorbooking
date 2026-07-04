@echo off
echo Doctor Booking - Offline Desktop Install
echo.
echo This installs the offline app with SQLite (no MySQL, no internet).
echo.
set SRC=%~dp0..\..\doctorbooking-desktop\dist
if not exist "%SRC%\DoctorBooking-Setup.exe" (
  echo Building installer first...
  cd /d "%~dp0..\..\doctorbooking-desktop"
  call npm run build:all
)
echo.
echo Installer: doctorbooking-desktop\dist\DoctorBooking-Setup.exe
echo Portable:  doctorbooking-desktop\dist\DoctorBooking-portable.exe
echo.
echo SQLite database after install:
echo   %%APPDATA%%\doctor-booking-desktop\database.sqlite
echo.
echo Login: doctor@example.com / password
echo.
pause
