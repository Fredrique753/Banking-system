import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from .models import User, Loan, PaymentSchedule, LoanStatus, UserRole
from .auth import get_password_hash
from .calculators.amortization import generate_amortization_schedule

FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"]

def generate_mock_users(db: Session, count: int = 20):
    users = []
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        username = f"{first.lower()}{last.lower()}{random.randint(10,99)}"
        email = f"{username}@example.com"
        hashed = get_password_hash("password123")
        user = User(
            username=username,
            email=email,
            hashed_password=hashed,
            full_name=name,
            role=UserRole.BORROWER
        )
        db.add(user)
        users.append(user)
    db.commit()
    return users

def generate_mock_loans(db: Session, users: list, count_per_user: int = 2):
    loans_created = []
    for user in users:
        for _ in range(random.randint(1, count_per_user)):
            # UGX Amounts: 500,000 to 50,000,000
            principal = Decimal(random.randint(500000, 50000000))
            rate = Decimal(random.randint(5, 25))
            tenure = random.randint(6, 36)
            
            from .calculators.amortization import calculate_emi
            emi = calculate_emi(principal, rate, tenure)
            schedule_data = generate_amortization_schedule(principal, rate, tenure)
            total_payment = sum(item["emi"] for item in schedule_data)
            total_interest = total_payment - principal

            status_choice = random.choices(
                [LoanStatus.APPROVED, LoanStatus.DISBURSED, LoanStatus.PENDING], 
                weights=[4, 4, 1]
            )[0]
            
            loan = Loan(
                user_id=user.id,
                principal=principal,
                annual_interest_rate=rate,
                tenure_months=tenure,
                monthly_emi=emi,
                total_payment=total_payment,
                total_interest=total_interest,
                customer_name=user.full_name,
                customer_email=user.email,
                customer_phone=f"+256{random.randint(700000000, 999999999)}",  # Ugandan phone format
                employment_status=random.choice(["Employed", "Self-Employed", "Unemployed"]),
                monthly_income=principal * Decimal(random.uniform(2, 5)),
                existing_debts=principal * Decimal(random.uniform(0, 0.3)),
                credit_score=random.randint(550, 850),
                status=status_choice,
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 180))
            )
            db.add(loan)
            db.flush()

            for item in schedule_data:
                schedule = PaymentSchedule(
                    loan_id=loan.id,
                    month=item["month"],
                    emi=item["emi"],
                    principal_paid=item["principal_paid"],
                    interest_paid=item["interest_paid"],
                    remaining_balance=item["remaining_balance"],
                    paid=False
                )
                db.add(schedule)
            
            loans_created.append(loan)
    db.commit()
    return loans_created

def mark_repayments(db: Session, loans: list):
    for loan in loans:
        if loan.status != LoanStatus.DISBURSED:
            continue
        
        schedules = db.query(PaymentSchedule).filter(PaymentSchedule.loan_id == loan.id).order_by(PaymentSchedule.month).all()
        if not schedules:
            continue

        today = datetime.utcnow()
        health = random.choices(["good", "overdue", "default"], weights=[7, 2, 1])[0]
        
        for idx, sched in enumerate(schedules):
            due_date = loan.created_at + timedelta(days=30 * sched.month)
            
            if due_date > today:
                break

            if health == "good":
                sched.paid = True
                sched.paid_date = due_date + timedelta(days=random.randint(0, 5))
            elif health == "overdue":
                if idx < len(schedules) // 2:
                    sched.paid = True
                    sched.paid_date = due_date + timedelta(days=random.randint(0, 5))
                else:
                    sched.paid = False
                    sched.paid_date = None
            else:  # default
                if idx < len(schedules) // 3:
                    sched.paid = True
                    sched.paid_date = due_date + timedelta(days=random.randint(0, 5))
                else:
                    sched.paid = False
                    sched.paid_date = None
        
        if health == "default":
            loan.status = LoanStatus.REJECTED
            
    db.commit()

def generate_all_mock_data(db: Session):
    db.query(PaymentSchedule).delete()
    db.query(Loan).filter(Loan.user_id != 1).delete()
    db.query(User).filter(User.id != 1).delete()
    db.commit()
    
    users = generate_mock_users(db, count=25)
    loans = generate_mock_loans(db, users, count_per_user=2)
    mark_repayments(db, loans)
    return {"users": len(users), "loans": len(loans)}