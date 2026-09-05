import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Investment(Base):
    __tablename__ = "investments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    product_name = Column(String(255), nullable=False)
    amount_ves = Column(Float, nullable=False)          # Inversión en Bolívares
    bcv_rate = Column(Float, nullable=False)            # Tasa BCV usada en la compra
    amount_usd = Column(Float, nullable=False)          # Equivalente en USD (amount_ves / bcv_rate)
    quantity = Column(Integer, nullable=False)          # Cantidad de productos comprados
    shipping_cost_usd = Column(Float, default=0.0)      # Costo de envío en USD
    total_cost_usd = Column(Float, nullable=False)      # amount_usd + shipping_cost_usd
    unit_cost_usd = Column(Float, nullable=False)       # total_cost_usd / quantity
    unit_cost_ves = Column(Float, nullable=False)       # unit_cost_usd * bcv_rate
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def shipping_cost_ves(self) -> float:
        rate = self.bcv_rate if self.bcv_rate else 1.0
        return round((self.shipping_cost_usd or 0.0) * rate, 2)

    user = relationship("User", backref="investments")
