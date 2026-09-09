from typing import List, Optional, Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.investment import Investment
from app.models.sale import Sale
from app.schemas.sale import (
    SaleCreate,
    SaleUpdate,
    SaleResponse,
    SaleSummary,
    SalesAnalyticsResponse,
    SalesAnalyticsSummary,
    TimelinePoint,
    PaymentMethodMetric,
    ProductProfitMetric,
    ProfitTiers,
)
from app.api.deps import get_current_user
from app.services.bcv import get_current_bcv_rate

router = APIRouter()

@router.get("/", response_model=List[SaleResponse])
def get_user_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las ventas registradas del usuario autenticado o todas si es SuperAdmin."""
    query = db.query(Sale)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    return query.order_by(Sale.created_at.desc()).all()

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar una nueva venta y calcular ganancias y márgenes."""
    if sale_in.bcv_rate <= 0:
        raise HTTPException(status_code=400, detail="La tasa BCV debe ser mayor a 0")
    if sale_in.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
    
    unit_cost_usd = sale_in.unit_cost_usd or 0.0

    # Vincular lote de inversión y descontar inventario automáticamente
    target_investment = None
    if sale_in.investment_id:
        target_investment = (
            db.query(Investment)
            .filter(Investment.id == sale_in.investment_id, Investment.user_id == current_user.id)
            .first()
        )
        if not target_investment:
            raise HTTPException(status_code=404, detail="Lote de inversión no encontrado")
    else:
        # Búsqueda automática inteligente por nombre de producto con stock disponible (FIFO)
        target_investment = (
            db.query(Investment)
            .filter(
                Investment.user_id == current_user.id,
                Investment.product_name.ilike(sale_in.product_name.strip()),
                Investment.quantity > 0,
            )
            .order_by(Investment.created_at.asc())
            .first()
        )

    if target_investment:
        if target_investment.quantity < sale_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente en el lote '{target_investment.product_name}'. Solo quedan {target_investment.quantity} unidades disponibles."
            )
        
        # Descontar del inventario de inversión
        target_investment.quantity -= sale_in.quantity
        sale_in.investment_id = target_investment.id

        # Asignar costo unitario de la inversión si no se suministró uno manual
        if unit_cost_usd == 0.0:
            unit_cost_usd = target_investment.unit_cost_usd

    # Validar precios en USD y VES
    if sale_in.unit_price_usd is not None and sale_in.unit_price_usd > 0:
        unit_price_usd = round(sale_in.unit_price_usd, 2)
        unit_price_ves = round(sale_in.unit_price_ves, 2) if sale_in.unit_price_ves else round(unit_price_usd * sale_in.bcv_rate, 2)
    elif sale_in.unit_price_ves is not None and sale_in.unit_price_ves > 0:
        unit_price_ves = round(sale_in.unit_price_ves, 2)
        unit_price_usd = round(unit_price_ves / sale_in.bcv_rate, 2)
    else:
        raise HTTPException(status_code=400, detail="Debes especificar un precio de venta en USD o en VES mayor a 0")

    # Cálculos financieros exactos
    total_income_usd = round(unit_price_usd * sale_in.quantity, 2)
    total_income_ves = round(unit_price_ves * sale_in.quantity, 2)
    total_cost_usd = round(unit_cost_usd * sale_in.quantity, 2)
    total_cost_ves = round(total_cost_usd * sale_in.bcv_rate, 2)
    net_profit_usd = round(total_income_usd - total_cost_usd, 2)
    net_profit_ves = round(total_income_ves - total_cost_ves, 2)
    
    if total_cost_usd > 0:
        profit_margin_percent = round((net_profit_usd / total_cost_usd) * 100, 2)
    else:
        profit_margin_percent = 100.0

    new_sale = Sale(
        user_id=current_user.id,
        investment_id=sale_in.investment_id,
        product_name=sale_in.product_name,
        quantity=sale_in.quantity,
        unit_cost_usd=unit_cost_usd,
        unit_price_usd=unit_price_usd,
        unit_price_ves=unit_price_ves,
        bcv_rate=sale_in.bcv_rate,
        total_income_usd=total_income_usd,
        total_income_ves=total_income_ves,
        total_cost_usd=total_cost_usd,
        total_cost_ves=total_cost_ves,
        net_profit_usd=net_profit_usd,
        net_profit_ves=net_profit_ves,
        profit_margin_percent=profit_margin_percent,
        payment_method=sale_in.payment_method or "Pago Móvil",
        customer_name=sale_in.customer_name,
        notes=sale_in.notes
    )

    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.get("/summary", response_model=SaleSummary)
def get_sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener métricas acumuladas de ventas y rentabilidad del usuario."""
    sales = (
        db.query(Sale)
        .filter(Sale.user_id == current_user.id)
        .all()
    )

    total_income_usd = sum(s.total_income_usd for s in sales)
    total_income_ves = sum(s.total_income_ves for s in sales)
    total_cost_usd = sum(s.total_cost_usd for s in sales)
    total_cost_ves = sum(s.total_cost_ves for s in sales)
    total_profit_usd = sum(s.net_profit_usd for s in sales)
    total_profit_ves = sum(s.net_profit_ves for s in sales)
    total_items_sold = sum(s.quantity for s in sales)
    
    if total_cost_usd > 0:
        average_margin_percent = round((total_profit_usd / total_cost_usd) * 100, 2)
    elif total_income_usd > 0:
        average_margin_percent = 100.0
    else:
        average_margin_percent = 0.0

    current_rate = get_current_bcv_rate(db, current_user.id)

    return SaleSummary(
        total_income_usd=round(total_income_usd, 2),
        total_income_ves=round(total_income_ves, 2),
        total_cost_usd=round(total_cost_usd, 2),
        total_cost_ves=round(total_cost_ves, 2),
        total_profit_usd=round(total_profit_usd, 2),
        total_profit_ves=round(total_profit_ves, 2),
        average_margin_percent=average_margin_percent,
        total_items_sold=total_items_sold,
        sales_count=len(sales),
        current_bcv_rate=current_rate
    )

@router.get("/analytics", response_model=SalesAnalyticsResponse)
def get_sales_analytics(
    preset: Optional[str] = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group_by: Optional[str] = "day",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generar analíticas financieras completas, series temporales para ApexCharts, márgenes y métricas por producto."""
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

    query = db.query(Sale)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    if start_dt:
        query = query.filter(Sale.created_at >= start_dt)
    if end_dt:
        query = query.filter(Sale.created_at <= end_dt)

    sales = query.order_by(Sale.created_at.asc()).all()

    # Totales generales
    total_revenue_usd = sum(s.total_income_usd for s in sales)
    total_revenue_ves = sum(s.total_income_ves for s in sales)
    total_cogs_usd = sum(s.total_cost_usd for s in sales)
    total_cogs_ves = sum(s.total_cost_ves for s in sales)
    net_profit_usd = sum(s.net_profit_usd for s in sales)
    net_profit_ves = sum(s.net_profit_ves for s in sales)
    total_items_sold = sum(s.quantity for s in sales)
    sales_count = len(sales)

    # Margen sobre Venta (Gross Profit Margin %)
    gross_margin_percent = round((net_profit_usd / total_revenue_usd * 100), 2) if total_revenue_usd > 0 else 0.0

    # Margen sobre Costo / Markup (Markup %)
    markup_margin_percent = round((net_profit_usd / total_cogs_usd * 100), 2) if total_cogs_usd > 0 else (100.0 if total_revenue_usd > 0 else 0.0)

    roi_percent = markup_margin_percent
    average_ticket_usd = round(total_revenue_usd / sales_count, 2) if sales_count > 0 else 0.0
    average_ticket_ves = round(total_revenue_ves / sales_count, 2) if sales_count > 0 else 0.0
    current_rate = get_current_bcv_rate(db, current_user.id)

    summary = SalesAnalyticsSummary(
        total_revenue_usd=round(total_revenue_usd, 2),
        total_revenue_ves=round(total_revenue_ves, 2),
        total_cogs_usd=round(total_cogs_usd, 2),
        total_cogs_ves=round(total_cogs_ves, 2),
        net_profit_usd=round(net_profit_usd, 2),
        net_profit_ves=round(net_profit_ves, 2),
        gross_margin_percent=gross_margin_percent,
        markup_margin_percent=markup_margin_percent,
        roi_percent=roi_percent,
        total_items_sold=total_items_sold,
        sales_count=sales_count,
        average_ticket_usd=average_ticket_usd,
        average_ticket_ves=average_ticket_ves,
        current_bcv_rate=current_rate
    )

    # Timeline (Agrupado por día, semana o mes)
    timeline_dict: Dict[str, Dict] = {}
    
    for s in sales:
        dt = s.created_at
        if group_by == "month":
            key = dt.strftime("%Y-%m")
            label = dt.strftime("%b %Y")
        elif group_by == "week":
            year, week, _ = dt.isocalendar()
            key = f"{year}-W{week:02d}"
            label = f"Sem {week}"
        else:
            key = dt.strftime("%Y-%m-%d")
            label = dt.strftime("%d/%m")

        if key not in timeline_dict:
            timeline_dict[key] = {
                "date": key,
                "label": label,
                "revenue_usd": 0.0,
                "revenue_ves": 0.0,
                "cost_usd": 0.0,
                "cost_ves": 0.0,
                "profit_usd": 0.0,
                "profit_ves": 0.0,
                "items_sold": 0,
                "transactions_count": 0,
            }
        
        t = timeline_dict[key]
        t["revenue_usd"] += s.total_income_usd
        t["revenue_ves"] += s.total_income_ves
        t["cost_usd"] += s.total_cost_usd
        t["cost_ves"] += s.total_cost_ves
        t["profit_usd"] += s.net_profit_usd
        t["profit_ves"] += s.net_profit_ves
        t["items_sold"] += s.quantity
        t["transactions_count"] += 1

    timeline: List[TimelinePoint] = []
    for key in sorted(timeline_dict.keys()):
        item = timeline_dict[key]
        c_usd = item["cost_usd"]
        p_usd = item["profit_usd"]
        margin = round((p_usd / c_usd * 100), 2) if c_usd > 0 else (100.0 if item["revenue_usd"] > 0 else 0.0)
        timeline.append(
            TimelinePoint(
                date=item["date"],
                label=item["label"],
                revenue_usd=round(item["revenue_usd"], 2),
                revenue_ves=round(item["revenue_ves"], 2),
                cost_usd=round(item["cost_usd"], 2),
                cost_ves=round(item["cost_ves"], 2),
                profit_usd=round(item["profit_usd"], 2),
                profit_ves=round(item["profit_ves"], 2),
                margin_percent=margin,
                items_sold=item["items_sold"],
                transactions_count=item["transactions_count"],
            )
        )

    # Por método de pago
    pm_dict: Dict[str, Dict] = {}
    for s in sales:
        pm = s.payment_method or "Otro"
        if pm not in pm_dict:
            pm_dict[pm] = {
                "revenue_usd": 0.0,
                "revenue_ves": 0.0,
                "profit_usd": 0.0,
                "profit_ves": 0.0,
                "sales_count": 0,
            }
        pm_dict[pm]["revenue_usd"] += s.total_income_usd
        pm_dict[pm]["revenue_ves"] += s.total_income_ves
        pm_dict[pm]["profit_usd"] += s.net_profit_usd
        pm_dict[pm]["profit_ves"] += s.net_profit_ves
        pm_dict[pm]["sales_count"] += 1

    by_payment_method: List[PaymentMethodMetric] = []
    for method, val in pm_dict.items():
        share = round((val["revenue_usd"] / total_revenue_usd * 100), 2) if total_revenue_usd > 0 else 0.0
        by_payment_method.append(
            PaymentMethodMetric(
                method=method,
                revenue_usd=round(val["revenue_usd"], 2),
                revenue_ves=round(val["revenue_ves"], 2),
                profit_usd=round(val["profit_usd"], 2),
                profit_ves=round(val["profit_ves"], 2),
                sales_count=val["sales_count"],
                share_percent=share
            )
        )
    by_payment_method.sort(key=lambda x: x.revenue_usd, reverse=True)

    # Top productos
    prod_dict: Dict[str, Dict] = {}
    for s in sales:
        pname = s.product_name
        if pname not in prod_dict:
            prod_dict[pname] = {
                "units_sold": 0,
                "revenue_usd": 0.0,
                "revenue_ves": 0.0,
                "cost_usd": 0.0,
                "cost_ves": 0.0,
                "profit_usd": 0.0,
                "profit_ves": 0.0,
            }
        prod_dict[pname]["units_sold"] += s.quantity
        prod_dict[pname]["revenue_usd"] += s.total_income_usd
        prod_dict[pname]["revenue_ves"] += s.total_income_ves
        prod_dict[pname]["cost_usd"] += s.total_cost_usd
        prod_dict[pname]["cost_ves"] += s.total_cost_ves
        prod_dict[pname]["profit_usd"] += s.net_profit_usd
        prod_dict[pname]["profit_ves"] += s.net_profit_ves

    top_products: List[ProductProfitMetric] = []
    for pname, pval in prod_dict.items():
        cost = pval["cost_usd"]
        prof = pval["profit_usd"]
        margin = round((prof / cost * 100), 2) if cost > 0 else (100.0 if pval["revenue_usd"] > 0 else 0.0)
        share = round((prof / net_profit_usd * 100), 2) if net_profit_usd > 0 else 0.0
        top_products.append(
            ProductProfitMetric(
                product_name=pname,
                units_sold=pval["units_sold"],
                revenue_usd=round(pval["revenue_usd"], 2),
                revenue_ves=round(pval["revenue_ves"], 2),
                cost_usd=round(pval["cost_usd"], 2),
                cost_ves=round(pval["cost_ves"], 2),
                profit_usd=round(prof, 2),
                profit_ves=round(pval["profit_ves"], 2),
                margin_percent=margin,
                profit_share_percent=share
            )
        )
    top_products.sort(key=lambda x: x.profit_usd, reverse=True)

    # Niveles de margen
    high_count = sum(1 for s in sales if s.profit_margin_percent >= 50.0)
    med_count = sum(1 for s in sales if 20.0 <= s.profit_margin_percent < 50.0)
    low_count = sum(1 for s in sales if s.profit_margin_percent < 20.0)

    profit_tiers = ProfitTiers(
        high_margin_count=high_count,
        medium_margin_count=med_count,
        low_margin_count=low_count
    )

    return SalesAnalyticsResponse(
        summary=summary,
        timeline=timeline,
        by_payment_method=by_payment_method,
        top_products=top_products,
        profit_tiers=profit_tiers,
        filter_preset=preset,
        start_date=start_dt.strftime("%Y-%m-%d") if start_dt else None,
        end_date=end_dt.strftime("%Y-%m-%d") if end_dt else None
    )

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale_by_id(
    sale_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el detalle de una venta específica."""
    query = db.query(Sale).filter(Sale.id == sale_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale

@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: str,
    sale_in: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Editar y actualizar un registro de venta existente con recálculo automático."""
    query = db.query(Sale).filter(Sale.id == sale_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Sincronización de inventario si cambia la cantidad o el lote
    old_inv_id = sale.investment_id
    old_quantity = sale.quantity
    new_inv_id = sale_in.investment_id if sale_in.investment_id is not None else old_inv_id
    new_quantity = sale_in.quantity if sale_in.quantity is not None else old_quantity

    if old_inv_id == new_inv_id:
        if old_inv_id and new_quantity != old_quantity:
            inv = db.query(Investment).filter(Investment.id == old_inv_id, Investment.user_id == current_user.id).first()
            if inv:
                qty_diff = new_quantity - old_quantity
                if qty_diff > 0 and inv.quantity < qty_diff:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock insuficiente en '{inv.product_name}'. Solo quedan {inv.quantity} unidades adicionales en inventario."
                    )
                inv.quantity -= qty_diff
    else:
        # Cambió de lote de inversión
        if old_inv_id:
            old_inv = db.query(Investment).filter(Investment.id == old_inv_id, Investment.user_id == current_user.id).first()
            if old_inv:
                old_inv.quantity += old_quantity
        if new_inv_id:
            new_inv = db.query(Investment).filter(Investment.id == new_inv_id, Investment.user_id == current_user.id).first()
            if not new_inv:
                raise HTTPException(status_code=404, detail="Nuevo lote de inversión no encontrado")
            if new_inv.quantity < new_quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente en el nuevo lote '{new_inv.product_name}'. Disponibles: {new_inv.quantity} unidades."
                )
            new_inv.quantity -= new_quantity

    if sale_in.product_name is not None:
        sale.product_name = sale_in.product_name
    if sale_in.investment_id is not None:
        sale.investment_id = sale_in.investment_id
    if sale_in.quantity is not None:
        sale.quantity = sale_in.quantity
    if sale_in.bcv_rate is not None:
        sale.bcv_rate = sale_in.bcv_rate
    if sale_in.unit_cost_usd is not None:
        sale.unit_cost_usd = sale_in.unit_cost_usd
    if sale_in.payment_method is not None:
        sale.payment_method = sale_in.payment_method
    if sale_in.customer_name is not None:
        sale.customer_name = sale_in.customer_name
    if sale_in.notes is not None:
        sale.notes = sale_in.notes

    # Precios
    if sale_in.unit_price_usd is not None:
        sale.unit_price_usd = round(sale_in.unit_price_usd, 2)
        sale.unit_price_ves = round(sale.unit_price_usd * sale.bcv_rate, 2)
    elif sale_in.unit_price_ves is not None:
        sale.unit_price_ves = round(sale_in.unit_price_ves, 2)
        sale.unit_price_usd = round(sale.unit_price_ves / sale.bcv_rate, 2)

    # Recalcular totales
    sale.total_income_usd = round(sale.unit_price_usd * sale.quantity, 2)
    sale.total_income_ves = round(sale.unit_price_ves * sale.quantity, 2)
    sale.total_cost_usd = round(sale.unit_cost_usd * sale.quantity, 2)
    sale.total_cost_ves = round(sale.total_cost_usd * sale.bcv_rate, 2)
    sale.net_profit_usd = round(sale.total_income_usd - sale.total_cost_usd, 2)
    sale.net_profit_ves = round(sale.total_income_ves - sale.total_cost_ves, 2)

    if sale.total_cost_usd > 0:
        sale.profit_margin_percent = round((sale.net_profit_usd / sale.total_cost_usd) * 100, 2)
    else:
        sale.profit_margin_percent = 100.0

    db.commit()
    db.refresh(sale)
    return sale

@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(
    sale_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un registro de venta y restituir el stock al inventario de inversión."""
    query = db.query(Sale).filter(Sale.id == sale_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Restituir stock al lote de inversión
    if sale.investment_id:
        inv = db.query(Investment).filter(Investment.id == sale.investment_id).first()
        if inv:
            inv.quantity += sale.quantity

    db.delete(sale)
    db.commit()
    return None
