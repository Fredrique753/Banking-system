from decimal import Decimal, getcontext
from typing import List, Dict

getcontext().prec = 28

def calculate_emi(principal: Decimal, annual_rate: Decimal, tenure_months: int) -> Decimal:
    if annual_rate == Decimal('0'):
        return principal / Decimal(tenure_months)
    monthly_rate = annual_rate / Decimal('1200')
    one_plus_r = Decimal(1) + monthly_rate
    emi = principal * monthly_rate * (one_plus_r ** tenure_months) / ((one_plus_r ** tenure_months) - Decimal(1))
    return emi.quantize(Decimal('0.01'))

def generate_amortization_schedule(principal: Decimal, annual_rate: Decimal, tenure_months: int) -> List[Dict]:
    schedule = []
    monthly_emi = calculate_emi(principal, annual_rate, tenure_months)
    monthly_rate = annual_rate / Decimal('1200')
    remaining_balance = principal
    for month in range(1, tenure_months + 1):
        interest_paid = remaining_balance * monthly_rate
        principal_paid = monthly_emi - interest_paid
        if month == tenure_months:
            principal_paid = remaining_balance
            interest_paid = monthly_emi - principal_paid
        remaining_balance -= principal_paid
        schedule.append({
            "month": month,
            "emi": monthly_emi,
            "principal_paid": principal_paid.quantize(Decimal('0.01')),
            "interest_paid": interest_paid.quantize(Decimal('0.01')),
            "remaining_balance": remaining_balance.quantize(Decimal('0.01'))
        })
    return schedule