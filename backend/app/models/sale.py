import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    investment_id = Column(String(36), ForeignKey("investments.id"), nullable=True, index=True)

    product_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="General", index=True)
    quantity = Column(Integer, nullable=False, default=1)
    
    # Costos base
    unit_cost_usd = Column(Float, nullable=False, default=0.0)      # Costo unitario real en USD
    
    # Precios y Tasa
    unit_price_usd = Column(Float, nullable=False)                  # Precio de venta por unidad en USD
    unit_price_ves = Column(Float, nullable=False)                  # Precio de venta por unidad en VES
    bcv_rate = Column(Float, nullable=False)                        # Tasa BCV aplicada en la venta
    
    # Totales de la operación
    total_income_usd = Column(Float, nullable=False)                # unit_price_usd * quantity
    total_income_ves = Column(Float, nullable=False)                # unit_price_ves * quantity
    total_cost_usd = Column(Float, nullable=False)                  # unit_cost_usd * quantity
    total_cost_ves = Column(Float, nullable=False)                  # total_cost_usd * bcv_rate
    
    # Ganancia & Rentabilidad
    net_profit_usd = Column(Float, nullable=False)                  # total_income_usd - total_cost_usd
    net_profit_ves = Column(Float, nullable=False)                  # total_income_ves - total_cost_ves
    profit_margin_percent = Column(Float, nullable=False)           # (net_profit_usd / total_cost_usd) * 100
    
    # Metadatos y Estado de Pago (Cuentas por Cobrar)
    payment_method = Column(String(100), nullable=False, default="Pago Móvil")
    payment_status = Column(String(50), nullable=False, default="paid", index=True)  # paid, partial, pending
    paid_amount_usd = Column(Float, nullable=False, default=0.0)
    paid_amount_ves = Column(Float, nullable=False, default=0.0)
    debt_amount_usd = Column(Float, nullable=False, default=0.0)
    debt_amount_ves = Column(Float, nullable=False, default=0.0)
    due_date = Column(DateTime, nullable=True)                      # Fecha límite de cobro para créditos

    customer_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="sales")
    investment = relationship("Investment", backref="sales")
    payments = relationship("SalePayment", back_populates="sale", cascade="all, delete-orphan", order_by="SalePayment.created_at.asc()")


class SalePayment(Base):
    __tablename__ = "sale_payments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    sale_id = Column(String(36), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_usd = Column(Float, nullable=False)
    amount_ves = Column(Float, nullable=False)
    bcv_rate = Column(Float, nullable=False)
    payment_method = Column(String(100), nullable=False, default="Pago Móvil")
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sale = relationship("Sale", back_populates="payments")
