"""
Quádralo - Runner de Seeders
Ejecuta la población inicial de usuarios y datos del sistema.
"""
import sys
import os

import argparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.db.seeder import run_seeders
from app.db.test_data_seeder import seed_test_data

def main():
    parser = argparse.ArgumentParser(description="Quádralo - Runner de Seeders de Base de Datos")
    parser.add_argument("--test-data", action="store_true", help="Poblar inversiones y ventas de prueba para Usuario 1")
    parser.add_argument("--only-user", action="store_true", help="Crear únicamente el usuario SuperAdmin principal")
    parser.add_argument("--all", action="store_true", help="Ejecutar tanto el usuario como los datos de prueba")
    args = parser.parse_args()

    if args.test_data and not args.all:
        return seed_test_data()

    ok_user = run_seeders()
    if not ok_user:
        return False

    if args.only_user:
        return True

    return seed_test_data()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

