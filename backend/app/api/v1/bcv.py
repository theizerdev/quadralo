from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.bcv import (
    get_all_rates_detailed,
    set_user_bcv_rate,
    reset_user_bcv_rate,
    fetch_all_rates_from_apis,
)

router = APIRouter()

class BCVRateUpdate(BaseModel):
    rate: float = Field(..., gt=0, description="Nueva tasa personalizada para USD en Bolívares por Dólar")

@router.get("/latest")
def get_all_exchange_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene en tiempo real:
    1. Dólar BCV Oficial (y si el usuario tiene tasa manual activa).
    2. Euro BCV Oficial.
    3. Referencia de Compra de USDT en Venezuela (Binance P2P).
    """
    return get_all_rates_detailed(db, current_user.id)

@router.post("/sync")
def sync_all_exchange_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fuerza la sincronización en vivo con las APIs oficiales y P2P."""
    fetch_all_rates_from_apis()
    return get_all_rates_detailed(db, current_user.id)

@router.post("/update")
def update_bcv_rate(
    data: BCVRateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Establece una tasa manual fija de USD para este usuario/negocio."""
    set_user_bcv_rate(db, current_user.id, data.rate)
    return get_all_rates_detailed(db, current_user.id)

@router.post("/reset")
def reset_to_official_bcv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restablece a la tasa oficial del BCV en tiempo real."""
    reset_user_bcv_rate(db, current_user.id)
    return get_all_rates_detailed(db, current_user.id)
