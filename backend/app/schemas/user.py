from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    business_name: str
    phone: Optional[str] = None
    role: str = "user"
    is_superuser: bool = False
    is_active: bool
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegisterResponse(BaseModel):
    message: str
    success: bool = True
    requires_verification: bool = True
    email: EmailStr
    verification_code: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class TokenData(BaseModel):
    user_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    code: Optional[str] = None
    new_password: str

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordWithCodeRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True
    reset_code: Optional[str] = None
    reset_token: Optional[str] = None
