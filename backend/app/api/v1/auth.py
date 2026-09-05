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

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicita restablecimiento de contraseña generando un token seguro."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # Para mayor seguridad, no revelamos explícitamente si el correo existe o no
    if not user:
        return MessageResponse(
            message="Si el correo existe en nuestro sistema, se ha generado el enlace de restablecimiento.",
            success=True
        )
    
    reset_token = create_reset_token(subject=user.id)
    return MessageResponse(
        message="Se ha generado el enlace para restablecer tu contraseña. Válido por 30 minutos.",
        success=True,
        reset_token=reset_token
    )

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Aplica la nueva contraseña validando el token de restablecimiento."""
    user_id = verify_reset_token(req.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de restablecimiento es inválido o ha expirado."
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return MessageResponse(
        message="Contraseña actualizada exitosamente. Ahora puedes iniciar sesión.",
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

