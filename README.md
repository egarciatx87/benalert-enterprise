# 🛡️ BenAlert Enterprise — Multi-Tenant HR Compliance & Audit Portal

> A full-stack enterprise web application designed to detect, flag, and reconcile employee health insurance coverage drops across third-party benefit carriers.

---

## 📌 Architecture Overview

BenAlert Enterprise utilizes a secure **Flask REST API** backend paired with a **React single-page application (SPA)** frontend, enforcing multi-tenant data isolation at the ORM database layer.

┌─────────────────────────────────────────────────────────────────────────────┐
│                            BENALERT ENTERPRISE ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   REACT FRONTEND (Port 3000)             FLASK BACKEND API (Port 5000)      │
│   ┌─────────────────────────┐            ┌──────────────────────────────┐   │
│   │ • Global AuthContext    │            │ • JWT Authentication         │   │
│   │ • Protected Routing     │ ──(HTTP)─► │ • SQLAlchemy ORM             │   │
│   │ • Interactive Modals    │            │ • Reconciliation Engine      │   │
│   └─────────────────────────┘            └──────────────┬───────────────┘   │
│                                                         │                   │
│                                                         ▼                   │
│                                                SQLITE DATABASE              │
│                                          (User -> Employee -> Alert)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

---

## ✨ Key Features

* 🔐 **Multi-Tenant JWT Authentication**: Secure user registration and login using `Flask-Bcrypt` for salted password hashing and JWT access tokens stored via global React `AuthContext`.
* 🛡️ **Data Scoping & Security**: Strict foreign-key relationship constraints (`User` $\rightarrow$ `Employee` $\rightarrow$ `AuditAlert`) guarantee complete privacy between company accounts.
* ⚡ **Automated Reconciliation Audit Engine**: Scans active workers against simulated benefit carrier logs to detect sync drops in real time.
* 🛠️ **Interactive Discrepancy Modal**: Full CRUD lifecycle allowing HR managers to update alert statuses (`Open`, `Investigating`, `Resolved`), append audit notes, or dismiss flags.
* 📊 **Live Metric Banners**: Real-time workforce counts and high-priority warning indicators.

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Create a new HR manager account | ❌ |
| `POST` | `/api/auth/login` | Authenticate & receive JWT passport | ❌ |
| `GET` | `/api/auth/me` | Fetch current authenticated user profile | ✅ |
| `GET` | `/api/employees` | Retrieve logged-in user's active workforce | ✅ |
| `POST` | `/api/employees` | Add a new employee to the workspace | ✅ |
| `GET` | `/api/alerts` | Fetch active insurance audit alerts | ✅ |
| `POST` | `/api/reconcile` | Run the automated carrier reconciliation engine | ✅ |
| `PATCH` | `/api/alerts/<id>` | Update alert status (`Investigating`/`Resolved`) & notes | ✅ |
| `DELETE` | `/api/alerts/<id>` | Dismiss/delete an alert flag | ✅ |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* Python 3.10+
* Node.js v18+ & `npm`

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install flask flask-sqlalchemy flask-bcrypt flask-jwt-extended flask-cors
python app.py

2. Frontend Setup
Bash
cd frontend
npm install
npm start

🛠️ Tech Stack
Frontend: React, React Router v6, Axios, Context API

Backend: Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS

Database: SQLite