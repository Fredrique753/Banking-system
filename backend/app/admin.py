from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .database import SessionLocal
from .models import Loan, LoanStatus, User
from .auth import get_current_admin_user, get_db
from .mock_data import generate_all_mock_data

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    total = db.query(Loan).count()
    pending = db.query(Loan).filter(Loan.status == LoanStatus.PENDING).count()
    approved = db.query(Loan).filter(Loan.status == LoanStatus.APPROVED).count()
    rejected = db.query(Loan).filter(Loan.status == LoanStatus.REJECTED).count()
    disbursed = db.query(Loan).filter(Loan.status == LoanStatus.DISBURSED).count()
    return {"total": total, "pending": pending, "approved": approved, "rejected": rejected, "disbursed": disbursed}

@router.put("/loans/{loan_id}/status")
def update_status(loan_id: int, status: LoanStatus, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    loan.status = status
    loan.approved_by = admin.id
    loan.approved_at = datetime.utcnow()
    db.commit()
    return {"message": f"Status updated to {status.value}"}

# --- FIX: THE MISSING ENDPOINT ---
@router.get("/loans")
def get_all_loans_for_admin(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    loans = db.query(Loan).order_by(Loan.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "customer_name": l.customer_name,
            "principal": l.principal,
            "status": l.status.value,
            "created_at": l.created_at,
            "user_id": l.user_id
        } for l in loans
    ]

# --- MOCK DATA ENDPOINT ---
@router.post("/generate-mock-data")
def generate_mock_data(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    result = generate_all_mock_data(db)
    return {"message": f"Generated {result['users']} users and {result['loans']} loans with repayment histories!", **result}