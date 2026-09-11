import urllib.parse
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.db.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerSummaryItem,
    CustomersSummaryKPIs,
    CustomerListResponse,
)
from app.schemas.sale import SaleResponse
from app.api.deps import get_current_user
from app.services.bcv import get_current_bcv_rate

router = APIRouter()

@router.get("", response_model=CustomerListResponse)
def get_customers(
    status_filter: Optional[str] = "all",  # "all", "debtors", "up_to_date"
    filter_debt: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar directorio de clientes con métricas acumuladas de compras,
    cuentas por cobrar (deudas) y cálculo de KPIs.
    """
    eff_filter = filter_debt if filter_debt is not None else status_filter
    eff_filter = eff_filter or "all"

    query = db.query(Customer)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.name.ilike(term),
                Customer.phone.ilike(term),
                Customer.email.ilike(term)
            )
        )

    all_customers = query.order_by(Customer.name.asc()).all()

    items: List[CustomerSummaryItem] = []
    total_receivable_usd = 0.0
    total_receivable_ves = 0.0
    total_collected_usd = 0.0
    total_collected_ves = 0.0
    total_spent_overall = 0.0
    total_purchases_overall = 0
    debtors_count = 0
    up_to_date_count = 0

    for cust in all_customers:
        # Calcular agregados de ventas para este cliente
        sales = cust.sales or []
        sales_count = len(sales)
        total_spent_usd = sum(s.total_income_usd for s in sales)
        total_spent_ves = sum(s.total_income_ves for s in sales)
        total_paid_usd = sum(s.paid_amount_usd for s in sales)
        total_paid_ves = sum(s.paid_amount_ves for s in sales)
        total_debt_usd = sum(s.debt_amount_usd for s in sales)
        total_debt_ves = sum(s.debt_amount_ves for s in sales)

        has_debt = round(total_debt_usd, 2) > 0.0
        cust_status = "has_debt" if has_debt else "up_to_date"

        if has_debt:
            debtors_count += 1
            total_receivable_usd += total_debt_usd
            total_receivable_ves += total_debt_ves
        else:
            up_to_date_count += 1

        total_collected_usd += total_paid_usd
        total_collected_ves += total_paid_ves
        total_spent_overall += total_spent_usd
        total_purchases_overall += sales_count

        last_purchase_date = max((s.created_at for s in sales), default=None)

        item = CustomerSummaryItem(
            id=cust.id,
            name=cust.name,
            phone=cust.phone,
            email=cust.email,
            address=cust.address,
            notes=cust.notes,
            total_purchases_count=sales_count,
            total_spent_usd=round(total_spent_usd, 2),
            total_spent_ves=round(total_spent_ves, 2),
            total_debt_usd=round(total_debt_usd, 2),
            total_debt_ves=round(total_debt_ves, 2),
            total_paid_usd=round(total_paid_usd, 2),
            total_paid_ves=round(total_paid_ves, 2),
            payment_status=cust_status,
            has_debt=has_debt,
            last_purchase_date=last_purchase_date,
            last_sale_date=last_purchase_date,
            created_at=cust.created_at,
        )

        # Aplicar filtro de estado
        if eff_filter == "debtors" and not has_debt:
            continue
        if eff_filter == "up_to_date" and has_debt:
            continue

        items.append(item)

    # Ordenar deudores primero si no hay búsqueda
    if not search and eff_filter == "all":
        items.sort(key=lambda x: (x.total_debt_usd <= 0, -x.total_debt_usd, x.name.lower()))

    total_customers_count = len(all_customers)
    avg_ticket = round(total_spent_overall / total_purchases_overall, 2) if total_purchases_overall > 0 else 0.0
    collection_rate = (
        round((total_collected_usd / total_spent_overall) * 100, 1)
        if total_spent_overall > 0
        else 100.0
    )
    bcv_rate = get_current_bcv_rate(db, current_user.id)

    kpis = CustomersSummaryKPIs(
        total_customers=total_customers_count,
        debtors_count=debtors_count,
        up_to_date_count=up_to_date_count,
        total_receivable_usd=round(total_receivable_usd, 2),
        total_receivable_ves=round(total_receivable_ves, 2),
        total_collected_usd=round(total_collected_usd, 2),
        total_collected_ves=round(total_collected_ves, 2),
        collection_rate_percent=collection_rate,
        average_ticket_usd=avg_ticket,
        current_bcv_rate=round(bcv_rate, 2),
    )

    return CustomerListResponse(kpis=kpis, customers=items, items=items)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_detail(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de un cliente."""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return customer

@router.get("/{customer_id}/sales", response_model=List[SaleResponse])
def get_customer_sales(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las compras y abonos de un cliente específico."""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    sales = (
        db.query(Sale)
        .filter(Sale.customer_id == customer_id)
        .order_by(desc(Sale.created_at))
        .all()
    )
    return sales

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un cliente nuevo en el directorio."""
    # Verificar si ya existe con el mismo nombre para este usuario
    existing = db.query(Customer).filter(
        Customer.user_id == current_user.id,
        Customer.name.ilike(data.name.strip())
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya tienes un cliente registrado con el nombre '{data.name}'"
        )

    customer = Customer(
        user_id=current_user.id,
        name=data.name.strip(),
        phone=data.phone.strip() if data.phone else None,
        email=data.email.strip() if data.email else None,
        address=data.address.strip() if data.address else None,
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar datos de un cliente."""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if data.name is not None:
        customer.name = data.name.strip()
    if data.phone is not None:
        customer.phone = data.phone.strip() if data.phone else None
    if data.email is not None:
        customer.email = data.email.strip() if data.email else None
    if data.address is not None:
        customer.address = data.address.strip() if data.address else None
    if data.notes is not None:
        customer.notes = data.notes.strip() if data.notes else None

    customer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un cliente del directorio (sus ventas conservarán el nombre histórico)."""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Desvincular ventas asociadas antes de eliminar para mantener histórico
    db.query(Sale).filter(Sale.customer_id == customer_id).update({Sale.customer_id: None})
    db.delete(customer)
    db.commit()
    return None

@router.get("/{customer_id}/whatsapp-reminder")
def get_whatsapp_reminder(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Genera un mensaje cordial, respetuoso y profesional de recordatorio de cobro
    y un enlace directo a WhatsApp listo para enviar con 1 solo clic.
    """
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not (current_user.is_superuser or current_user.role == "superadmin"):
        query = query.filter(Customer.user_id == current_user.id)

    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    sales = customer.sales or []
    unpaid_sales = [s for s in sales if s.debt_amount_usd > 0]
    total_debt_usd = sum(s.debt_amount_usd for s in unpaid_sales)
    total_debt_ves = sum(s.debt_amount_ves for s in unpaid_sales)

    if total_debt_usd <= 0:
        return {
            "has_debt": False,
            "message": f"El cliente {customer.name} se encuentra al día. No tiene saldo pendiente.",
            "whatsapp_url": None,
        }

    business_name = current_user.business_name or "nuestro negocio"
    products_list = ", ".join(list({s.product_name for s in unpaid_sales})[:3])
    if len(unpaid_sales) > 3:
        products_list += " y otros productos"

    bcv_rate = get_current_bcv_rate(db, current_user.id)
    recalculated_ves = round(total_debt_usd * bcv_rate, 2)

    # Mensaje cordial y profesional
    text_message = (
        f"¡Hola {customer.name}! 👋 Te saludamos cordialmente de *{business_name}*.\n\n"
        f"Esperamos que estés disfrutando tu compra de *{products_list}*. 📦✨\n\n"
        f"Te escribimos para recordarte amablemente que mantienes un saldo pendiente de:\n"
        f"💵 *${total_debt_usd:.2f} USD*\n"
        f"🇻🇪 *Bs. {recalculated_ves:.2f}* (a tasa oficial BCV de Bs. {bcv_rate:.2f}).\n\n"
        f"Puedes realizar tu abono o liquidación mediante Pago Móvil, transferencia o efectivo. "
        f"Si ya realizaste el pago recientemente, por favor haznos llegar el comprobante por acá para actualizar tu estado en el sistema.\n\n"
        f"¡Muchísimas gracias por tu preferencia y confianza! 🙏"
    )

    clean_phone = ""
    if customer.phone:
        digits = "".join(filter(str.isdigit, customer.phone))
        # Si es formato venezolano local (0414/0424/0412...), agregar prefijo 58
        if digits.startswith("0") and len(digits) == 11:
            digits = "58" + digits[1:]
        elif digits.startswith("4") and len(digits) == 10:
            digits = "58" + digits
        clean_phone = digits

    whatsapp_url = None
    if clean_phone:
        encoded_text = urllib.parse.quote(text_message)
        whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    return {
        "has_debt": True,
        "customer_name": customer.name,
        "customer_phone": customer.phone,
        "clean_phone": clean_phone,
        "debt_amount_usd": round(total_debt_usd, 2),
        "debt_amount_ves": round(recalculated_ves, 2),
        "bcv_rate": bcv_rate,
        "message_text": text_message,
        "whatsapp_url": whatsapp_url,
    }
