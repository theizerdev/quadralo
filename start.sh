#!/usr/bin/env bash
# ==============================================================================
# Quádralo - Launcher Fullstack para Debian / Ubuntu / Linux
# ==============================================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}         🚀 QUÁDRALO - INICIANDO SISTEMA COMPLETO 🚀           ${NC}"
echo -e "${CYAN}                 Tus finanzas siempre al día                    ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo ""
echo -e "  [1/2] Backend:  FastAPI en ${BOLD}http://127.0.0.1:8000${NC}"
echo -e "  [2/2] Frontend: Next.js en ${BOLD}http://localhost:3000${NC}"
echo ""
echo -e "Presiona ${BOLD}Ctrl + C${NC} en cualquier momento para detener los servicios."
echo -e "${CYAN}----------------------------------------------------------------${NC}"
echo ""

if command -v python3 &> /dev/null; then
    python3 dev.py
else
    npm run dev
fi
