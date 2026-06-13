@echo off
echo ==========================================
echo       STARTING BRIEFFORGE SERVICES
echo ==========================================
echo.
echo Starting Backend (Port 3000)...
start "BriefForge Backend" cmd /c "cd backend && npm run dev"

echo Starting AI Service (Port 8000)...
start "BriefForge AI Service" cmd /c "cd ai-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Port 5173)...
start "BriefForge Frontend" cmd /c "cd frontend && npm run dev"
echo.
echo ==========================================
echo Services initiated!
echo - Frontend:   http://localhost:5173
echo - Backend:    http://localhost:3000
echo - AI Service: http://localhost:8000/docs
echo ==========================================
echo.
pause
