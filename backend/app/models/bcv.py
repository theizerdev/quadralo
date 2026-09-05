import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class BCVRateSetting(Base):
    __tablename__ = "bcv_rates"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    rate = Column(Float, nullable=False)
    source = Column(String(100), default="BCV Oficial")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
