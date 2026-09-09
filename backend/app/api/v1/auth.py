import secrets
import smtplib
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.integration import SMTPSettings
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin,
    RegisterResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordWithCodeRequest,
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

def send_welcome_and_verification_email(db: Session, user: User, code: str) -> bool:
    """Envía un correo de bienvenida oficial con clave de 8 dígitos y canales de soporte."""
    smtp_config = db.query(SMTPSettings).first()
    if not smtp_config or not smtp_config.is_active or not smtp_config.smtp_password:
        return False

    try:
        msg = MIMEMultipart("alternative")
        sender_name = getattr(smtp_config, "sender_name", None) or getattr(smtp_config, "from_name", "Quádralo")
        sender_email = getattr(smtp_config, "smtp_user", None) or getattr(smtp_config, "from_email", None)
        if not sender_email:
            return False

        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = user.email
        msg["Subject"] = f"🚀 ¡Bienvenido a Quádralo! Activa tu cuenta con la clave: {code}"

        business_val = user.business_name or "Mi Negocio"
        user_val = user.full_name or "Usuario"
        encoded_business = business_val.replace(" ", "%20")
        encoded_user = user_val.replace(" ", "%20")

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .card {{ background-color: #ffffff; max-width: 580px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%); padding: 36px 28px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }}
            .header p {{ margin: 8px 0 0 0; opacity: 0.92; font-size: 14px; }}
            .content {{ padding: 32px 28px; }}
            .welcome-box {{ background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; }}
            .welcome-box h3 {{ margin: 0 0 6px 0; color: #15803d; font-size: 16px; font-weight: 700; }}
            .welcome-box p {{ margin: 0; font-size: 13.5px; color: #166534; line-height: 1.55; }}
            .code-container {{ background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px dashed #059669; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }}
            .code-label {{ font-size: 12px; font-weight: 700; text-transform: uppercase; color: #047857; letter-spacing: 1.5px; margin-bottom: 8px; }}
            .code-number {{ font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #065f46; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
            .code-note {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
            .channels-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-top: 24px; }}
            .channels-box h4 {{ margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700; }}
            .channel-item {{ display: block; padding: 12px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px; text-decoration: none; color: #1e293b; font-size: 13px; font-weight: 600; }}
            .channel-item:hover {{ background-color: #f1f5f9; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>¡Bienvenido a Quádralo!</h1>
              <p>Tu plataforma SaaS de gestión de compras, ventas y control financiero</p>
            </div>
            
            <div class="content">
              <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>{user.full_name}</strong>,</p>
              
              <div class="welcome-box">
                <h3>🏢 Negocio: {user.business_name}</h3>
                <p>¡Nos complace darte la bienvenida a Quádralo! Desde hoy contarás con una solución integral para registrar compras de mercancía, calcular costos unitarios y márgenes de ganancia, registrar ventas al detalle y sincronizar en vivo la tasa oficial del BCV.</p>
              </div>

              <p style="font-size: 14px; color: #475569; margin: 0 0 10px 0;">Para verificar que tu correo es real y activar inmediatamente tu cuenta, ingresa el siguiente <strong>código de verificación de 8 dígitos</strong>:</p>

              <div class="code-container">
                <div class="code-label">Clave de Activación</div>
                <div class="code-number">{code}</div>
                <div class="code-note">Código válido por 24 horas. Introduce únicamente los 8 dígitos en la pantalla.</div>
              </div>

              <div class="channels-box">
                <h4>📞 Canales Oficiales de Contacto y Soporte Directo</h4>
                <p style="font-size: 12.5px; color: #64748b; margin: 0 0 14px 0;">¿Necesitas orientación para cargar tus inversiones o configurar tu negocio? Nuestro desarrollador y equipo de soporte están a tu disposición:</p>
                
                <a href="https://wa.me/584223877002?text=Hola%2C%20soy%20{encoded_user}%20del%20negocio%20{encoded_business}%20y%20acabo%20de%20registrarme%20en%20Qu%C3%A1dralo" target="_blank" class="channel-item" style="border-left: 4px solid #22c55e;">
                  <span>💬 <strong>WhatsApp Oficial con el Desarrollador:</strong> +58 422 387 7002</span>
                </a>

                <div class="channel-item" style="border-left: 4px solid #0284c7;">
                  <span>✉️ <strong>Correo de Atención:</strong> {smtp_config.smtp_user or 'theizerdev@gmail.com'}</span>
                </div>
              </div>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">Si tú no creaste esta cuenta, puedes ignorar este mensaje de forma segura.</p>
            </div>

            <div class="footer">
              Quádralo SaaS • Sistema de Control Financiero Empresarial<br>
              Tus finanzas siempre al día • Plataforma Segura SSL 256-bit
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
        return True
    except Exception as e:
        import traceback
        print(f"[!] Error enviando correo de bienvenida/verificación: {e}")
        traceback.print_exc()
        return False

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario solicitando verificación de correo con clave de 8 dígitos y mensaje de bienvenida."""
    db_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado en el sistema."
        )
    
    # Generar código aleatorio de 8 dígitos numéricos (10000000 a 99999999)
    code_int = secrets.randbelow(90000000) + 10000000
    code_str = str(code_int)
    
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        business_name=user_in.business_name,
        phone=user_in.phone,
        is_verified=False,
        verification_code=code_str,
        verification_code_expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar correo de bienvenida con código y canales de contacto vía SMTP
    email_sent = send_welcome_and_verification_email(db, new_user, code_str)
    
    return RegisterResponse(
        message=f"¡Bienvenido a Quádralo! Hemos enviado una clave de 8 dígitos a {new_user.email} para verificar tu cuenta.",
        success=True,
        requires_verification=True,
        email=new_user.email,
        verification_code=code_str if not email_sent else None
    )

@router.post("/verify-email", response_model=Token)
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verifica el correo electrónico con la clave de 8 dígitos y activa la cuenta para iniciar sesión."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una cuenta registrada con este correo electrónico."
        )
    
    if user.is_verified:
        access_token = create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    
    clean_code = req.code.strip()
    if not user.verification_code or user.verification_code != clean_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La clave de 8 dígitos ingresada es incorrecta. Por favor verifica."
        )
    
    now = datetime.now(timezone.utc)
    expires_at = user.verification_code_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La clave de verificación de 8 dígitos ha expirado. Solicita un nuevo código."
        )
    
    # Activar usuario y limpiar código
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Reenvía la clave de 8 dígitos de verificación de correo."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        return MessageResponse(
            message=f"Si el correo {req.email} está registrado, recibirás un nuevo código de verificación.",
            success=True
        )
    
    if user.is_verified:
        return MessageResponse(
            message="Tu cuenta ya está verificada. Ya puedes iniciar sesión normalmente.",
            success=True
        )
    
    code_int = secrets.randbelow(90000000) + 10000000
    code_str = str(code_int)
    user.verification_code = code_str
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    
    email_sent = send_welcome_and_verification_email(db, user, code_str)
    
    return MessageResponse(
        message=f"Hemos enviado un nuevo código de 8 dígitos a {user.email}.",
        success=True,
        reset_code=code_str if not email_sent else None
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
        
    if not user.is_verified and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes verificar tu correo electrónico antes de ingresar. Hemos enviado un código de 8 dígitos a tu bandeja de entrada."
        )
        
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Genera una clave aleatoria de 8 dígitos y la envía al correo del usuario vía SMTP."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        return MessageResponse(
            message=f"Si el correo {req.email} está registrado, recibirás un código de 8 dígitos en breve.",
            success=True
        )

    code_int = secrets.randbelow(90000000) + 10000000
    code_str = str(code_int)

    user.reset_code = code_str
    user.reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    email_sent = False
    smtp_config = db.query(SMTPSettings).first()
    if smtp_config and smtp_config.is_active and smtp_config.smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            sender_name = getattr(smtp_config, "sender_name", None) or getattr(smtp_config, "from_name", "Quádralo")
            sender_email = getattr(smtp_config, "smtp_user", None) or getattr(smtp_config, "from_email", None)
            if not sender_email:
                return MessageResponse(
                    message=f"Si el correo {req.email} está registrado, recibirás un enlace de recuperación.",
                    success=True
                )

            msg["From"] = f"{sender_name} <{sender_email}>"
            msg["To"] = user.email
            msg["Subject"] = f"🔐 Código de Recuperación de Contraseña ({code_str})"

            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .card {{ background-color: #ffffff; max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
                .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
                .header p {{ margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; }}
                .content {{ padding: 28px 24px; }}
                .code-box {{ background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px dashed #059669; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0; }}
                .code-label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; color: #047857; letter-spacing: 1px; margin-bottom: 6px; }}
                .code {{ font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #065f46; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
                .footer {{ padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>Restablecer Contraseña</h1>
                  <p>Quádralo - Sistema de Gestión Financiera</p>
                </div>
                <div class="content">
                  <p style="font-size: 14px; margin-top: 0;">Hola <strong>{user.full_name}</strong>,</p>
                  <p style="font-size: 14px; color: #475569;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>{user.business_name}</strong>.</p>
                  
                  <div class="code-box">
                    <div class="code-label">Tu Clave de 8 Dígitos</div>
                    <div class="code">{code_str}</div>
                  </div>

                  <p style="font-size: 12px; color: #9ca3af;">Este código de 8 dígitos es de un solo uso y expirará en <strong>15 minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este mensaje.</p>
                </div>
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
            import traceback
            print(f"[!] Error enviando correo de recuperación: {e}")
            traceback.print_exc()
            email_sent = False

    return MessageResponse(
        message=f"Hemos enviado un código de 8 dígitos a {req.email}. Revisa tu bandeja de entrada.",
        success=True,
        reset_code=code_str if not email_sent else None
    )

@router.post("/verify-reset-code", response_model=MessageResponse)
def verify_reset_code(req: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    """Verifica si el código de 8 dígitos de recuperación ingresado es válido y no ha expirado."""
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
