@echo off
echo Iniciando Backend y Frontend en local...

start "Backend" cmd /k "cd /d %~dp0Backend && pip install -r requirements.txt >nul 2>&1 && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

start "Frontend" cmd /k "cd /d %~dp0Frontend\infodets-web && npm install >nul 2>&1 && npm run dev"

echo.
echo Backend corriendo en: http://localhost:8000
echo Frontend corriendo en: http://localhost:3000
echo.
echo Cierra las ventanas de Backend y Frontend para detener los servicios.
