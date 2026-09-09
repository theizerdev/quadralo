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
        server_url = url.set(database="")
        
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
        from app.models import user, investment, bcv, sale, integration

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
                if "reset_code" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'reset_code' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_code VARCHAR(8) NULL AFTER is_active;"))
                    conn.commit()
                    print("[OK] Columna 'reset_code' agregada exitosamente a la tabla 'users'.")
                if "reset_code_expires_at" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'reset_code_expires_at' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_code_expires_at DATETIME NULL AFTER reset_code;"))
                    conn.commit()
                    print("[OK] Columna 'reset_code_expires_at' agregada exitosamente a la tabla 'users'.")
                if "is_verified" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'is_verified' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 1 AFTER is_active;"))
                    conn.commit()
                    print("[OK] Columna 'is_verified' agregada exitosamente a la tabla 'users'.")
                if "verification_code" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'verification_code' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN verification_code VARCHAR(8) NULL AFTER is_verified;"))
                    conn.commit()
                    print("[OK] Columna 'verification_code' agregada exitosamente a la tabla 'users'.")
                if "verification_code_expires_at" not in columns:
                    print("[*] Aplicando actualizacion: agregando columna 'verification_code_expires_at' a la tabla 'users'...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN verification_code_expires_at DATETIME NULL AFTER verification_code;"))
                    conn.commit()
                    print("[OK] Columna 'verification_code_expires_at' agregada exitosamente a la tabla 'users'.")

        # Migración automática si la tabla investments ya existía sin la columna category o initial_quantity
        if "investments" in tables:
            columns_inv = [col["name"] for col in inspector.get_columns("investments")]
            with engine.connect() as conn:
                if "category" not in columns_inv:
                    print("[*] Aplicando actualizacion: agregando columna 'category' a la tabla 'investments'...")
                    if engine.url.get_backend_name() == "mysql":
                        conn.execute(text("ALTER TABLE investments ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER product_name;"))
                    else:
                        conn.execute(text("ALTER TABLE investments ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General';"))
                    conn.commit()
                    print("[OK] Columna 'category' agregada exitosamente a la tabla 'investments'.")
                if "initial_quantity" not in columns_inv:
                    print("[*] Aplicando actualizacion: agregando columna 'initial_quantity' a la tabla 'investments'...")
                    if engine.url.get_backend_name() == "mysql":
                        conn.execute(text("ALTER TABLE investments ADD COLUMN initial_quantity INT NOT NULL DEFAULT 1 AFTER quantity;"))
                    else:
                        conn.execute(text("ALTER TABLE investments ADD COLUMN initial_quantity INT NOT NULL DEFAULT 1;"))
                    conn.execute(text("UPDATE investments SET initial_quantity = quantity WHERE quantity > 0;"))
                    conn.commit()
                    print("[OK] Columna 'initial_quantity' agregada y sincronizada exitosamente en la tabla 'investments'.")

        if "sales" in tables:
            columns_sales = [col["name"] for col in inspector.get_columns("sales")]
            with engine.connect() as conn:
                is_mysql = engine.url.get_backend_name() == "mysql"
                if "category" not in columns_sales:
                    print("[*] Aplicando actualizacion: agregando columna 'category' a la tabla 'sales'...")
                    if is_mysql:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER product_name;"))
                    else:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General';"))
                    conn.commit()
                    # Sincronizar categorías de lotes ya vinculados
                    try:
                        if is_mysql:
                            conn.execute(text("UPDATE sales s JOIN investments i ON s.investment_id = i.id SET s.category = i.category WHERE s.investment_id IS NOT NULL;"))
                        else:
                            conn.execute(text("UPDATE sales SET category = (SELECT category FROM investments WHERE investments.id = sales.investment_id) WHERE investment_id IS NOT NULL;"))
                        conn.commit()
                    except Exception as e:
                        print(f"[*] Advertencia sincronizando categorias en ventas: {e}")
                    print("[OK] Columna 'category' agregada y sincronizada exitosamente en la tabla 'sales'.")

                if "payment_status" not in columns_sales:
                    print("[*] Aplicando actualizacion: agregando columna 'payment_status' a la tabla 'sales'...")
                    if is_mysql:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'paid' AFTER payment_method;"))
                    else:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'paid';"))
                    conn.commit()
                    print("[OK] Columna 'payment_status' agregada exitosamente a la tabla 'sales'.")

                if "paid_amount_usd" not in columns_sales:
                    print("[*] Aplicando actualizacion: agregando columnas financieras de cobro a 'sales'...")
                    if is_mysql:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN paid_amount_usd FLOAT NOT NULL DEFAULT 0.0 AFTER payment_status;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN paid_amount_ves FLOAT NOT NULL DEFAULT 0.0 AFTER paid_amount_usd;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN debt_amount_usd FLOAT NOT NULL DEFAULT 0.0 AFTER paid_amount_ves;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN debt_amount_ves FLOAT NOT NULL DEFAULT 0.0 AFTER debt_amount_usd;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN due_date DATETIME NULL AFTER debt_amount_ves;"))
                    else:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN paid_amount_usd FLOAT NOT NULL DEFAULT 0.0;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN paid_amount_ves FLOAT NOT NULL DEFAULT 0.0;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN debt_amount_usd FLOAT NOT NULL DEFAULT 0.0;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN debt_amount_ves FLOAT NOT NULL DEFAULT 0.0;"))
                        conn.execute(text("ALTER TABLE sales ADD COLUMN due_date DATETIME NULL;"))
                    # Inicializar ventas históricas como 100% pagadas
                    conn.execute(text("UPDATE sales SET paid_amount_usd = total_income_usd, paid_amount_ves = total_income_ves, debt_amount_usd = 0.0, debt_amount_ves = 0.0, payment_status = 'paid' WHERE total_income_usd > 0;"))
                    conn.commit()
                    print("[OK] Columnas de cuentas por cobrar agregadas y sincronizadas exitosamente en 'sales'.")

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
