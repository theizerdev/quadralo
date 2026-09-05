from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MessageResponse,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_reset_token,
    verify_reset_token,
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
    
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        business_name=user_in.business_name,
        phone=user_in.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(subject=new_user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

import secrets
import smtplib
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.models.integration import SMTPSettings
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordWithCodeRequest,
    ChangePasswordRequest,
    MessageResponse,
)

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Genera una clave aleatoria de 8 dígitos y la envía al correo del usuario vía SMTP."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Por seguridad no indicamos si existe o no, pero informamos que se envió el código
        return MessageResponse(
            message=f"Si el correo {req.email} está registrado, recibirás un código de 8 dígitos en breve.",
            success=True
        )

    # 1. Generar clave aleatoria numérica de 8 dígitos
    code_int = secrets.randbelow(90000000) + 10000000  # Rango 10000000 a 99999999
    code_str = str(code_int)

    # 2. Guardar en base de datos con expiración de 15 minutos
    user.reset_code = code_str
    user.reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    # 3. Intentar enviar correo vía SMTP de Google si está configurado
    email_sent = False
    smtp_config = db.query(SMTPSettings).first()
    if smtp_config and smtp_config.is_active and smtp_config.smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🔐 {code_str} es tu código de recuperación de Quádralo"
            msg["From"] = f"{smtp_config.sender_name} <{smtp_config.smtp_user}>"
            msg["To"] = user.email

            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090D16; color: #ffffff; padding: 25px; }}
                .card {{ background: #111827; border: 1px solid #10b981; border-radius: 16px; padding: 30px; max-width: 480px; margin: 0 auto; }}
                .logo {{ font-size: 24px; font-weight: 800; color: #10b981; margin-bottom: 6px; }}
                .code-box {{ background: #18181b; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
                .code {{ font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #34d399; }}
                p {{ color: #d1d5db; font-size: 14px; line-height: 1.6; }}
                .footer {{ border-top: 1px solid #374151; padding-top: 15px; margin-top: 25px; font-size: 11px; color: #9ca3af; text-align: center; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="logo">Quádralo</div>
                <h3 style="color: #ffffff; margin-top: 5px;">Recuperación de Contraseña</h3>
                <p>Hola <strong>{user.full_name}</strong>,</p>
                <p>Hemos recibido una solicitud para cambiar tu contraseña en Quádralo. Ingresa el siguiente código de 8 dígitos en la pantalla de verificación:</p>
                
                <div class="code-box">
                  <div class="code">{code_str}</div>
                </div>

                <p style="font-size: 12px; color: #9ca3af;">Este código de 8 dígitos es de un solo uso y expirará en <strong>15 minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este mensaje.</p>

                <div class="footer">
                  Quádralo - Tus finanzas siempre al día<br>
                  Plataforma Segura SSL 256-bit
                </div>
              </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            if smtp_config.use_ssl or smtp_config.smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_config.smtp_host, smtp_config.smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_config.smtp_host, smtp_config.smtp_port, timeout=12)
                if smtp_config.use_tls:
                    server.starttls()

            server.login(smtp_config.smtp_user, smtp_config.smtp_password)
            server.sendmail(smtp_config.smtp_user, user.email, msg.as_string())
            server.quit()
            email_sent = True
        except Exception as e:
            print(f"[!] Error al enviar correo SMTP de recuperación: {e}")

    return MessageResponse(
        message=f"Hemos enviado un código de 8 dígitos a {req.email}. Revisa tu bandeja de entrada.",
        success=True,
        reset_code=code_str if not email_sent else None
    )

@router.post("/verify-reset-code", response_model=MessageResponse)
def verify_reset_code(req: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    """Verifica si el código de 8 dígitos ingresado es válido y no ha expirado."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not user.reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay un proceso de recuperación activo para este correo."
        )

    if user.reset_code != req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de 8 dígitos ingresado es incorrecto. Por favor verifica."
        )

    now = datetime.now(timezone.utc)
    expires_at = user.reset_code_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at and expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de 8 dígitos ha expirado. Por favor solicita uno nuevo."
        )

    return MessageResponse(
        message="Código de 8 dígitos validado exitosamente. Procede a ingresar tu nueva contraseña.",
        success=True
    )

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Aplica la nueva contraseña validando el código de 8 dígitos o el token."""
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres."
        )

    user = None

    # Caso 1: Flujo principal con clave de 8 dígitos
    if req.email and req.code:
        user = db.query(User).filter(User.email == req.email.lower()).first()
        if not user or not user.reset_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se encontró una solicitud de restablecimiento para este correo."
            )
        if user.reset_code != req.code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de 8 dígitos es incorrecto."
            )
        now = datetime.now(timezone.utc)
        expires_at = user.reset_code_expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de 8 dígitos ha expirado. Solicita uno nuevo."
            )

    # Caso 2: Flujo alternativo con token JWT
    elif req.token:
        user_id = verify_reset_token(req.token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de restablecimiento es inválido o ha expirado."
            )
        user = db.query(User).filter(User.id == user_id).first()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan datos requeridos (correo y código de 8 dígitos)."
        )

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Guardar nueva contraseña y limpiar código usado
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_code = None
    user.reset_code_expires_at = None
    db.commit()

    return MessageResponse(
        message="¡Contraseña cambiada exitosamente! Ya puedes iniciar sesión con tu nueva clave.",
        success=True
    )

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cambia la contraseña del usuario actualmente autenticado."""
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres.")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return MessageResponse(
        message="Contraseña modificada correctamente.",
        success=True
    )

