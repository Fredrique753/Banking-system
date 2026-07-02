from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime
from .database import SessionLocal
from .models import Client, Loan, PaymentSchedule, User, LoanStatus, LoanProduct
from .auth import get_current_admin_user, get_db
from .calculators.amortization import calculate_emi, generate_amortization_schedule
from .sms import send_sms  # NEW
from .email import send_email  # NEW
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

# --- SCHEMAS ---
class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address: Optional[str] = None
    id_number: str

class LoanProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    min_principal: float
    max_principal: float
    default_interest_rate: float
    default_tenure: int

class LoanApplicationCreate(BaseModel):
    client_id: int
    loan_product_id: Optional[int] = None
    principal: float
    annual_interest_rate: float
    tenure_months: int
    business_type: Optional[str] = None
    loan_purpose: Optional[str] = None
    repayment_source: Optional[str] = None
    guarantor_name: Optional[str] = None
    guarantor_phone: Optional[str] = None
    guarantor_email: Optional[str] = None
    guarantor_relationship: Optional[str] = None
    employment_status: Optional[str] = None
    monthly_income: Optional[float] = None
    existing_debts: Optional[float] = None
    credit_score: Optional[int] = None
    collateral_type: Optional[str] = None
    collateral_value: Optional[float] = None

# --- LOAN PRODUCT ENDPOINTS ---
@router.post("/loan-products")
def create_loan_product(product: LoanProductCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    db_product = LoanProduct(
        name=product.name,
        description=product.description,
        min_principal=Decimal(str(product.min_principal)),
        max_principal=Decimal(str(product.max_principal)),
        default_interest_rate=Decimal(str(product.default_interest_rate)),
        default_tenure=product.default_tenure
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/loan-products")
def get_loan_products(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(LoanProduct).filter(LoanProduct.is_active == True).all()

# --- CLIENT ENDPOINTS ---
@router.post("/clients")
def create_client(client: ClientCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    existing = db.query(Client).filter(Client.id_number == client.id_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client with this ID number already exists")
    
    db_client = Client(
        first_name=client.first_name,
        last_name=client.last_name,
        email=client.email,
        phone=client.phone,
        address=client.address,
        id_number=client.id_number,
        created_by=admin.id
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    # Send SMS notification to admin
    send_sms(admin.phone, f"New client registered: {client.first_name} {client.last_name}")
    
    return db_client

@router.get("/clients")
def get_all_clients(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(Client).order_by(Client.created_at.desc()).all()

# --- LOAN APPLICATION ENDPOINTS ---
@router.post("/loans/apply")
def apply_loan(application: LoanApplicationCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    client = db.query(Client).filter(Client.id == application.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # If loan product is selected, override rate and tenure
    if application.loan_product_id:
        product = db.query(LoanProduct).filter(LoanProduct.id == application.loan_product_id).first()
        if product:
            application.annual_interest_rate = float(product.default_interest_rate)
            application.tenure_months = product.default_tenure
    
    principal = Decimal(str(application.principal))
    rate = Decimal(str(application.annual_interest_rate))
    tenure = application.tenure_months
    
    emi = calculate_emi(principal, rate, tenure)
    schedule_data = generate_amortization_schedule(principal, rate, tenure)
    total_payment = sum(item["emi"] for item in schedule_data)
    total_interest = total_payment - principal
    
    db_loan = Loan(
        client_id=application.client_id,
        loan_product_id=application.loan_product_id,
        principal=principal,
        annual_interest_rate=rate,
        tenure_months=tenure,
        monthly_emi=emi,
        total_payment=total_payment,
        total_interest=total_interest,
        business_type=application.business_type,
        loan_purpose=application.loan_purpose,
        repayment_source=application.repayment_source,
        guarantor_name=application.guarantor_name,
        guarantor_phone=application.guarantor_phone,
        guarantor_email=application.guarantor_email,
        guarantor_relationship=application.guarantor_relationship,
        employment_status=application.employment_status,
        monthly_income=Decimal(str(application.monthly_income)) if application.monthly_income else None,
        existing_debts=Decimal(str(application.existing_debts)) if application.existing_debts else None,
        credit_score=application.credit_score,
        collateral_type=application.collateral_type,
        collateral_value=Decimal(str(application.collateral_value)) if application.collateral_value else None,
        status=LoanStatus.PENDING
    )
    db.add(db_loan)
    db.flush()
    
    for item in schedule_data:
        db_schedule = PaymentSchedule(
            loan_id=db_loan.id,
            month=item["month"],
            emi=item["emi"],
            principal_paid=item["principal_paid"],
            interest_paid=item["interest_paid"],
            remaining_balance=item["remaining_balance"],
            paid=False
        )
        db.add(db_schedule)
    
    db.commit()
    db.refresh(db_loan)
    
    # Send SMS notification to client (if phone number exists)
    if client.phone:
        send_sms(client.phone, f"Loan application received! ID: {db_loan.id}. You will be notified once approved.")
    
    return {
        "message": "Loan application submitted successfully",
        "loan_id": db_loan.id,
        "monthly_emi": emi,
        "total_payment": total_payment,
        "total_interest": total_interest,
        "client_name": f"{client.first_name} {client.last_name}"
    }

@router.get("/loans")
def get_all_loans(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    loans = db.query(Loan).order_by(Loan.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "client_name": f"{l.client.first_name} {l.client.last_name}" if l.client else "Unknown",
            "principal": l.principal,
            "status": l.status.value,
            "created_at": l.created_at,
            "monthly_emi": l.monthly_emi,
            "business_type": l.business_type,
            "loan_purpose": l.loan_purpose
        } for l in loans
    ]

@router.put("/loans/{loan_id}/status")
def update_loan_status(loan_id: int, status: LoanStatus, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    loan.status = status
    if status == LoanStatus.APPROVED or status == LoanStatus.DISBURSED:
        loan.approved_by = admin.id
        loan.approved_at = datetime.utcnow()
        
        # Send SMS notifications
        client = loan.client
        if client and client.phone:
            if status == LoanStatus.APPROVED:
                send_sms(client.phone, f"🎉 Your loan of UGX {loan.principal:,.0f} has been APPROVED! Please visit our office for disbursement.")
                send_email(client.email, "Loan Approved", f"Dear {client.first_name}, your loan of UGX {loan.principal:,.0f} has been approved.")
            elif status == LoanStatus.DISBURSED:
                send_sms(client.phone, f"💰 Your loan of UGX {loan.principal:,.0f} has been DISBURSED. Your first payment is due in 30 days.")
    
    db.commit()
    return {"message": f"Loan status updated to {status.value}"}

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    total_clients = db.query(Client).count()
    total_loans = db.query(Loan).count()
    pending = db.query(Loan).filter(Loan.status == LoanStatus.PENDING).count()
    approved = db.query(Loan).filter(Loan.status == LoanStatus.APPROVED).count()
    rejected = db.query(Loan).filter(Loan.status == LoanStatus.REJECTED).count()
    disbursed = db.query(Loan).filter(Loan.status == LoanStatus.DISBURSED).count()
    
    # NEW: Calculate total loan value
    total_principal = db.query(Loan.principal).all()
    total_principal_sum = sum([p[0] for p in total_principal]) if total_principal else Decimal(0)
    
    return {
        "total_clients": total_clients,
        "total_loans": total_loans,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "disbursed": disbursed,
        "total_principal": float(total_principal_sum)
    }