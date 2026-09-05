"""
Quádralo - Database Seeder
Crea / actualiza el usuario de la Empresa 1 (Principal / SuperAdmin) dueña del sistema con acceso global a todo.
"""
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy.orm import Session
from app.db.database import engine
from app.models.user import User
from app.core.security import get_password_hash

SEEDER_USER = {
    "email": "theizerdev@gmail.com",
    "password": "password123*",
    "full_name": "Theizer Gonzalez",
    "business_name": "Theizer dev",
    "phone": "04241703465",
    "role": "superadmin",
    "is_superuser": True,
    "is_active": True,
    "is_verified": True,
}

def run_seeders(db: Session = None):
    close_db = False
    if db is None:
        db = Session(bind=engine)
        close_db = True

    try:
        print("[*] Ejecutando Seeder de Empresa 1 (Principal / Propietaria del Sistema)...")
        existing_user = db.query(User).filter(User.email == SEEDER_USER["email"].lower()).first()

        hashed_pwd = get_password_hash(SEEDER_USER["password"])

        if existing_user:
            existing_user.full_name = SEEDER_USER["full_name"]
            existing_user.business_name = SEEDER_USER["business_name"]
            existing_user.phone = SEEDER_USER["phone"]
            existing_user.role = SEEDER_USER["role"]
            existing_user.is_superuser = SEEDER_USER["is_superuser"]
            existing_user.is_active = SEEDER_USER["is_active"]
            existing_user.is_verified = True
            existing_user.hashed_password = hashed_pwd
            db.commit()
            print(f"[OK] Usuario Empresa 1 '{SEEDER_USER['email']}' actualizado con privilegios de SuperAdmin.")
        else:
            new_user = User(
                email=SEEDER_USER["email"].lower(),
                hashed_password=hashed_pwd,
                full_name=SEEDER_USER["full_name"],
                business_name=SEEDER_USER["business_name"],
                phone=SEEDER_USER["phone"],
                role=SEEDER_USER["role"],
                is_superuser=SEEDER_USER["is_superuser"],
                is_active=SEEDER_USER["is_active"],
                is_verified=True,
            )
            db.add(new_user)
            db.commit()
            print(f"[OK] Usuario Empresa 1 '{SEEDER_USER['email']}' creado exitosamente como SuperAdmin.")

        print("="*60)
        print("  EMPRESA 1 - CREDENCIALES CONFIGURADAS:")
        print(f"  * Empresa:    {SEEDER_USER['business_name']}")
        print(f"  * Propietario: {SEEDER_USER['full_name']}")
        print(f"  * Correo:     {SEEDER_USER['email']}")
        print(f"  * Teléfono:   {SEEDER_USER['phone']}")
        print(f"  * Rol:        {SEEDER_USER['role']} (Acceso Global)")
        print("="*60)
        return True
    except Exception as e:
        db.rollback()
        print(f"[!] Error al ejecutar seeder: {e}")
        return False
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    run_seeders()
