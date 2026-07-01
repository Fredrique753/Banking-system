from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from decimal import Decimal
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from pydantic import BaseModel  # <-- ADDED

from .database import SessionLocal, init_db
from . import models, auth, admin
from .models import PaymentSchedule
from .routes_reports import router as reports_router

app = FastAPI(title="Banking System", version="1.0")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://banking-system-tau-flax.vercel.app",
        "https://banking-system-qdnx.onrender.com",
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# --- Include Routers ---
app.include_router(admin.router)
app.include_router(reports_router)

# --- Startup: Create Tables & Admin User ---
@app.on_event("startup")
def startup():
    init_db()
    db = SessionLocal()
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        new_admin = models.User(
            username="admin",
            email="admin@bank.com",
            hashed_password=auth.get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin"
        )
        db.add(new_admin)
        db.commit()
    db.close()

# --- Root ---
@app.get("/")
def root():
    return {"message": "Banking System API"}

# --- Authentication Endpoints ---
@app.post("/api/v1/login")
def login(user: auth.UserLogin, db: Session = Depends(auth.get_db)):
    db_user = auth.authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/v1/register")
def register(user: auth.UserCreate, db: Session = Depends(auth.get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "email": new_user.email}

@app.get("/api/v1/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- CHANGE PASSWORD ENDPOINT (NEW) ---
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.post("/api/v1/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    # Verify current password
    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash the new password
    new_hashed = auth.get_password_hash(request.new_password)
    current_user.hashed_password = new_hashed
    db.commit()
    
    return {"message": "Password changed successfully"}

# --- Loan Endpoints ---
@app.post("/api/v1/apply-loan")
def apply_loan(request: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    return {"message": "Loan submitted"}

@app.post("/api/v1/calculate-loan")
def calculate_loan(request: dict):
    from .calculators.amortization import calculate_emi, generate_amortization_schedule
    principal = Decimal(request.get("principal"))
    rate = Decimal(request.get("annual_interest_rate"))
    tenure = int(request.get("tenure_months"))
    
    emi = calculate_emi(principal, rate, tenure)
    schedule = generate_amortization_schedule(principal, rate, tenure)
    total_payment = sum(item["emi"] for item in schedule)
    total_interest = total_payment - principal
    
    return {
        "monthly_emi": emi,
        "total_payment": total_payment,
        "total_interest": total_interest,
        "schedule": schedule
    }

@app.get("/api/v1/loans")
def list_my_loans(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    loans = db.query(models.Loan).filter(models.Loan.user_id == current_user.id).order_by(models.Loan.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "customer_name": l.customer_name,
            "principal": l.principal,
            "monthly_emi": l.monthly_emi,
            "status": l.status.value,
            "created_at": l.created_at
        } for l in loans
    ]

# --- PDF GENERATION ---
@app.get("/api/v1/loans/{loan_id}/pdf")
def generate_loan_pdf(loan_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan or loan.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    schedule = db.query(PaymentSchedule).filter(PaymentSchedule.loan_id == loan_id).order_by(PaymentSchedule.month).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    title_style = styles['Heading1']
    elements.append(Paragraph(f"Loan Amortization Schedule - #{loan.id}", title_style))
    elements.append(Spacer(1, 12))
    
    summary_style = styles['Normal']
    elements.append(Paragraph(f"<b>Customer:</b> {loan.customer_name}", summary_style))
    elements.append(Paragraph(f"<b>Principal:</b> UGX {loan.principal:,.2f}", summary_style))
    elements.append(Paragraph(f"<b>Rate:</b> {loan.annual_interest_rate}%", summary_style))
    elements.append(Paragraph(f"<b>Tenure:</b> {loan.tenure_months} months", summary_style))
    elements.append(Paragraph(f"<b>Monthly EMI:</b> UGX {loan.monthly_emi:,.2f}", summary_style))
    elements.append(Spacer(1, 12))
    
    data = [["Month", "EMI (UGX)", "Principal (UGX)", "Interest (UGX)", "Balance (UGX)"]]
    for row in schedule:
        data.append([
            str(row.month),
            f"{row.emi:,.2f}",
            f"{row.principal_paid:,.2f}",
            f"{row.interest_paid:,.2f}",
            f"{row.remaining_balance:,.2f}"
        ])
    
    table = Table(data, colWidths=[50, 80, 80, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=loan_{loan_id}.pdf"}
    )