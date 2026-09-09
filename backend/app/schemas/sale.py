from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class SalePaymentCreate(BaseModel):
    amount_usd: Optional[float] = Field(None, gt=0, description="Monto del abono en USD")
    amount_ves: Optional[float] = Field(None, gt=0, description="Monto del abono en VES")
    payment_method: str = Field(default="Pago Móvil", description="Método de pago del abono")
    notes: Optional[str] = Field(None, description="Número de referencia o comprobante")

class SalePaymentResponse(BaseModel):
    id: str
    sale_id: str
    amount_usd: float
    amount_ves: float
    bcv_rate: float
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    investment_id: Optional[str] = Field(None, description="ID del lote de inversión asociado (opcional)")
    product_name: str = Field(..., min_length=1, description="Nombre del producto vendido")
    category: Optional[str] = Field(default="General", description="Categoría del producto")
    quantity: int = Field(..., gt=0, description="Cantidad de unidades vendidas")
    bcv_rate: float = Field(..., gt=0, description="Tasa BCV aplicada en la venta")
    
    unit_cost_usd: Optional[float] = Field(default=0.0, ge=0, description="Costo unitario en USD (si no viene de inversión)")
    unit_price_usd: Optional[float] = Field(None, gt=0, description="Precio unitario de venta en USD")
    unit_price_ves: Optional[float] = Field(None, gt=0, description="Precio unitario de venta en VES")
    
    payment_method: str = Field(default="Pago Móvil", description="Método de pago utilizado")
    payment_status: Optional[str] = Field(default="paid", description="Estado del pago: paid, partial, pending")
    initial_payment_usd: Optional[float] = Field(None, ge=0, description="Abono inicial en USD si es parcial")
    initial_payment_ves: Optional[float] = Field(None, ge=0, description="Abono inicial en VES si es parcial")
    due_date: Optional[datetime] = Field(None, description="Fecha límite de cobro para ventas a crédito")

    customer_name: Optional[str] = Field(None, description="Nombre o identificación del cliente")
    notes: Optional[str] = Field(None, description="Observaciones o número de comprobante")

class SaleUpdate(BaseModel):
    investment_id: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = Field(None, gt=0)
    bcv_rate: Optional[float] = Field(None, gt=0)
    unit_cost_usd: Optional[float] = Field(None, ge=0)
    unit_price_usd: Optional[float] = Field(None, gt=0)
    unit_price_ves: Optional[float] = Field(None, gt=0)
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    due_date: Optional[datetime] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None

class SaleResponse(BaseModel):
    id: str
    user_id: str
    investment_id: Optional[str] = None
    product_name: str
    category: str = "General"
    quantity: int
    unit_cost_usd: float
    unit_price_usd: float
    unit_price_ves: float
    bcv_rate: float
    total_income_usd: float
    total_income_ves: float
    total_cost_usd: float
    total_cost_ves: float
    net_profit_usd: float
    net_profit_ves: float
    profit_margin_percent: float
    payment_method: str
    payment_status: str = "paid"
    paid_amount_usd: float = 0.0
    paid_amount_ves: float = 0.0
    debt_amount_usd: float = 0.0
    debt_amount_ves: float = 0.0
    due_date: Optional[datetime] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    payments: List[SalePaymentResponse] = []

    class Config:
        from_attributes = True

class SaleSummary(BaseModel):
    total_income_usd: float
    total_income_ves: float
    total_cost_usd: float
    total_cost_ves: float
    total_profit_usd: float
    total_profit_ves: float
    average_margin_percent: float
    total_items_sold: int
    sales_count: int
    current_bcv_rate: float
    total_debt_usd: float = 0.0
    total_debt_ves: float = 0.0
    pending_sales_count: int = 0
    paid_sales_count: int = 0

class TimelinePoint(BaseModel):
    date: str
    label: str
    revenue_usd: float
    revenue_ves: float
    cost_usd: float
    cost_ves: float
    profit_usd: float
    profit_ves: float
    margin_percent: float
    items_sold: int
    transactions_count: int

class PaymentMethodMetric(BaseModel):
    method: str
    revenue_usd: float
    revenue_ves: float
    profit_usd: float
    profit_ves: float
    sales_count: int
    share_percent: float

class ProductProfitMetric(BaseModel):
    product_name: str
    units_sold: int
    revenue_usd: float
    revenue_ves: float
    cost_usd: float
    cost_ves: float
    profit_usd: float
    profit_ves: float
    margin_percent: float
    profit_share_percent: float

class ProfitTiers(BaseModel):
    high_margin_count: int
    medium_margin_count: int
    low_margin_count: int

class SalesAnalyticsSummary(BaseModel):
    total_revenue_usd: float
    total_revenue_ves: float
    total_cogs_usd: float
    total_cogs_ves: float
    net_profit_usd: float
    net_profit_ves: float
    gross_margin_percent: float
    markup_margin_percent: float
    roi_percent: float
    total_items_sold: int
    sales_count: int
    average_ticket_usd: float
    average_ticket_ves: float
    current_bcv_rate: float

class SalesAnalyticsResponse(BaseModel):
    summary: SalesAnalyticsSummary
    timeline: list[TimelinePoint]
    by_payment_method: list[PaymentMethodMetric]
    top_products: list[ProductProfitMetric]
    profit_tiers: ProfitTiers
    filter_preset: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
