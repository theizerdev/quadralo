import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="customers")
    sales = relationship("Sale", back_populates="customer", cascade="all, delete-orphan")
