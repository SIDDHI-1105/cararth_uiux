@echo off
echo ========================================
echo Starting CarArth Website
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo.

:: Navigate to project directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes on first run...
    call npm install
    echo.
)

:: Start the backend server in a new window
echo Starting Backend Server...
start "CarArth Backend (Port 5000)" cmd /k "npm run server"
timeout /t 3 /nobreak >nul

:: Start the frontend in a new window
echo Starting Frontend Server...
start "CarArth Frontend (Port 5173)" cmd /k "npm run client"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak

:: Open the website in default browser
start http://localhost:5173

echo.
echo ========================================
echo Your website should now be open!
echo ========================================
echo.
echo To stop the servers:
echo - Close the "CarArth Backend" window
echo - Close the "CarArth Frontend" window
echo.
echo Press any key to close this window...
pause >nul
