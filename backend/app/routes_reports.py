from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User
from .auth import get_current_user, get_db
from .reports import generate_recovery_report, generate_financial_statements, generate_portfolio_report
import io

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

@router.get("/recovery")
def download_recovery_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    file_data = generate_recovery_report(db)
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=recovery_report.xlsx"}
    )

@router.get("/financials")
def download_financial_statements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    file_data = generate_financial_statements(db)
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=financial_statements.xlsx"}
    )

@router.get("/portfolio")
def download_portfolio_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    file_data = generate_portfolio_report(db)
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=portfolio_report.xlsx"}
    )