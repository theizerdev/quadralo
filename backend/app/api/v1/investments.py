from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.investment import Investment
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentUpdate,
    InvestmentResponse,
    InvestmentSummary,
)
from app.api.deps import get_current_user
from app.services.bcv import get_current_bcv_rate

router = APIRouter()

@router.get("/", response_model=List[InvestmentResponse])
def get_user_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las inversiones registradas del usuario autenticado (READ - List)."""
    return (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .order_by(Investment.created_at.desc())
        .all()
    )

@router.post("/", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    investment_in: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar una nueva compra/inversión (CREATE)."""
    if investment_in.bcv_rate <= 0:
        raise HTTPException(status_code=400, detail="La tasa BCV debe ser mayor a 0")
    if investment_in.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
    if investment_in.amount_ves <= 0:
        raise HTTPException(status_code=400, detail="El monto en bolívares debe ser mayor a 0")

    # Cálculos matemáticos exactos
    amount_usd = round(investment_in.amount_ves / investment_in.bcv_rate, 2)
    
    # Manejar envío en Bolívares (VES) o USD
    if investment_in.shipping_cost_ves is not None and investment_in.shipping_cost_ves > 0:
        shipping_cost_usd = round(investment_in.shipping_cost_ves / investment_in.bcv_rate, 2)
    elif investment_in.shipping_cost_usd is not None and investment_in.shipping_cost_usd > 0:
        shipping_cost_usd = round(investment_in.shipping_cost_usd, 2)
    else:
        shipping_cost_usd = 0.0

    total_cost_usd = round(amount_usd + shipping_cost_usd, 2)
    unit_cost_usd = round(total_cost_usd / investment_in.quantity, 4)
    unit_cost_ves = round(unit_cost_usd * investment_in.bcv_rate, 2)

    new_investment = Investment(
        user_id=current_user.id,
        product_name=investment_in.product_name,
        amount_ves=investment_in.amount_ves,
        bcv_rate=investment_in.bcv_rate,
        amount_usd=amount_usd,
        quantity=investment_in.quantity,
        shipping_cost_usd=shipping_cost_usd,
        total_cost_usd=total_cost_usd,
        unit_cost_usd=unit_cost_usd,
        unit_cost_ves=unit_cost_ves,
        notes=investment_in.notes
    )

    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    return new_investment

@router.get("/summary", response_model=InvestmentSummary)
def get_investment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener métricas acumuladas de inversión para el usuario."""
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .all()
    )

    total_usd = sum(inv.total_cost_usd for inv in investments)
    total_ves = sum(inv.amount_ves + (inv.shipping_cost_usd * inv.bcv_rate) for inv in investments)
    total_items = sum(inv.quantity for inv in investments)
    total_shipping_usd = sum(inv.shipping_cost_usd for inv in investments)
    total_shipping_ves = sum(inv.shipping_cost_ves for inv in investments)
    current_rate = get_current_bcv_rate(db, current_user.id)

    return InvestmentSummary(
        total_invested_usd=round(total_usd, 2),
        total_invested_ves=round(total_ves, 2),
        total_items_count=total_items,
        total_shipping_usd=round(total_shipping_usd, 2),
        total_shipping_ves=round(total_shipping_ves, 2),
        investments_count=len(investments),
        current_bcv_rate=current_rate
    )

@router.get("/{investment_id}", response_model=InvestmentResponse)
def get_investment_by_id(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el detalle de una inversión específica (READ - Detail)."""
    investment = (
        db.query(Investment)
        .filter(Investment.id == investment_id, Investment.user_id == current_user.id)
        .first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return investment

@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: str,
    investment_in: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Editar y actualizar una compra/inversión existente con recálculo automático (UPDATE)."""
    investment = (
        db.query(Investment)
        .filter(Investment.id == investment_id, Investment.user_id == current_user.id)
        .first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")

    # Actualizar campos proporcionados
    if investment_in.product_name is not None:
        investment.product_name = investment_in.product_name
    if investment_in.amount_ves is not None:
        investment.amount_ves = investment_in.amount_ves
    if investment_in.bcv_rate is not None:
        investment.bcv_rate = investment_in.bcv_rate
    if investment_in.quantity is not None:
        investment.quantity = investment_in.quantity
    
    # Manejar actualización de envío (VES o USD)
    if investment_in.shipping_cost_ves is not None:
        effective_rate = investment.bcv_rate if investment.bcv_rate > 0 else 1.0
        investment.shipping_cost_usd = round(investment_in.shipping_cost_ves / effective_rate, 2)
    elif investment_in.shipping_cost_usd is not None:
        investment.shipping_cost_usd = investment_in.shipping_cost_usd

    if investment_in.notes is not None:
        investment.notes = investment_in.notes

    # Recalcular valores financieros
    investment.amount_usd = round(investment.amount_ves / investment.bcv_rate, 2)
    investment.total_cost_usd = round(investment.amount_usd + investment.shipping_cost_usd, 2)
    investment.unit_cost_usd = round(investment.total_cost_usd / investment.quantity, 4)
    investment.unit_cost_ves = round(investment.unit_cost_usd * investment.bcv_rate, 2)

    db.commit()
    db.refresh(investment)
    return investment

@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un registro de inversión (DELETE)."""
    investment = (
        db.query(Investment)
        .filter(Investment.id == investment_id, Investment.user_id == current_user.id)
        .first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")

    db.delete(investment)
    db.commit()
    return None
