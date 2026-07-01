from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum, Index, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "admin"

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.ADMIN)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    clients = relationship("Client", back_populates="created_by_user")
    approved_loans = relationship("Loan", foreign_keys="Loan.approved_by")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(String(200))
    id_number = Column(String(50), unique=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    created_by_user = relationship("User", back_populates="clients")
    loans = relationship("Loan", back_populates="client", cascade="all, delete-orphan")

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    principal = Column(Numeric(18,2), nullable=False)
    annual_interest_rate = Column(Numeric(10,4), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    monthly_emi = Column(Numeric(18,2), nullable=False)
    total_payment = Column(Numeric(18,2), nullable=False)
    total_interest = Column(Numeric(18,2), nullable=False)
    
    # Guarantors (stored as JSON or simple fields)
    guarantor_name = Column(String(100))
    guarantor_phone = Column(String(20))
    guarantor_email = Column(String(100))
    guarantor_relationship = Column(String(50))
    
    # Employment & Financials
    employment_status = Column(String(50))
    monthly_income = Column(Numeric(18,2))
    existing_debts = Column(Numeric(18,2))
    credit_score = Column(Integer)
    collateral_type = Column(String(100))
    collateral_value = Column(Numeric(18,2))
    
    status = Column(Enum(LoanStatus), default=LoanStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    client = relationship("Client", back_populates="loans")
    approver = relationship("User", foreign_keys=[approved_by])
    schedule = relationship("PaymentSchedule", back_populates="loan", cascade="all, delete-orphan")

class PaymentSchedule(Base):
    __tablename__ = "payment_schedule"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    month = Column(Integer, nullable=False)
    emi = Column(Numeric(18,2), nullable=False)
    principal_paid = Column(Numeric(18,2), nullable=False)
    interest_paid = Column(Numeric(18,2), nullable=False)
    remaining_balance = Column(Numeric(18,2), nullable=False)
    paid = Column(Boolean, default=False)
    paid_date = Column(DateTime, nullable=True)
    
    loan = relationship("Loan", back_populates="schedule")
    __table_args__ = (Index("ix_payment_schedule_loan_month", "loan_id", "month"),)