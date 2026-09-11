from typing import List, Optional
from datetime import datetime, timedelta
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
    InvestmentReorderRequest,
)
from app.api.deps import get_current_user
from app.services.bcv import get_current_bcv_rate

router = APIRouter()

@router.get("/categories", response_model=List[str])
def get_user_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar categorías únicas de inversión del usuario para sugerencias de autocompletado y filtros."""
    query = db.query(Investment.category).filter(Investment.category.isnot(None))
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    
    results = query.distinct().order_by(Investment.category.asc()).all()
    categories = [r[0].strip() for r in results if r[0] and r[0].strip()]
    if "General" not in categories:
        categories.insert(0, "General")
    return categories

@router.get("/", response_model=List[InvestmentResponse])
def get_user_investments(
    category: Optional[str] = None,
    stock_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las inversiones registradas del usuario autenticado con filtros de categoría y estado de stock."""
    query = db.query(Investment)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    if category and category.strip() and category != "Todas":
        query = query.filter(Investment.category == category.strip())
    
    investments = query.order_by(Investment.created_at.desc()).all()
    enriched = []
    for inv in investments:
        min_stock = inv.min_stock_alert if (inv.min_stock_alert is not None) else 3
        if inv.quantity == 0:
            status_val = "out_of_stock"
        elif inv.quantity <= min_stock:
            status_val = "low_stock"
        else:
            status_val = "in_stock"
        inv.stock_status = status_val
        
        if stock_status and stock_status.strip().lower() not in ["all", "todos", ""]:
            if inv.stock_status != stock_status.strip().lower():
                continue
        enriched.append(inv)
        
    return enriched

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

    cat_clean = (investment_in.category or "General").strip() or "General"
    min_stock_alert = investment_in.min_stock_alert if investment_in.min_stock_alert is not None else 3

    new_investment = Investment(
        user_id=current_user.id,
        product_name=investment_in.product_name.strip(),
        barcode=investment_in.barcode.strip() if investment_in.barcode else None,
        category=cat_clean,
        amount_ves=investment_in.amount_ves,
        bcv_rate=investment_in.bcv_rate,
        amount_usd=amount_usd,
        quantity=investment_in.quantity,
        initial_quantity=investment_in.quantity,
        min_stock_alert=min_stock_alert,
        shipping_cost_usd=shipping_cost_usd,
        total_cost_usd=total_cost_usd,
        unit_cost_usd=unit_cost_usd,
        unit_cost_ves=unit_cost_ves,
        notes=investment_in.notes
    )

    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    new_investment.stock_status = "low_stock" if new_investment.quantity <= min_stock_alert else "in_stock"
    return new_investment

@router.get("/summary", response_model=InvestmentSummary)
def get_investment_summary(
    preset: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener métricas acumuladas de inversión para el usuario con soporte de filtros de fechas y alertas de stock."""
    now = datetime.now()
    start_dt = None
    end_dt = None

    if preset == "today":
        start_dt = datetime(now.year, now.month, now.day, 0, 0, 0)
        end_dt = datetime(now.year, now.month, now.day, 23, 59, 59)
    elif preset == "7d":
        start_dt = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = datetime(now.year, now.month, now.day, 23, 59, 59)
    elif preset == "30d":
        start_dt = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = datetime(now.year, now.month, now.day, 23, 59, 59)
    elif preset == "this_month":
        start_dt = datetime(now.year, now.month, 1, 0, 0, 0)
        next_month = now.month + 1 if now.month < 12 else 1
        next_year = now.year if now.month < 12 else now.year + 1
        end_dt = datetime(next_year, next_month, 1, 0, 0, 0) - timedelta(seconds=1)
    elif preset == "last_month":
        first_of_this_month = datetime(now.year, now.month, 1, 0, 0, 0)
        end_dt = first_of_this_month - timedelta(seconds=1)
        start_dt = datetime(end_dt.year, end_dt.month, 1, 0, 0, 0)
    elif preset == "this_year":
        start_dt = datetime(now.year, 1, 1, 0, 0, 0)
        end_dt = datetime(now.year, 12, 31, 23, 59, 59)
    elif preset == "all":
        start_dt = None
        end_dt = None
    elif preset == "custom" or (start_date or end_date):
        if start_date:
            try:
                p_start = datetime.strptime(start_date.split("T")[0], "%Y-%m-%d")
                start_dt = datetime(p_start.year, p_start.month, p_start.day, 0, 0, 0)
            except Exception:
                pass
        if end_date:
            try:
                p_end = datetime.strptime(end_date.split("T")[0], "%Y-%m-%d")
                end_dt = datetime(p_end.year, p_end.month, p_end.day, 23, 59, 59)
            except Exception:
                pass

    query = db.query(Investment)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    if start_dt:
        query = query.filter(Investment.created_at >= start_dt)
    if end_dt:
        query = query.filter(Investment.created_at <= end_dt)

    investments = query.all()

    total_usd = sum(inv.total_cost_usd for inv in investments)
    total_ves = sum(inv.amount_ves + (inv.shipping_cost_usd * inv.bcv_rate) for inv in investments)
    total_items = sum(inv.quantity for inv in investments)
    total_initial_items = sum(getattr(inv, "initial_quantity", inv.quantity) or inv.quantity for inv in investments)
    total_sold_items = max(0, total_initial_items - total_items)
    total_shipping_usd = sum(inv.shipping_cost_usd for inv in investments)
    total_shipping_ves = sum(inv.shipping_cost_ves for inv in investments)
    current_rate = get_current_bcv_rate(db, current_user.id)

    low_stock_count = sum(1 for inv in investments if 0 < inv.quantity <= (inv.min_stock_alert if inv.min_stock_alert is not None else 3))
    out_of_stock_count = sum(1 for inv in investments if inv.quantity == 0)

    return InvestmentSummary(
        total_invested_usd=round(total_usd, 2),
        total_invested_ves=round(total_ves, 2),
        total_items_count=total_items,
        total_initial_items=total_initial_items,
        total_sold_items=total_sold_items,
        total_shipping_usd=round(total_shipping_usd, 2),
        total_shipping_ves=round(total_shipping_ves, 2),
        investments_count=len(investments),
        current_bcv_rate=current_rate,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
    )

@router.get("/{investment_id}", response_model=InvestmentResponse)
def get_investment_by_id(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el detalle de una inversión específica (READ - Detail)."""
    query = db.query(Investment).filter(Investment.id == investment_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    investment = query.first()
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    
    min_stock = investment.min_stock_alert if (investment.min_stock_alert is not None) else 3
    if investment.quantity == 0:
        investment.stock_status = "out_of_stock"
    elif investment.quantity <= min_stock:
        investment.stock_status = "low_stock"
    else:
        investment.stock_status = "in_stock"
    return investment

@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: str,
    investment_in: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Editar y actualizar una compra/inversión existente con recálculo automático (UPDATE)."""
    query = db.query(Investment).filter(Investment.id == investment_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    investment = query.first()
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")

    # Actualizar campos proporcionados
    if investment_in.product_name is not None:
        investment.product_name = investment_in.product_name.strip()
    if investment_in.barcode is not None:
        investment.barcode = investment_in.barcode.strip() if investment_in.barcode.strip() else None
    if investment_in.category is not None:
        cat_clean = investment_in.category.strip()
        investment.category = cat_clean if cat_clean else "General"
    if investment_in.amount_ves is not None:
        investment.amount_ves = investment_in.amount_ves
    if investment_in.bcv_rate is not None:
        investment.bcv_rate = investment_in.bcv_rate
    if investment_in.quantity is not None:
        sold_count = max(0, (investment.initial_quantity or investment.quantity) - investment.quantity)
        investment.initial_quantity = investment_in.quantity
        investment.quantity = max(0, investment_in.quantity - sold_count)
    if investment_in.min_stock_alert is not None:
        investment.min_stock_alert = investment_in.min_stock_alert
    
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
    base_qty = investment.initial_quantity if investment.initial_quantity and investment.initial_quantity > 0 else investment.quantity
    investment.unit_cost_usd = round(investment.total_cost_usd / base_qty, 4) if base_qty > 0 else 0.0
    investment.unit_cost_ves = round(investment.unit_cost_usd * investment.bcv_rate, 2)

    db.commit()
    db.refresh(investment)
    min_stock = investment.min_stock_alert if (investment.min_stock_alert is not None) else 3
    if investment.quantity == 0:
        investment.stock_status = "out_of_stock"
    elif investment.quantity <= min_stock:
        investment.stock_status = "low_stock"
    else:
        investment.stock_status = "in_stock"
    return investment

@router.post("/{investment_id}/reorder", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def reorder_investment(
    investment_id: str,
    reorder_in: InvestmentReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reabastecer o crear un nuevo lote para un producto existente preservando categoría y configuración de alerta."""
    query = db.query(Investment).filter(Investment.id == investment_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    original = query.first()
    if not original:
        raise HTTPException(status_code=404, detail="Lote de inversión original no encontrado")

    rate = reorder_in.bcv_rate or get_current_bcv_rate(db, current_user.id)
    if rate <= 0:
        rate = original.bcv_rate or 36.0

    if reorder_in.amount_ves and reorder_in.amount_ves > 0:
        amount_ves = round(reorder_in.amount_ves, 2)
        amount_usd = round(amount_ves / rate, 2)
    elif reorder_in.amount_usd and reorder_in.amount_usd > 0:
        amount_usd = round(reorder_in.amount_usd, 2)
        amount_ves = round(amount_usd * rate, 2)
    else:
        amount_usd = round(original.unit_cost_usd * reorder_in.quantity, 2)
        amount_ves = round(amount_usd * rate, 2)

    if reorder_in.shipping_cost_ves is not None and reorder_in.shipping_cost_ves > 0:
        shipping_cost_usd = round(reorder_in.shipping_cost_ves / rate, 2)
    elif reorder_in.shipping_cost_usd is not None and reorder_in.shipping_cost_usd > 0:
        shipping_cost_usd = round(reorder_in.shipping_cost_usd, 2)
    else:
        shipping_cost_usd = 0.0

    total_cost_usd = round(amount_usd + shipping_cost_usd, 2)
    unit_cost_usd = round(total_cost_usd / reorder_in.quantity, 4)
    unit_cost_ves = round(unit_cost_usd * rate, 2)

    min_stock = reorder_in.min_stock_alert if reorder_in.min_stock_alert is not None else (original.min_stock_alert or 3)

    new_investment = Investment(
        user_id=current_user.id,
        product_name=original.product_name,
        category=original.category,
        amount_ves=amount_ves,
        bcv_rate=rate,
        amount_usd=amount_usd,
        quantity=reorder_in.quantity,
        initial_quantity=reorder_in.quantity,
        min_stock_alert=min_stock,
        shipping_cost_usd=shipping_cost_usd,
        total_cost_usd=total_cost_usd,
        unit_cost_usd=unit_cost_usd,
        unit_cost_ves=unit_cost_ves,
        notes=reorder_in.notes or f"Reabastecimiento de lote anterior ({original.id[:8]})"
    )

    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    new_investment.stock_status = "in_stock"
    return new_investment

@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un registro de inversión (DELETE)."""
    query = db.query(Investment).filter(Investment.id == investment_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Investment.user_id == current_user.id)
    investment = query.first()
    if not investment:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")

    db.delete(investment)
    db.commit()
    return None
