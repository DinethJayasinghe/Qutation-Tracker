@echo off
echo Starting Subodhi Quotation Tracker in Development Mode...
start cmd /k "echo Starting Backend... && cd server && npm run dev"
timeout /t 2 >nul
start cmd /k "echo Starting Frontend... && cd client && npm run dev"
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:5173
pause

