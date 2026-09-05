"""
Quádralo - Runner de Seeders
Ejecuta la población inicial de usuarios y datos del sistema.
"""
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.db.seeder import run_seeders

if __name__ == "__main__":
    success = run_seeders()
    sys.exit(0 if success else 1)
