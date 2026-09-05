import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.integration import SMTPSettings
from app.schemas.integration import (
    SMTPSettingsCreate,
    SMTPSettingsResponse,
    TestEmailRequest,
)
from app.api.deps import get_current_user

router = APIRouter()

def require_superadmin(current_user: User):
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido: Módulo exclusivo para el Propietario / Empresa Principal del Sistema."
        )

@router.get("/smtp", response_model=SMTPSettingsResponse)
def get_smtp_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener la configuración actual del servidor SMTP de Google."""
    require_superadmin(current_user)

    setting = db.query(SMTPSettings).first()
    if not setting:
        return SMTPSettingsResponse(
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_user=current_user.email,
            sender_name="Quádralo Finanzas",
            use_tls=True,
            use_ssl=False,
            is_active=True,
            has_password=False,
            updated_at=None
        )

    return SMTPSettingsResponse(
        id=setting.id,
        smtp_host=setting.smtp_host,
        smtp_port=setting.smtp_port,
        smtp_user=setting.smtp_user,
        sender_name=setting.sender_name,
        use_tls=setting.use_tls,
        use_ssl=setting.use_ssl,
        is_active=setting.is_active,
        has_password=bool(setting.smtp_password),
        updated_at=setting.updated_at
    )

@router.post("/smtp", response_model=SMTPSettingsResponse)
def save_smtp_settings(
    config: SMTPSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Guardar o actualizar la configuración de SMTP de Google."""
    require_superadmin(current_user)

    setting = db.query(SMTPSettings).first()
    if not setting:
        if not config.smtp_password:
            raise HTTPException(
                status_code=400,
                detail="Debes ingresar la contraseña de aplicación de Google para la configuración inicial."
            )
        setting = SMTPSettings(
            user_id=current_user.id,
            smtp_host=config.smtp_host,
            smtp_port=config.smtp_port,
            smtp_user=config.smtp_user,
            smtp_password=config.smtp_password.strip(),
            sender_name=config.sender_name,
            use_tls=config.use_tls,
            use_ssl=config.use_ssl,
            is_active=config.is_active
        )
        db.add(setting)
    else:
        setting.smtp_host = config.smtp_host
        setting.smtp_port = config.smtp_port
        setting.smtp_user = config.smtp_user
        setting.sender_name = config.sender_name
        setting.use_tls = config.use_tls
        setting.use_ssl = config.use_ssl
        setting.is_active = config.is_active
        if config.smtp_password and config.smtp_password.strip():
            setting.smtp_password = config.smtp_password.strip()

    db.commit()
    db.refresh(setting)

    return SMTPSettingsResponse(
        id=setting.id,
        smtp_host=setting.smtp_host,
        smtp_port=setting.smtp_port,
        smtp_user=setting.smtp_user,
        sender_name=setting.sender_name,
        use_tls=setting.use_tls,
        use_ssl=setting.use_ssl,
        is_active=setting.is_active,
        has_password=bool(setting.smtp_password),
        updated_at=setting.updated_at
    )

@router.post("/smtp/test")
def send_test_email(
    req: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Prueba la conexión enviando un correo electrónico real usando la configuración SMTP."""
    require_superadmin(current_user)

    setting = db.query(SMTPSettings).first()
    if not setting or not setting.smtp_password:
        raise HTTPException(
            status_code=400,
            detail="El servidor SMTP de Google no está configurado aún o no tiene contraseña de aplicación guardada."
        )

    try:
        # Preparar Mensaje MIME
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🚀 Quádralo - Verificación Exitosa de SMTP de Google"
        msg["From"] = f"{setting.sender_name} <{setting.smtp_user}>"
        msg["To"] = req.recipient_email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090D16; color: #ffffff; padding: 20px; }}
            .card {{ background: #111827; border: 1px solid #10b981; border-radius: 16px; padding: 30px; max-width: 520px; margin: 0 auto; }}
            .logo {{ font-size: 24px; font-weight: 800; color: #10b981; margin-bottom: 10px; }}
            .badge {{ display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; margin-bottom: 20px; }}
            p {{ color: #d1d5db; line-height: 1.6; font-size: 14px; }}
            .details {{ background: #1f2937; border-radius: 10px; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 13px; color: #e5e7eb; }}
            .footer {{ border-top: 1px solid #374151; padding-top: 15px; margin-top: 25px; font-size: 11px; color: #9ca3af; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">Quádralo</div>
            <div class="badge">Prueba de Conexión SMTP Exitosa</div>
            <h2 style="color: #ffffff; margin-top: 0;">¡Tu servidor SMTP está listo para enviar correos!</h2>
            <p>Hola <strong>{current_user.full_name}</strong>,</p>
            <p>Este correo confirma que la integración con <strong>Google SMTP (Gmail)</strong> ha sido configurada y verificada exitosamente en tu plataforma Quádralo.</p>
            
            <div class="details">
              <div><strong>Servidor:</strong> {setting.smtp_host}:{setting.smtp_port}</div>
              <div><strong>Remitente:</strong> {setting.smtp_user}</div>
              <div><strong>Seguridad:</strong> {"TLS (STARTTLS)" if setting.use_tls else "SSL" if setting.use_ssl else "Estándar"}</div>
              <div><strong>Fecha:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>

            <p>A partir de ahora, las alertas automáticas, reportes y correos de restablecimiento de contraseña se enviarán usando esta cuenta autorizada.</p>

            <div class="footer">
              Quádralo - Tus finanzas siempre al día.<br>
              Empresa Principal: Theizer dev • +58 424 170 3465
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Conectar y Enviar
        if setting.use_ssl or setting.smtp_port == 465:
            server = smtplib.SMTP_SSL(setting.smtp_host, setting.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(setting.smtp_host, setting.smtp_port, timeout=15)
            if setting.use_tls:
                server.starttls()

        server.login(setting.smtp_user, setting.smtp_password)
        server.sendmail(setting.smtp_user, req.recipient_email, msg.as_string())
        server.quit()

        return {
            "success": True,
            "message": f"¡Correo de prueba enviado con éxito a {req.recipient_email}!"
        }

    except smtplib.SMTPAuthenticationError as auth_err:
        raise HTTPException(
            status_code=400,
            detail=(
                "Error de autenticación con Google SMTP. Asegúrate de estar usando una "
                "'Contraseña de Aplicación' de 16 caracteres generada en tu cuenta de Google, "
                "no tu contraseña personal habitual."
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar correo vía SMTP ({setting.smtp_host}:{setting.smtp_port}): {str(e)}"
        )
