"""
Quádralo - Script de Inicialización de Base de Datos y Tablas
Compatible con MySQL (Laragon / Debian / Docker) y SQLite
"""
import sys
import os

# Asegurar soporte UTF-8 en terminales de Windows y Linux
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Asegurar que el directorio de la aplicación esté en sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import make_url
from app.core.config import settings

def create_database_if_not_exists():
    db_url = settings.get_database_url
    print("[*] Analizando configuracion de base de datos...")
    
    if db_url.startswith("mysql"):
        url = make_url(db_url)
        db_name = url.database or settings.DB_NAME
        
        # Conectar al servidor MySQL sin base de datos para crearla si no existe
        server_url = url.set(database=None)
        
        print(f"[*] Conectando al servidor MySQL en {url.host}:{url.port} (usuario: '{url.username}')...")
        try:
            server_engine = create_engine(
                server_url,
                isolation_level="AUTOCOMMIT",
                connect_args={"connect_timeout": 10}
            )
            with server_engine.connect() as conn:
                conn.execute(
                    text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                )
            print(f"[OK] Base de datos '{db_name}' lista y verificada.")
            server_engine.dispose()
        except Exception as e:
            print(f"\n[!] ERROR al conectar al servidor MySQL:")
            print(f"    {e}")
            print(f"\n[!] Por favor verifica:")
            print(f"    1. Que el servicio MySQL este iniciado (Laragon, XAMPP, o 'systemctl start mysql').")
            print(f"    2. Que el puerto en .env sea el correcto (ej. 3307 para Laragon, 3306 para Linux/Debian).")
            print(f"    3. Que las credenciales (usuario/contrasena) sean validas.")
            sys.exit(1)
    else:
        print("[*] Base de datos tipo SQLite seleccionada. Se creara el archivo automaticamente.")

def create_tables():
    print("[*] Inicializando modelos y creando tablas...")
    try:
        from app.db.database import Base, engine
        from app.models import user, investment, bcv, sale

        Base.metadata.create_all(bind=engine)
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Migración automática si la tabla users ya existía sin las columnas requeridas
        if "users" in tables:
            columns = [col["name"] for col in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "phone" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'phone' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER business_name;"))
                    conn.commit()
                    print("[OK] Columna 'phone' agregada exitosamente a la tabla 'users'.")
                if "role" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'role' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user' AFTER phone;"))
                    conn.commit()
                    print("[OK] Columna 'role' agregada exitosamente a la tabla 'users'.")
                if "is_superuser" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'is_superuser' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN NOT NULL DEFAULT 0 AFTER role;"))
                    conn.commit()
                    print("[OK] Columna 'is_superuser' agregada exitosamente a la tabla 'users'.")

        print(f"[OK] Tablas registradas exitosamente en la base de datos:")
        for t in tables:
            print(f"     -> {t}")
        
        # Ejecutar Seeders del sistema (Empresa 1 - Theizer dev)
        from app.db.seeder import run_seeders
        run_seeders()

        print("\n" + "="*60)
        print("  [OK] BASE DE DATOS, TABLAS Y SEEDERS CONFIGURADOS CON EXITO")
        print("="*60)
        return True
    except Exception as e:
        print(f"\n[!] ERROR al crear las tablas:")
        print(f"    {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("="*60)
    print("      QUADRALO - INICIALIZADOR DE BASE DE DATOS")
    print("="*60)
    create_database_if_not_exists()
    create_tables()
