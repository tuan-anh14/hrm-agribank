# 🏦 HRM Agribank (Personal Project)

> A comprehensive, modern solution for managing human resources, attendance, payroll, and internal communication.

## 📖 Introduction

**HRM Agribank** is a robust web-based application designed to streamline human resource operations. It bridges the gap between employee management and administrative efficiency by providing tools for attendance tracking, automated payroll calculation, work scheduling, and real-time internal communication.

Built with a scalable **NestJS** backend and a dynamic **React (Vite)** frontend, this system ensures high performance, security, and a seamless user experience.

## ✨ Key Features

### 👥 Employee Management
*   **Centralized Profiles**: Manage comprehensive employee records including personal info, positions, and departments.
*   **Role-Based Access Control (RBAC)**: Secure access for `ADMIN`, `HR`, and `EMPLOYEE` roles.

### 📅 Attendance & Scheduling
*   **Smart Attendance**: Track Check-in/Check-out times with status monitoring (On-time, Late, Absent).
*   **Work Schedules**: Flexible shift management and work schedule assignment.
*   **Shift Management**: Define Morning, Afternoon, and Full-day shifts.

### 💰 Payroll & Compensation
*   **Automated Calculation**: Generate monthly payrolls based on attendance, coefficients, and allowances.
*   **Reward & Penalty**: Manage bonuses and disciplinary actions transparently.

### 💬 Internal Collaboration
*   **Real-time Chat**: Integrated chat system with support for:
    *   Company-wide channels
    *   Department/HR groups
    *   Direct messaging
*   **Notifications**: Instant alerts for system updates, requests, and payroll status.

### 📝 Request Management
*   Streamlined process for leave requests, overtime, and other administrative approvals.

### 🛡️ Audit & Security
*   **Audit Logging**: Detailed logs of all critical system actions (Login, Update, Delete, etc.) for accountability.
*   **Security**: JWT-based authentication and secure password handling.

## 🛠️ Technology Stack

### Backend
*   **Framework**: [NestJS](https://nestjs.com/) (Node.js)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Real-time**: Socket.io (incorporating WebSockets for Chat/Notifications)
*   **Language**: TypeScript
*   **Tools**: Swagger (API Documentation), Nodemailer, Passport

### Frontend
*   **Framework**: React.js
*   **Build Tool**: Vite
*   **Styling**: SCSS / CSS Modules
*   **HTTP Client**: Axios
*   **Language**: TypeScript

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/)
*   [npm](https://www.npmjs.com/) or yarn

### 🔧 Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd hrm-agribank
```

#### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

**Configuration:**
Create a `.env` file in the `backend/` root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hrm_db?schema=public"
JWT_SECRET="your_jwt_secret"
PORT=3000
# Add other necessary config variables
```

**Database Migration:**
```bash
npx prisma migrate dev
npx prisma db seed # Optional: Seed initial data
```

**Run the Backend:**
```bash
npm run start:dev
```
The server will start at `http://localhost:3000`. API Docs available at `http://localhost:3000/api`.

#### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory:
```bash
cd ../frontend
npm install
```

**Run the Frontend:**
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

## 📂 Project Structure

```
├── backend/            # NestJS API Server
│   ├── src/
│   │   ├── auth/       # Authentication Logic
│   │   ├── employee/   # Employee Module
│   │   ├── payroll/    # Payroll Module
│   │   ├── chat/       # Real-time Chat
│   │   └── ...
│   ├── prisma/         # Database Schema & Seeds
│   └── test/           # E2E Tests
│
├── frontend/           # React Client Application
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Route Components (Dashboard, Profile, etc.)
│   │   ├── services/   # API Integration
│   │   └── styles/     # Global Styles
│   └── public/
```

## 📜 License
This is a personal project developed for learning and demonstration purposes.
