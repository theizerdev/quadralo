from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class InvestmentCreate(BaseModel):
    product_name: str = Field(..., min_length=1, description="Nombre del producto o lote")
    category: Optional[str] = Field(default="General", description="Categoría del producto o lote")
    amount_ves: float = Field(..., gt=0, description="Monto invertido en Bolívares")
    bcv_rate: float = Field(..., gt=0, description="Tasa del Banco Central de Venezuela")
    quantity: int = Field(..., gt=0, description="Cantidad de productos comprados")
    shipping_cost_ves: Optional[float] = Field(default=0.0, ge=0, description="Costo de envío en Bolívares (VES)")
    shipping_cost_usd: Optional[float] = Field(default=None, ge=0, description="Costo de envío en USD (opcional)")
    notes: Optional[str] = None

class InvestmentUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    amount_ves: Optional[float] = Field(None, gt=0)
    bcv_rate: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, gt=0)
    shipping_cost_ves: Optional[float] = Field(None, ge=0)
    shipping_cost_usd: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class InvestmentResponse(BaseModel):
    id: str
    user_id: str
    product_name: str
    category: str = "General"
    amount_ves: float
    bcv_rate: float
    amount_usd: float
    quantity: int
    initial_quantity: int = 1
    shipping_cost_ves: float = 0.0
    shipping_cost_usd: float = 0.0
    total_cost_usd: float
    unit_cost_usd: float
    unit_cost_ves: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvestmentSummary(BaseModel):
    total_invested_usd: float
    total_invested_ves: float
    total_items_count: int
    total_initial_items: Optional[int] = 0
    total_sold_items: Optional[int] = 0
    total_shipping_usd: float
    total_shipping_ves: float = 0.0
    investments_count: int
    current_bcv_rate: float
