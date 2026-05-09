#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$(which python3 2>/dev/null || which python)"

# Detectar venv (con o sin punto)
if [ -f "$SCRIPT_DIR/Backend/venv/Scripts/activate" ]; then
  VENV="$SCRIPT_DIR/Backend/venv"
else
  VENV="$SCRIPT_DIR/Backend/.venv"
fi

echo "Iniciando Backend..."
cd "$SCRIPT_DIR/Backend"

# Crear venv si no existe
if [ ! -f "$VENV/Scripts/activate" ]; then
  echo "Creando entorno virtual..."
  "$PYTHON" -m venv "$VENV"
fi

source "$VENV/Scripts/activate"
pip install -r requirements.txt -q
"$VENV/Scripts/uvicorn" main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Iniciando Frontend..."
cd "$SCRIPT_DIR/Frontend/infodets-web"
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend corriendo en: http://localhost:8000"
echo "Frontend corriendo en: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
