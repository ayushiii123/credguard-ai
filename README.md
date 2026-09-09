# 🛡️ CredGuard AI

> AI-powered credential breach monitoring and risk assessment platform.

CredGuard AI is a cybersecurity platform designed to help users monitor their accounts, process breach information, assess security risk, understand potential threats, and follow actionable protection steps.

## 🚀 Core Approach

**Detect → Assess → Explain → Protect**

- **Detect** — Process available breach information and identify exposed data.
- **Assess** — Calculate a risk score based on predefined security factors.
- **Explain** — Use AI to explain the security impact and possible threats.
- **Protect** — Provide actionable recommendations to improve account security.

## ✨ Key Features

- 🔐 User Registration & Login
- 🎯 JWT-based Authentication
- 👤 Monitored Account Management
- 🚨 Breach Detection & Management
- 📊 Risk Score Calculation
- 🤖 AI Security Analysis
- 🛡️ Protection Plans
- 🔔 Security Alerts
- 📋 Audit Logs
- 📈 Security & Risk Dashboard
- 🔒 Security-focused backend architecture

## 🧠 Risk Assessment

CredGuard AI uses a rule-based Risk Engine to calculate a security risk score.

The assessment can consider factors such as:

- Breach severity
- Type of exposed information
- Sensitivity of exposed data
- Multiple exposed data types
- Other predefined risk factors

The Risk Engine provides a consistent and explainable risk assessment instead of relying on AI alone to calculate the score.

## 🤖 Role of AI

The AI layer works alongside the Risk Engine.

The Risk Engine answers:

> **"How risky is the exposure?"**

The AI layer focuses on:

> **"Why is it risky and what should the user do next?"**

AI analysis can help explain potential threats and provide security recommendations in a user-friendly way.

## 🏗️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB Atlas
- MongoDB

### Security
- JWT Authentication
- Password Hashing
- Helmet
- CORS
- Rate Limiting
- Environment Variables

### AI & Security Services
- AI Security Analysis
- Rule-based Risk Engine
- Breach Monitoring Services
- Threat Intelligence Service

## 📁 Project Structure

```text
credguard-ai/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
├── .gitignore
└── README.md