from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerSummaryItem(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    
    # Métricas agregadas
    total_purchases_count: int = 0
    total_spent_usd: float = 0.0
    total_spent_ves: float = 0.0
    total_debt_usd: float = 0.0
    total_debt_ves: float = 0.0
    total_paid_usd: float = 0.0
    total_paid_ves: float = 0.0
    payment_status: str = "up_to_date"  # "up_to_date", "has_debt"
    last_purchase_date: Optional[datetime] = None
    created_at: datetime

class CustomersSummaryKPIs(BaseModel):
    total_customers: int = 0
    debtors_count: int = 0
    up_to_date_count: int = 0
    total_receivable_usd: float = 0.0
    total_receivable_ves: float = 0.0
    average_ticket_usd: float = 0.0

class CustomerListResponse(BaseModel):
    kpis: CustomersSummaryKPIs
    customers: List[CustomerSummaryItem]
