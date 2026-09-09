"""
Quádralo Fullstack Runner
Ejecuta el Backend (FastAPI) y Frontend (Next.js) concurrentemente.
"""
import subprocess
import sys
import os
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    python_exec = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exec):
        python_exec = os.path.join(backend_dir, "venv", "bin", "python")
    if not os.path.exists(python_exec):
        python_exec = sys.executable

    if "--init-db" in sys.argv:
        init_db_script = os.path.join(backend_dir, "init_db.py")
        print(f"[*] Ejecutando inicializador de base de datos con: {python_exec}")
        res = subprocess.run([python_exec, init_db_script], cwd=backend_dir)
        sys.exit(res.returncode)

    if "--seed" in sys.argv:
        seed_script = os.path.join(backend_dir, "seed.py")
        print(f"[*] Ejecutando Seeders con: {python_exec}")
        res = subprocess.run([python_exec, seed_script], cwd=backend_dir)
        sys.exit(res.returncode)

    backend_port = os.getenv("BACKEND_PORT", "8001")
    frontend_port = os.getenv("FRONTEND_PORT", "3001")

    print("\n" + "="*55)
    print("      QUÁDRALO - Servidor Fullstack Iniciado")
    print("="*55)
    print(f"  * Backend FastAPI:  http://127.0.0.1:{backend_port}")
    print(f"  * Frontend Next.js: http://localhost:{frontend_port}")
    print(f"  * Documentación API: http://127.0.0.1:{backend_port}/docs")
    print("="*55)
    print("Presiona Ctrl + C para detener ambos servidores.\n")

    backend_cmd = [python_exec, "-m", "uvicorn", "app.main:app", "--reload", "--port", str(backend_port)]
    frontend_env = os.environ.copy()
    frontend_env["PORT"] = str(frontend_port)
    frontend_cmd = ["npm.cmd", "run", "dev", "--", "-p", str(frontend_port)] if sys.platform == "win32" else ["npm", "run", "dev", "--", "-p", str(frontend_port)]

    processes = []
    try:
        p_backend = subprocess.Popen(backend_cmd, cwd=backend_dir)
        processes.append(p_backend)

        p_frontend = subprocess.Popen(frontend_cmd, cwd=frontend_dir, env=frontend_env)
        processes.append(p_frontend)

        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\nDeteniendo servidores...")
        for p in processes:
            p.terminate()
            try:
                p.wait(timeout=2)
            except subprocess.TimeoutExpired:
                p.kill()
        print("Servidores detenidos exitosamente.")

if __name__ == "__main__":
    main()
