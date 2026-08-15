# 🛡️ BenAlert Enterprise

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Application-brightgreen?style=for-the-badge&logo=vercel)](https://benalert.demo)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/egarciatx87/BenAlert-Enterprise)

> **Enterprise-grade HR compliance and benefits reconciliation portal engineered to automate carrier sync audit verification, flag enrollment discrepancies, and maintain secure, stateless user sessions.**

---

## 📸 Overview & Key Features

BenAlert Enterprise streamlines complex benefit reconciliation workflows between employer HR platforms and insurance carrier sync logs. Built specifically for HR operations and compliance auditors, the application eliminates manual log comparisons, detects variance edge-cases in real time, and ensures strict data integrity.

* **Automated Audit Verification Logic:** Evaluates carrier sync logs against internal employee records to highlight billing, coverage, and tier discrepancies automatically.
* **Stateless Session Management:** Implements secure JWT authentication backed by Axios interceptors to handle token persistence, route protection, and automatic session revocation.
* **Dynamic Reconciliation Dashboards:** Renders structured data visualization tables with real-time status filtering (Matched, Flagged, Pending Carrier Acknowledgment).
* **Defensive Form & Session Boundaries:** Prevents unauthorized REST endpoint access and manages async payload resolution gracefully with visual feedback states.

---

## 🛠️ Operational Edge-Cases & Technical Challenges Handled

### 1. Token Persistence & Auth Handshake Security
* **Challenge:** Managing expired or malformed session tokens without crashing client UI views or exposing protected compliance routes.
* **Solution:** Configured Axios request/response interceptors to automatically append JWT headers (`Authorization: Bearer <token>`) and capture `401 Unauthorized` responses to handle graceful user re-authentication.

### 2. Discrepancy Parsing in Carrier Sync Logs
* **Challenge:** Processing unstructured or mismatched carrier sync data structures leading to missed compliance errors during manual audits.
* **Solution:** Built automated verification comparison loops that cross-reference coverage codes, deduction amounts, and effective dates, reducing manual audit evaluation times significantly.

### 3. Stateful Data Filtering & Async State Management
* **Challenge:** Synchronizing bulk record filtering operations with real-time API fetch states without causing UI lag or unneeded re-renders.
* **Solution:** Structuring state isolation using React `useState` and `useEffect` patterns to manage search queries, status filters, and pagination states cleanly.

---

## 🏗️ Architecture & Technical Stack

* **Frontend Framework:** React (Functional Components, Custom Hooks)
* **Backend Services:** Python (Flask REST API Framework)
* **Authentication & Security:** JSON Web Tokens (JWT), Axios Interceptors
* **Database & ORM:** SQL / SQLite / SQLAlchemy
* **Styling & Layout:** CSS3 Flexbox/Grid with Enterprise Dashboard Layouts

---

## 📊 Benefits Audit Rule Matrix

| Audit Condition | Compliance Requirement | Rule Engine Evaluation Constraint |
| :--- | :--- | :--- |
| **Deduction Mismatch** | Payroll deduction must equal carrier premium rate | `payroll_deduction != carrier_rate` |
| **Coverage Effective Date** | Carrier start date must match active eligibility window | `carrier_start_date > enrollment_deadline` |
| **Tier Status Sync** | Dependent status must match enrolled tier coverage | `dependent_count > 0 AND tier == "Single"` |

---

## 🚀 Local Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/egarciatx87/BenAlert-Enterprise.git](https://github.com/egarciatx87/BenAlert-Enterprise.git)
   cd BenAlert-Enterprise

2. **Backend setup (Flask API)**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   flask run

3. **Frontend setup (React UI)**
  ```bash
   cd ../frontend
   npm install

4. **Configure environment variables**
   ```bash
   REACT_APP_API_BASE_URL=http://localhost:5000/api

5. **Start the local development server**
   ```bash
   npm start

## 🧑🏻‍💻 Author
Esteban Garcia

Full-Stack Software Engineer

LinkedIn: linkedin.com/in/esteban-garcia-esparza

GitHub: github.com/egarciatx87
