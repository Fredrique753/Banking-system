from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta
from .models import Loan, PaymentSchedule, User, LoanStatus

def get_portfolio_summary(db: Session):
    total_loans = db.query(Loan).count()
    total_principal = db.query(Loan.principal).all()
    total_principal_sum = sum([p[0] for p in total_principal]) if total_principal else Decimal(0)
    total_interest = db.query(Loan.total_interest).all()
    total_interest_sum = sum([i[0] for i in total_interest]) if total_interest else Decimal(0)
    return {
        "total_loans": total_loans,
        "total_principal": total_principal_sum,
        "total_interest": total_interest_sum
    }

def get_overdue_loans(db: Session):
    today = datetime.utcnow().date()
    overdue_list = []
    loans = db.query(Loan).filter(Loan.status == LoanStatus.DISBURSED).all()
    for loan in loans:
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.loan_id == loan.id,
            PaymentSchedule.paid == False
        ).order_by(PaymentSchedule.month).all()
        if schedules:
            oldest = schedules[0]
            due_date = loan.created_at + timedelta(days=30 * oldest.month)
            days_overdue = (today - due_date.date()).days
            if days_overdue > 0:
                total_paid = db.query(PaymentSchedule).filter(
                    PaymentSchedule.loan_id == loan.id,
                    PaymentSchedule.paid == True
                ).all()
                total_paid_sum = sum([p.emi for p in total_paid]) if total_paid else Decimal(0)
                client = loan.client
                client_name = f"{client.first_name} {client.last_name}" if client else "Unknown"
                overdue_list.append({
                    "loan_id": loan.id,
                    "customer_name": client_name,
                    "customer_phone": client.phone if client else "N/A",
                    "principal": loan.principal,
                    "monthly_emi": loan.monthly_emi,
                    "total_paid": total_paid_sum,
                    "outstanding_balance": loan.principal - total_paid_sum,
                    "days_overdue": days_overdue,
                    "months_overdue": oldest.month - 1,
                    "status": "Overdue"
                })
    return overdue_list

def get_recovery_metrics(db: Session):
    loans = db.query(Loan).filter(Loan.status == LoanStatus.DISBURSED).all()
    total_expected = Decimal(0)
    total_collected = Decimal(0)
    total_principal = Decimal(0)
    for loan in loans:
        schedules = db.query(PaymentSchedule).filter(PaymentSchedule.loan_id == loan.id).all()
        expected = sum([s.emi for s in schedules])
        collected = sum([s.emi for s in schedules if s.paid])
        total_expected += expected
        total_collected += collected
        total_principal += loan.principal
    repayment_rate = (total_collected / total_expected * 100) if total_expected > 0 else 0
    return {
        "total_expected": total_expected,
        "total_collected": total_collected,
        "total_principal": total_principal,
        "repayment_rate": repayment_rate,
        "portfolio_yield": (total_collected / total_principal * 100) if total_principal > 0 else 0
    }

def get_all_clients_with_loans(db: Session):
    loans = db.query(Loan).filter(Loan.status == LoanStatus.DISBURSED).all()
    clients = []
    for loan in loans:
        schedules = db.query(PaymentSchedule).filter(PaymentSchedule.loan_id == loan.id).all()
        collected = sum([s.emi for s in schedules if s.paid])
        expected = sum([s.emi for s in schedules])
        client = loan.client
        client_name = f"{client.first_name} {client.last_name}" if client else "Unknown"
        clients.append({
            "client_name": client_name,
            "client_phone": client.phone if client else "N/A",
            "client_email": client.email if client else "N/A",
            "principal": loan.principal,
            "interest_rate": loan.annual_interest_rate,
            "tenure": loan.tenure_months,
            "emi": loan.monthly_emi,
            "total_expected": expected,
            "total_collected": collected,
            "outstanding": expected - collected,
            "status": "Active" if loan.status == LoanStatus.DISBURSED else loan.status.value
        })
    return clients