from typing import List, Optional, Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.investment import Investment
from app.models.sale import Sale, SalePayment
from app.models.customer import Customer
from app.schemas.sale import (
    SaleCreate,
    SaleUpdate,
    SaleResponse,
    SaleSummary,
    SalePaymentCreate,
    SalePaymentResponse,
    SalesAnalyticsResponse,
    SalesAnalyticsSummary,
    TimelinePoint,
    PaymentMethodMetric,
    ProductProfitMetric,
    CategoryProfitMetric,
    CashVsCreditProfit,
    ProfitTiers,
)
from app.api.deps import get_current_user
from app.services.bcv import get_current_bcv_rate

router = APIRouter()

@router.get("/", response_model=List[SaleResponse])
def get_user_sales(
    category: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las ventas registradas del usuario autenticado con filtros opcionales."""
    query = db.query(Sale)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    if category and category.strip() and category.strip().lower() != "todas":
        query = query.filter(Sale.category.ilike(category.strip()))
    if payment_status and payment_status.strip() and payment_status.strip().lower() != "all":
        query = query.filter(Sale.payment_status == payment_status.strip().lower())
    return query.order_by(Sale.created_at.desc()).all()

@router.get("/categories", response_model=List[str])
def get_sales_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener la lista única de categorías de ventas registradas por el usuario."""
    query = db.query(Sale.category).filter(Sale.user_id == current_user.id).distinct()
    categories = [c[0] for c in query.all() if c[0]]
    if not categories:
        categories = ["General"]
    return sorted(list(set(categories)))

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

    # Determinar categoría (heredada de la inversión o personalizada)
    category = sale_in.category.strip() if (sale_in.category and sale_in.category.strip()) else None
    if not category:
        if target_investment and target_investment.category:
            category = target_investment.category
        else:
            category = "General"

    # Determinar estado de pago y saldo deudor
    payment_status = (sale_in.payment_status or "paid").lower()
    if payment_status not in ["paid", "partial", "pending"]:
        payment_status = "paid"

    if payment_status == "paid":
        paid_amount_usd = total_income_usd
        paid_amount_ves = total_income_ves
        debt_amount_usd = 0.0
        debt_amount_ves = 0.0
    elif payment_status == "pending":
        paid_amount_usd = 0.0
        paid_amount_ves = 0.0
        debt_amount_usd = total_income_usd
        debt_amount_ves = total_income_ves
    elif payment_status == "partial":
        if sale_in.initial_payment_usd is not None and sale_in.initial_payment_usd > 0:
            paid_amount_usd = round(min(total_income_usd, sale_in.initial_payment_usd), 2)
            paid_amount_ves = round(paid_amount_usd * sale_in.bcv_rate, 2)
        elif sale_in.initial_payment_ves is not None and sale_in.initial_payment_ves > 0:
            paid_amount_ves = round(min(total_income_ves, sale_in.initial_payment_ves), 2)
            paid_amount_usd = round(paid_amount_ves / sale_in.bcv_rate, 2)
        else:
            paid_amount_usd = 0.0
            paid_amount_ves = 0.0
        
        debt_amount_usd = round(max(0.0, total_income_usd - paid_amount_usd), 2)
        debt_amount_ves = round(max(0.0, total_income_ves - paid_amount_ves), 2)

        if debt_amount_usd <= 0.01:
            payment_status = "paid"
            debt_amount_usd = 0.0
            debt_amount_ves = 0.0

    # Vincular o registrar cliente automáticamente
    customer_id = sale_in.customer_id
    customer_name = sale_in.customer_name.strip() if sale_in.customer_name else None
    customer_phone = sale_in.customer_phone.strip() if sale_in.customer_phone else None

    if customer_id:
        cust = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == current_user.id).first()
        if cust:
            customer_name = cust.name
            if customer_phone and not cust.phone:
                cust.phone = customer_phone
            customer_phone = customer_phone or cust.phone
    elif customer_name:
        existing_cust = db.query(Customer).filter(
            Customer.user_id == current_user.id,
            Customer.name.ilike(customer_name)
        ).first()
        if existing_cust:
            customer_id = existing_cust.id
            customer_name = existing_cust.name
            if customer_phone and not existing_cust.phone:
                existing_cust.phone = customer_phone
            customer_phone = customer_phone or existing_cust.phone
        else:
            new_cust = Customer(
                user_id=current_user.id,
                name=customer_name,
                phone=customer_phone,
            )
            db.add(new_cust)
            db.flush()
            customer_id = new_cust.id

    new_sale = Sale(
        user_id=current_user.id,
        investment_id=sale_in.investment_id,
        customer_id=customer_id,
        product_name=sale_in.product_name,
        category=category,
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
        payment_status=payment_status,
        paid_amount_usd=paid_amount_usd,
        paid_amount_ves=paid_amount_ves,
        debt_amount_usd=debt_amount_usd,
        debt_amount_ves=debt_amount_ves,
        due_date=sale_in.due_date,
        customer_name=customer_name,
        customer_phone=customer_phone,
        notes=sale_in.notes
    )

    db.add(new_sale)
    db.flush()

    # Si hubo desembolso inicial, registrar comprobante de abono / pago
    if paid_amount_usd > 0:
        initial_payment = SalePayment(
            sale_id=new_sale.id,
            amount_usd=paid_amount_usd,
            amount_ves=paid_amount_ves,
            bcv_rate=sale_in.bcv_rate,
            payment_method=sale_in.payment_method or "Pago Móvil",
            notes="Pago al contado" if payment_status == "paid" else "Abono inicial",
        )
        db.add(initial_payment)

    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.get("/summary", response_model=SaleSummary)
def get_sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener métricas acumuladas de ventas, rentabilidad y cuentas por cobrar del usuario."""
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
    
    total_debt_usd = sum(s.debt_amount_usd for s in sales)
    total_debt_ves = sum(s.debt_amount_ves for s in sales)
    pending_sales_count = sum(1 for s in sales if s.debt_amount_usd > 0.01)
    paid_sales_count = sum(1 for s in sales if s.debt_amount_usd <= 0.01)

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
        current_bcv_rate=current_rate,
        total_debt_usd=round(total_debt_usd, 2),
        total_debt_ves=round(total_debt_ves, 2),
        pending_sales_count=pending_sales_count,
        paid_sales_count=paid_sales_count,
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

    # Rentabilidad por Categoría
    cat_dict: Dict[str, Dict] = {}
    for s in sales:
        cat_name = (s.category or "General").strip() or "General"
        if cat_name not in cat_dict:
            cat_dict[cat_name] = {
                "revenue_usd": 0.0,
                "revenue_ves": 0.0,
                "cost_usd": 0.0,
                "cost_ves": 0.0,
                "profit_usd": 0.0,
                "profit_ves": 0.0,
                "items_sold": 0,
                "sales_count": 0,
            }
        c = cat_dict[cat_name]
        c["revenue_usd"] += s.total_income_usd
        c["revenue_ves"] += s.total_income_ves
        c["cost_usd"] += s.total_cost_usd
        c["cost_ves"] += s.total_cost_ves
        c["profit_usd"] += s.net_profit_usd
        c["profit_ves"] += s.net_profit_ves
        c["items_sold"] += s.quantity
        c["sales_count"] += 1

    by_category: List[CategoryProfitMetric] = []
    for cat_name, cval in cat_dict.items():
        c_cost = cval["cost_usd"]
        c_prof = cval["profit_usd"]
        c_rev = cval["revenue_usd"]
        c_margin = round((c_prof / c_cost * 100), 2) if c_cost > 0 else (100.0 if c_rev > 0 else 0.0)
        c_share = round((c_rev / total_revenue_usd * 100), 2) if total_revenue_usd > 0 else 0.0
        by_category.append(
            CategoryProfitMetric(
                category=cat_name,
                revenue_usd=round(c_rev, 2),
                revenue_ves=round(cval["revenue_ves"], 2),
                cost_usd=round(c_cost, 2),
                cost_ves=round(cval["cost_ves"], 2),
                profit_usd=round(c_prof, 2),
                profit_ves=round(cval["profit_ves"], 2),
                margin_percent=c_margin,
                items_sold=cval["items_sold"],
                sales_count=cval["sales_count"],
                share_percent=c_share
            )
        )
    by_category.sort(key=lambda x: x.profit_usd, reverse=True)

    # Comparativa Contado vs Crédito (Ganancias Realizadas vs por Cobrar)
    paid_sales_count = sum(1 for s in sales if s.payment_status == "paid")
    pending_sales_count = sum(1 for s in sales if s.payment_status == "pending")
    partial_sales_count = sum(1 for s in sales if s.payment_status == "partial")
    total_paid_usd = sum(s.paid_amount_usd for s in sales)
    total_debt_usd = sum(s.debt_amount_usd for s in sales)

    realized_profit_usd = 0.0
    for s in sales:
        if s.total_income_usd > 0:
            ratio = min(1.0, max(0.0, s.paid_amount_usd / s.total_income_usd))
            realized_profit_usd += (s.net_profit_usd * ratio)
        else:
            realized_profit_usd += s.net_profit_usd
    realized_profit_usd = round(realized_profit_usd, 2)
    pending_profit_usd = round(net_profit_usd - realized_profit_usd, 2)
    collection_rate = round((total_paid_usd / total_revenue_usd * 100), 2) if total_revenue_usd > 0 else 100.0

    cash_vs_credit = CashVsCreditProfit(
        total_sales_count=sales_count,
        paid_sales_count=paid_sales_count,
        pending_sales_count=pending_sales_count,
        partial_sales_count=partial_sales_count,
        total_revenue_usd=round(total_revenue_usd, 2),
        total_paid_usd=round(total_paid_usd, 2),
        total_debt_usd=round(total_debt_usd, 2),
        realized_profit_usd=realized_profit_usd,
        pending_profit_usd=pending_profit_usd,
        collection_rate_percent=collection_rate
    )

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
        by_category=by_category,
        cash_vs_credit=cash_vs_credit,
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
    if sale_in.category is not None and sale_in.category.strip():
        sale.category = sale_in.category.strip()
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
    if sale_in.customer_id is not None:
        sale.customer_id = sale_in.customer_id
        cust = db.query(Customer).filter(Customer.id == sale_in.customer_id, Customer.user_id == current_user.id).first()
        if cust:
            sale.customer_name = cust.name
            if not sale.customer_phone and cust.phone:
                sale.customer_phone = cust.phone
    if sale_in.customer_name is not None:
        sale.customer_name = sale_in.customer_name.strip() if sale_in.customer_name else None
    if sale_in.customer_phone is not None:
        sale.customer_phone = sale_in.customer_phone.strip() if sale_in.customer_phone else None
        if sale.customer_id:
            cust = db.query(Customer).filter(Customer.id == sale.customer_id, Customer.user_id == current_user.id).first()
            if cust and not cust.phone and sale.customer_phone:
                cust.phone = sale.customer_phone
    if sale_in.notes is not None:
        sale.notes = sale_in.notes
    if sale_in.due_date is not None:
        sale.due_date = sale_in.due_date

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

    # Estado de pago
    if sale_in.payment_status is not None:
        new_status = sale_in.payment_status.lower()
        if new_status == "paid":
            sale.payment_status = "paid"
            sale.paid_amount_usd = sale.total_income_usd
            sale.paid_amount_ves = sale.total_income_ves
            sale.debt_amount_usd = 0.0
            sale.debt_amount_ves = 0.0
        elif new_status == "pending":
            sale.payment_status = "pending"
            sale.paid_amount_usd = 0.0
            sale.paid_amount_ves = 0.0
            sale.debt_amount_usd = sale.total_income_usd
            sale.debt_amount_ves = sale.total_income_ves
        elif new_status == "partial":
            sale.payment_status = "partial"
    
    # Recalcular saldo deudor si cambiaron los totales
    if sale.payment_status != "paid":
        sale.debt_amount_usd = round(max(0.0, sale.total_income_usd - sale.paid_amount_usd), 2)
        sale.debt_amount_ves = round(max(0.0, sale.total_income_ves - sale.paid_amount_ves), 2)
        if sale.debt_amount_usd <= 0.01:
            sale.payment_status = "paid"
            sale.debt_amount_usd = 0.0
            sale.debt_amount_ves = 0.0

    db.commit()
    db.refresh(sale)
    return sale

@router.post("/{sale_id}/payments", response_model=SaleResponse)
def add_sale_payment(
    sale_id: str,
    payment_in: SalePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar un abono o cuota de pago a una venta con saldo pendiente."""
    query = db.query(Sale).filter(Sale.id == sale_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Sale.user_id == current_user.id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if sale.debt_amount_usd <= 0.01:
        raise HTTPException(status_code=400, detail="Esta venta ya se encuentra totalmente pagada.")

    # Calcular monto del abono en USD y VES
    if payment_in.amount_usd is not None and payment_in.amount_usd > 0:
        abono_usd = round(payment_in.amount_usd, 2)
        abono_ves = round(abono_usd * sale.bcv_rate, 2)
    elif payment_in.amount_ves is not None and payment_in.amount_ves > 0:
        abono_ves = round(payment_in.amount_ves, 2)
        abono_usd = round(abono_ves / sale.bcv_rate, 2)
    else:
        raise HTTPException(status_code=400, detail="Debes especificar un monto a abonar mayor a 0.")

    if abono_usd > round(sale.debt_amount_usd + 0.05, 2):
        raise HTTPException(
            status_code=400,
            detail=f"El abono (${abono_usd}) no puede superar la deuda pendiente (${sale.debt_amount_usd})."
        )

    abono_usd = min(abono_usd, sale.debt_amount_usd)
    abono_ves = round(abono_usd * sale.bcv_rate, 2)

    new_payment = SalePayment(
        sale_id=sale.id,
        amount_usd=abono_usd,
        amount_ves=abono_ves,
        bcv_rate=sale.bcv_rate,
        payment_method=payment_in.payment_method or "Pago Móvil",
        notes=payment_in.notes
    )
    db.add(new_payment)

    sale.paid_amount_usd = round(sale.paid_amount_usd + abono_usd, 2)
    sale.paid_amount_ves = round(sale.paid_amount_ves + abono_ves, 2)
    sale.debt_amount_usd = round(max(0.0, sale.total_income_usd - sale.paid_amount_usd), 2)
    sale.debt_amount_ves = round(max(0.0, sale.total_income_ves - sale.paid_amount_ves), 2)

    if sale.debt_amount_usd <= 0.01:
        sale.payment_status = "paid"
        sale.debt_amount_usd = 0.0
        sale.debt_amount_ves = 0.0
    else:
        sale.payment_status = "partial"

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
