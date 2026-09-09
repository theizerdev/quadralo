#!/usr/bin/env bash
# ==============================================================================
# Quádralo - Script de Instalación y Configuración para Debian / Ubuntu / Linux
# ==============================================================================

# Colores para salida de terminal
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear 2>/dev/null || true

echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}      🚀 QUÁDRALO - INSTALADOR Y CONFIGURADOR AUTOMÁTICO 🚀     ${NC}"
echo -e "${CYAN}                 Tus finanzas siempre al día                    ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo ""

# 1. Verificar Python 3 y venv
echo -e "${BOLD}[*] [1/6] Verificando entorno de Python 3...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[!] ERROR: Python 3 no está instalado.${NC}"
    echo -e "    Instálalo ejecutando: ${YELLOW}sudo apt update && sudo apt install -y python3 python3-venv python3-pip${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "    ${GREEN}[OK] Detectado:${NC} $PYTHON_VERSION"

# Verificar si python3-venv está disponible
if ! python3 -m venv --help &> /dev/null; then
    echo -e "${RED}[!] ERROR: El paquete python3-venv no está instalado en tu sistema Debian/Ubuntu.${NC}"
    echo -e "    Por favor instálalo con: ${YELLOW}sudo apt install -y python3-venv${NC}"
    exit 1
fi

# 2. Verificar Node.js y npm
echo ""
echo -e "${BOLD}[*] [2/6] Verificando instalación de Node.js y npm...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[!] ERROR: Node.js no está instalado.${NC}"
    echo -e "    Puedes instalarlo usando NodeSource (v20 o superior LTS):"
    echo -e "    ${YELLOW}curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -${NC}"
    echo -e "    ${YELLOW}sudo apt install -y nodejs${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "    ${GREEN}[OK] Node.js:${NC} $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[!] ERROR: npm no está disponible.${NC}"
    echo -e "    Instálalo con: ${YELLOW}sudo apt install -y npm${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "    ${GREEN}[OK] npm:${NC}     v$NPM_VERSION"

# 3. Configurar archivos de entorno (.env)
echo ""
echo -e "${BOLD}[*] [3/6] Configurando variables de entorno (.env)...${NC}"
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "    ${GREEN}[OK]${NC} Archivo backend/.env creado desde .env.example"
        
        # En Linux/Debian estándar, MySQL/MariaDB suele usar el puerto 3306
        if nc -z 127.0.0.1 3306 2>/dev/null; then
            sed -i 's/DB_PORT=3307/DB_PORT=3306/g' backend/.env
            sed -i 's/:3307\//:3306\//g' backend/.env
            echo -e "    ${YELLOW}[i] Puerto de MySQL ajustado a 3306 (estándar en Debian/Ubuntu)${NC}"
        fi
    fi
else
    echo -e "    ${GREEN}[OK]${NC} Archivo backend/.env ya existe."
fi

if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env.local
        echo -e "    ${GREEN}[OK]${NC} Archivo frontend/.env.local creado desde .env.example"
    fi
else
    echo -e "    ${GREEN}[OK]${NC} Archivo frontend/.env.local ya existe."
fi

# 4. Entorno virtual de Python y dependencias
echo ""
echo -e "${BOLD}[*] [4/6] Configurando Backend (Python venv y dependencias)...${NC}"
if [ ! -d "backend/venv" ]; then
    echo -e "    [*] Creando entorno virtual en backend/venv..."
    python3 -m venv backend/venv
    echo -e "    ${GREEN}[OK]${NC} Entorno virtual creado."
else
    echo -e "    ${GREEN}[OK]${NC} Entorno virtual backend/venv ya existe."
fi

echo -e "    [*] Instalando/actualizando librerías de Python..."
backend/venv/bin/python -m pip install --upgrade pip > /dev/null 2>&1
backend/venv/bin/python -m pip install -r backend/requirements.txt
echo -e "    ${GREEN}[OK]${NC} Dependencias de Python instaladas exitosamente."

# 5. Inicializar Base de Datos MySQL y Tablas
echo ""
echo -e "${BOLD}[*] [5/6] Inicializando Base de Datos MySQL y Tablas del Sistema...${NC}"
backend/venv/bin/python backend/init_db.py
DB_STATUS=$?
if [ $DB_STATUS -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}[!] AVISO: No se pudo conectar automáticamente a MySQL.${NC}"
    echo -e "    Asegúrate de que el servicio MySQL o MariaDB esté corriendo:"
    echo -e "    ${YELLOW}sudo systemctl start mysql${NC} o ${YELLOW}sudo systemctl start mariadb${NC}"
    echo -e "    Y verifica usuario/contraseña en el archivo ${CYAN}backend/.env${NC}"
fi

# 6. Dependencias Frontend y Compilación
echo ""
echo -e "${BOLD}[*] [6/6] Instalando dependencias y compilando Frontend Next.js...${NC}"
npm install
cd frontend && npm install
echo -e "    ${GREEN}[OK]${NC} Dependencias de Node.js instaladas."

echo -e "    [*] Compilando aplicación Next.js para producción..."
npm run build
BUILD_STATUS=$?
cd ..

if [ $BUILD_STATUS -eq 0 ]; then
    echo -e "    ${GREEN}[OK]${NC} Build de Next.js generado exitosamente."
else
    echo -e "    ${RED}[!] AVISO: Error durante el build de Next.js. Revisa los logs anteriores.${NC}"
fi

# Hacer ejecutables los scripts bash
chmod +x setup.sh 2>/dev/null || true
if [ -f "start.sh" ]; then
    chmod +x start.sh 2>/dev/null || true
fi

echo ""
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}     🎉 ¡INSTALACIÓN Y CONFIGURACIÓN COMPLETADA CON ÉXITO! 🎉   ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo ""
echo -e "Modos de ejecución disponibles:"
echo -e "  1. ${YELLOW}Producción (Nginx / SSL / Systemd):${NC}"
echo -e "     URL Pública:         ${BOLD}https://quadralo.theizerdev.com/${NC}"
echo -e "     Documentación API:   ${BOLD}https://quadralo.theizerdev.com/docs${NC}"
echo ""
echo -e "  2. ${YELLOW}Desarrollo Local:${NC}"
echo -e "     ${YELLOW}./start.sh${NC}  o  ${YELLOW}python3 dev.py${NC}  o  ${YELLOW}npm run dev${NC}"
echo -e "     * Frontend: ${BOLD}http://localhost:3001${NC}"
echo -e "     * Backend:  ${BOLD}http://127.0.0.1:8001${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
