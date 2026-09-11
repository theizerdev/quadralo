<div align="center">

# 📊 Quádralo

### **Sistema SaaS de Gestión Financiera, Inversiones y Ventas Multimoneda**
*Tus compras, ventas, inventario y ganancias siempre cuadradas en tiempo real.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Descripción General

**Quádralo** es una plataforma SaaS (Software as a Service) de alto rendimiento diseñada especialmente para comerciantes, negocios y emprendedores que operan en economías multimoneda (**USD** y **Bolívares - VES**).

El sistema automatiza el cálculo de costos unitarios de compra (incluyendo flete y gastos asociados), controla el inventario restante en tiempo real, descuenta el Costo de Mercancía Vendida (**COGS**) al registrar ventas y sincroniza en vivo la **tasa oficial del Banco Central de Venezuela (BCV)**.

---

## 🚀 Funcionalidades Principales

### 📈 1. Dashboard Financiero Integral
- **Gráfico de Evolución Temporal con 3 Modos Intercalables**:
  - 📊 **Barras Comparativas (Lado a Lado)**: Ventas Totales, Costo COGS y Ganancia Neta en columnas proporcionales por día, semana o mes.
  - 🧱 **Composición Apilada**: Visualiza cómo se divide cada venta entre el costo base de la mercancía y la ganancia neta obtenida.
  - 📈 **Líneas de Tendencia**: Curvas Spline continuas con marcadores para evaluar crecimiento histórico.
- **KPIs en Tiempo Real**: Ventas totales, margen bruto, markup porcentual, gastos de flete, ROI y punto de equilibrio.
- **Selector Instantáneo de Moneda**: Alterna todas las métricas, tarjetas y tablas entre **USD** y **VES** con un solo clic.

### 📦 2. Control de Inversiones y Compras de Mercancía
- Registro de lotes de compra con proveedor, fecha, costo total y gastos de envío / flete.
- Detalle de productos por inversión: cantidad de unidades compradas, costo unitario base, costo con flete prorrateado y precio sugerido de venta.
- Seguimiento de unidades en stock y unidades vendidas por lote.

### 🛒 3. Registro de Ventas y Deducción de Inventario
- Formulario ágil para registrar ventas unitarias o múltiples.
- Cálculo automático de costo COGS y ganancia neta en el momento exacto de la venta.
- Desglose multimoneda por método de pago:
  - 💵 Efectivo (USD / VES)
  - 📱 Pago Móvil
  - 💳 Punto de Venta (Tarjeta)
  - 🏦 Transferencia Bancaria
  - ⚡ Zelle
  - 🪙 Binance Pay (USDT)

### 💰 4. Módulo de Ganancias y Rentabilidad
- Auditoría financiera de cada venta: Precio de Venta, Costo COGS, Margen Bruto ($ y %), Markup.
- Ranking de productos más vendidos y más rentables.
- Distribución de ingresos por método de pago (Gráfico Donut interactivo).

### 🇻🇪 5. Tasa Oficial BCV Automatizada
- Monitor y sincronizador en vivo de la tasa oficial del Banco Central de Venezuela.
- Historial de variaciones cambiarias con gráficos de fluctuación.
- Soporte para actualización manual o automática con caché inteligente.

### 🔐 6. Autenticación Robusta y Verificación de Correo
- **Registro con Verificación Obligatoria**:
  - Código numérico aleatorio de **8 dígitos** (`10000000` - `99999999`) con vigencia de 24 horas.
  - **Correo Oficial de Bienvenida** con datos del negocio, clave destacada y canales de soporte directo.
  - Pantalla interactiva en 2 pasos sin recarga de página.
- **Recuperación de Contraseña Segura**:
  - Clave de 8 dígitos de un solo uso con expiración de 15 minutos.
  - Flujo guiado de 3 pasos: Solicitud -> Verificación del Código -> Nueva Contraseña.
- **Seguridad en Múltiples Capas**:
  - Backend protegido por middleware y dependencias FastAPI (`HTTP 403 Forbidden` si la cuenta no está verificada).
  - Redirección automática en el Frontend (`AppLayout`) para impedir acceso al Dashboard sin verificar.

### 👑 7. Rol SuperAdmin y Empresa 1
- Acceso global consolidado para la empresa propietaria (`Theizer dev`).
- Visualización de métricas, inversiones y ventas de todo el sistema.
- Insignia distintiva dorada (`👑 Empresa Principal • SuperAdmin`) en el perfil de usuario.

### 📧 8. Módulo de Integraciones: SMTP de Google (Gmail)
- Configuración exclusiva para SuperAdmin del servidor SMTP (`smtp.gmail.com`).
- Soporte para puertos `587` (STARTTLS) y `465` (SSL).
- Generador de contraseñas de aplicación y probador de conexión en tiempo real con diagnóstico inmediato.

### 💬 9. Widget Flotante de Soporte por WhatsApp
- Burbuja interactiva persistente en todas las pantallas (Auth y Dashboard).
- Conectada al número oficial `+58 422 387 7002` ([wa.me/584223877002](https://wa.me/584223877002)).
- Tarjeta de chat desplegable con respuestas rápidas personalizadas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | [Next.js 16 (Turbopack)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [ApexCharts](https://apexcharts.com/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.10+](https://python.org/), [Uvicorn](https://www.uvicorn.org/), [Pydantic v2](https://docs.pydantic.dev/), [SQLAlchemy](https://www.sqlalchemy.org/), [PyJWT](https://pyjwt.readthedocs.io/), [Passlib/Bcrypt](https://passlib.readthedocs.io/) |
| **Bases de Datos** | [MySQL 8.0+](https://www.mysql.com/) (Laragon / Debian / Docker) o [SQLite 3](https://sqlite.org/) |
| **Arquitectura** | RESTful API, Autenticación JWT Bearer, Layouts Modulares, Auto-migraciones SQL |

---

## 📂 Estructura del Repositorio

```text
adatov/
├── backend/                  # Servidor de API RESTful en FastAPI
│   ├── app/
│   │   ├── api/              # Endpoints Versionados (v1)
│   │   │   ├── v1/
│   │   │   │   ├── auth.py          # Login, registro, verificación 8 dígitos, reset
│   │   │   │   ├── bcv.py           # Tasas de cambio oficiales y scraper
│   │   │   │   ├── integrations.py  # Configuración SMTP de Google y pruebas
│   │   │   │   ├── investments.py   # Gestión de compras e inventario
│   │   │   │   └── sales.py         # Ventas, COGS y analítica de ganancias
│   │   │   └── deps.py              # Inyección de dependencias y validación JWT
│   │   ├── core/             # Configuraciones, seguridad y hashing
│   │   ├── db/               # Conexión SQLAlchemy y Seeders
│   │   ├── models/           # Modelos de Base de Datos (User, Sale, Investment, etc.)
│   │   └── schemas/          # Esquemas de Validación Pydantic
│   ├── init_db.py            # Inicializador de base de datos y migraciones automáticas
│   ├── seed.py               # Seeder de Empresa 1 (Theizer dev)
│   └── requirements.txt      # Dependencias de Python
│
├── frontend/                 # Aplicación Web Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/        # Rutas Privadas del Sistema
│   │   │   │   ├── dashboard/       # Tablero principal con gráficos dinámicos
│   │   │   │   ├── inversiones/     # Lotes de compra y stock
│   │   │   │   ├── ventas/          # Registro de ventas al detalle
│   │   │   │   ├── ganancias/       # Métricas de margen, markup y COGS
│   │   │   │   ├── bcv/             # Tasas oficiales y calculadora
│   │   │   │   └── integraciones/   # SMTP de Google (Gmail)
│   │   │   └── (auth)/       # Rutas de Autenticación
│   │   │       ├── login/           # Inicio de sesión
│   │   │       ├── register/        # Registro en 2 pasos
│   │   │       ├── verify-email/    # Verificación de clave de 8 dígitos
│   │   │       ├── forgot-password/ # Olvido de contraseña
│   │   │       └── reset-password/  # Cambio de clave con código
│   │   ├── components/       # Componentes de UI (Sidebar, Headers, WhatsApp Widget)
│   │   ├── context/          # Estado global de autenticación (AuthContext)
│   │   └── lib/              # Cliente HTTP y utilidades
│   └── package.json          # Dependencias de Frontend
│
├── dev.py                    # Script de ejecución concurrente de desarrollo
├── setup.bat / setup.sh      # Scripts de instalación automatizada
├── start.bat / start.sh      # Scripts de arranque rápido
└── package.json              # Orquestador raíz npm
```

---

## ⚡ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js**: v18.0 o superior ([Descargar Node.js](https://nodejs.org/))
- **Python**: v3.10 o superior ([Descargar Python](https://www.python.org/))
- **Gestor de Base de Datos**: MySQL (ej. [Laragon](https://laragon.org/) en puerto 3307 o 3306) o SQLite.

---

### 1. Clonar el Repositorio
```bash
git clone https://github.com/theizerdev/quadralo.git
cd quadralo
```

---

### 2. Configurar Variables de Entorno

#### Backend (`backend/.env`):
```ini
PROJECT_NAME="Quádralo"
API_V1_STR="/api/v1"
SECRET_KEY="tu_clave_secreta_jwt_para_firmar_tokens"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Configuración de Base de Datos (MySQL)
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=quadralo

DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/quadralo?charset=utf8mb4
```

#### Frontend (`frontend/.env.local`):
```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api/v1
```

---

### 3. Instalación de Dependencias e Inicialización

Puedes usar el comando automatizado:

```bash
# Windows
setup.bat

# Linux / MacOS
chmod +x setup.sh && ./setup.sh
```

O hacerlo paso a paso vía npm:

```bash
# 1. Instalar dependencias
npm run install:all

# 2. Configurar entorno virtual de Python
cd backend
python -m venv venv
# Windows:
venv\Scripts\pip install -r requirements.txt
# Linux / MacOS:
venv/bin/pip install -r requirements.txt
cd ..

# 3. Inicializar Base de Datos y Seeders
npm run init:db
```

---

### 4. Ejecutar el Proyecto en Desarrollo

Inicia ambos servicios (Backend y Frontend) simultáneamente con un solo comando:

```bash
npm run dev
# o directamente:
python dev.py
```

- 🌐 **Frontend (Next.js)**: [http://localhost:3001](http://localhost:3001)
- ⚙️ **Backend API (FastAPI)**: [http://127.0.0.1:8001](http://127.0.0.1:8001)
- 📖 **Documentación Interactiva Swagger**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 🔑 Credenciales por Defecto (Empresa 1 - Seeder)

Al ejecutar la inicialización de base de datos (`npm run init:db` o `npm run seed`), se crea automáticamente el usuario SuperAdmin:

| Campo | Valor |
|---|---|
| **Empresa** | `Theizer dev` |
| **Propietario** | `Theizer Gonzalez` |
| **Correo** | `theizerdev@gmail.com` |
| **Contraseña** | `password123*` |
| **Teléfono** | `04241703465` |
| **Rol** | `superadmin` (Acceso Global y Menú de Integraciones) |

---

## 🧪 Comandos Útiles

```bash
# Compilar frontend para producción (verificación de tipos y rutas estáticas)
cd frontend && npm run build

# Ejecutar únicamente seeders de la base de datos
npm run seed

# Detener servidores en desarrollo
Ctrl + C
```

---

## 📞 Canales Oficiales de Soporte

- 💬 **WhatsApp Oficial / Desarrollador**: [+58 422 387 7002](https://wa.me/584223877002)
- ✉️ **Correo Electrónico**: [theizerdev@gmail.com](mailto:theizerdev@gmail.com)
- 🌐 **Desarrollador**: [Theizer Gonzalez](https://github.com/theizerdev)

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

<div align="center">
  <sub>Desarrollado con dedicación por <strong>Theizer Gonzalez</strong> • Quádralo SaaS © 2026</sub>
</div>
