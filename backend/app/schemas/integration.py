from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class SMTPSettingsCreate(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: EmailStr
    smtp_password: Optional[str] = None
    sender_name: str = "Quádralo Finanzas"
    use_tls: bool = True
    use_ssl: bool = False
    is_active: bool = True

class SMTPSettingsResponse(BaseModel):
    id: Optional[str] = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    sender_name: str
    use_tls: bool = True
    use_ssl: bool = False
    is_active: bool = True
    has_password: bool = False
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TestEmailRequest(BaseModel):
    recipient_email: EmailStr
