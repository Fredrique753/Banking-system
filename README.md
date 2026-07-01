\# 🏦 Banking \& Loan Management System



A \*\*production-ready\*\* Banking \& Loan Management System built with \*\*FastAPI (Python)\*\*, \*\*React (TypeScript)\*\*, \*\*PostgreSQL\*\*, and \*\*Docker\*\*. Designed for Microfinance Institutions (MFIs) to manage clients, loans, repayments, and generate financial reports in \*\*Ugandan Shillings (UGX)\*\*.



\## 🌐 Live Demo

\- \*\*Frontend:\*\* \[https://banking-system-tau-flax.vercel.app](https://banking-system-tau-flax.vercel.app)

\- \*\*Backend API Docs:\*\* \[https://banking-system-qdnx.onrender.com/docs](https://banking-system-qdnx.onrender.com/docs)

\- \*\*Admin Login:\*\* `admin` / `admin123` (change password on first login)



\## ✨ Features



\### 🔐 Authentication

\- Login / Register with JWT tokens

\- Admin and Borrower roles



\### 📊 Admin Dashboard

\- Approve / Reject loan applications

\- Generate arbitrary mock data (clients, loans, repayments)

\- Download 3 Excel reports:

&#x20; - \*\*Recovery Report\*\* – Overdue clients and outstanding balances

&#x20; - \*\*Financial Statements\*\* – P\&L and Balance Sheet

&#x20; - \*\*Portfolio Report\*\* – Expected vs actual returns



\### 👤 Borrower Dashboard

\- Apply for loans with:

&#x20; - Customer \& Next of Kin details

&#x20; - Employment, income, credit score, collateral

&#x20; - Dynamic guarantors (add unlimited)

\- View full amortization schedule (UGX)

\- Download loan schedule as PDF

\- View loan history



\### 💰 Currency \& Localization

\- All amounts displayed in \*\*Ugandan Shillings (UGX)\*\*

\- PDF exports formatted with UGX



\## 🛠️ Tech Stack



| Layer | Technology |

| :--- | :--- |

| \*\*Frontend\*\* | React 19, TypeScript, Vite, React Hook Form |

| \*\*Backend\*\* | Python 3.11, FastAPI, SQLAlchemy, Pydantic |

| \*\*Database\*\* | PostgreSQL 16, SQLite (development) |

| \*\*Hosting\*\* | Render (backend), Vercel (frontend) |

| \*\*Containerization\*\* | Docker, Docker Compose |

| \*\*Reports\*\* | openpyxl (Excel), reportlab (PDF) |



\## 🚀 Local Development



\### Prerequisites

\- Python 3.11+

\- Node.js 20+

\- PostgreSQL (or SQLite for development)



\### 1. Clone the Repository

```bash

git clone https://github.com/Fredrique753/Banking-system.git

cd Banking-system

