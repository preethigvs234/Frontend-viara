# 🎯 Viara — AI-Powered Personalized Recommendation System (Frontend)

> A real-time, interactive React frontend for Viara — an AI recommendation engine powered by Google Gemini API.

---

## 📌 Overview

Viara Frontend is a responsive, real-time web application that interacts with the Viara backend to deliver personalized AI recommendations. It streams partial responses from the backend asynchronously, providing users with a smooth, low-latency experience.

> 🔗 Backend Repo: [Viara Backend](https://github.com/preethigvs234/viara-backend)

---

## ✨ Features

- ⚡ **Real-Time Streaming UI** — Partial response streaming reduces perceived latency
- 🎨 **Responsive Design** — Mobile-first layout with Tailwind CSS
- 🔄 **Dynamic Preference Updates** — UI reflects refined recommendations as user interacts
- 🔌 **REST API Integration** — Communicates with FastAPI async backend
- 🧠 **AI-Aware UX** — Designed to display Gemini-generated recommendations naturally

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React.js (v18) |
| Styling | Tailwind CSS |
| State Management | React Hooks (useState, useEffect) |
| API Communication | Fetch API (streaming support) |
| Deployment | Render |

---

## 🏗️ Project Structure

```
viara-frontend/
├── public/
├── src/
│   ├── components/
│   │   |    # Handles real-time streamed responses
│   │   └── Navbar.jsx
│   ├── services/
│   │   └── api.js                   # API calls to FastAPI backend
│   ├── App.jsx
│   └── index.css
├── .env
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Viara Backend running (see backend repo)

### Installation

```bash
# Clone the repo
git clone https://github.com/preethigvs234/viara-frontend.git
cd viara-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Set REACT_APP_API_URL to your backend URL
```

### Running Locally

```bash
npm start
# App runs at http://localhost:3000
```

---

## 🌐 Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 📸 How It Works

1. User enters their preferences (topics, interests, goals)
2. Frontend sends request to FastAPI backend
3. Backend queries Google Gemini API and streams response
4. Frontend renders recommendations in real-time as they stream in
5. User can refine preferences — engine continuously learns and updates

---
