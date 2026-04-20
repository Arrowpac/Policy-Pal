# 🛡️ PolicyPal — Understand Your Insurance, Finally

> An AI-powered web application that simplifies insurance policies into plain English — so you know what you're actually covered for before it's too late.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=flat&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat&logo=tailwindcss)
![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-FF4F00?style=flat)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)

---

## 🧩 The Problem

Insurance policies are written in dense legal language, full of jargon, buried exclusions, and conditions that only matter when it's too late. Most people sign them without understanding what they're actually covered for — leading to shock, disputes, and financial loss at the worst possible moments.

**PolicyPal solves this** by letting anyone upload their insurance policy and instantly get:
- A plain-English summary
- A clear breakdown of what's covered and what's not
- AI-detected red flags and tricky clauses
- A conversational chatbot to ask any follow-up questions

---

## ✨ Features

### 🔍 Policy Analyzer
Upload a PDF or paste policy text and get an instant AI-powered breakdown including summary, coverage map, key details, and simplified clauses.

### 🚩 Red Flags Detector
Automatically identifies problematic clauses — exclusions, hidden conditions, and traps — ranked by severity (high / medium / low).

### 💬 Ask Anything Chatbot
Once a policy is uploaded, ask natural language questions like *"Am I covered if my bike is stolen?"* and get answers based on your specific policy.

### 📋 Saved Policies
All analyzed policies are saved to your account with search and filter by policy type.

### ⚖️ Policy Comparison
Upload two policies side-by-side and get a visual comparison of coverage, exclusions, and red flags.

### 🔐 Authentication
Full email/password authentication with protected routes and persistent user data.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| State Management | Context API (`AuthContext`, `PolicyContext`) |
| Backend / Database | Firebase (Auth + Firestore) |
| AI / LLM | Groq API — LLaMA 3.3 70B |
| PDF Parsing | pdfjs-dist |
| UI Components | Lucide React, React Hot Toast |
| File Upload | React Dropzone |

---

## ⚛️ React Concepts Used

| Concept | Where |
|---|---|
| `useState` | All pages — form inputs, loading states, results |
| `useEffect` | Auth state listener, policy + chat history fetching |
| `useRef` | Auto-scroll in chat, file input, input focus |
| `useMemo` | Dashboard stats, Saved page filtering |
| `useCallback` | Chat send handler, dropzone handlers |
| `useContext` | `AuthContext` and `PolicyContext` across all pages |
| Custom Hooks | `usePolicies` — fetch, delete, refetch logic |
| `React.lazy` | All 6 pages lazy-loaded with `Suspense` |
| React Router | 7 routes with protected route wrapper |
| Controlled Components | All form inputs throughout the app |
| Lifting State Up | Active policy lifted to `PolicyContext` |
| Conditional Rendering | Loading states, empty states, results panels |

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── Navbar.jsx           # Navigation bar with auth-aware links
│   └── ProtectedRoute.jsx   # Route guard for authenticated pages
├── context/
│   ├── AuthContext.jsx      # Global auth state via Firebase
│   └── PolicyContext.jsx    # Active policy shared across pages
├── hooks/
│   └── usePolicies.js       # Fetch, delete, refetch user policies
├── pages/
│   ├── Login.jsx            # Email/password sign in
│   ├── Signup.jsx           # Account creation
│   ├── Dashboard.jsx        # Overview + stats + policy list
│   ├── Analyzer.jsx         # Core upload + AI analysis page
│   ├── Chat.jsx             # Policy-specific Q&A chatbot
│   ├── Saved.jsx            # Searchable saved policies
│   └── Compare.jsx          # Side-by-side policy comparison
├── services/
│   ├── firebase.js          # Firebase app initialization
│   ├── gemini.js            # Groq client initialization
│   ├── aiService.js         # simplifyPolicy + askPolicyQuestion
│   └── firestoreService.js  # All Firestore CRUD operations
└── utils/
    └── pdfParser.js         # PDF text extraction via pdfjs-dist
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project with Auth + Firestore enabled
- A [Groq](https://console.groq.com) API key (free)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/policypal.git
cd policypal

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root with the following:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GROQ_API_KEY=your_groq_api_key
```

### Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** → Start in test mode
4. Register a Web App and copy the config into `.env`

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📊 Firestore Data Model

```
users/{uid}/
  policies/{policyId}/
    name: string
    rawText: string
    policyType: "health" | "vehicle" | "life" | "home" | "travel" | "other"
    summary: string
    covered: string[]
    notCovered: string[]
    keyDetails: { label: string, value: string }[]
    redFlags: { clause: string, explanation: string, severity: string }[]
    simplifiedClauses: { original: string, simplified: string }[]
    uploadedAt: timestamp

    messages/{messageId}/
      role: "user" | "assistant"
      content: string
      createdAt: timestamp
```

---

## 🔐 Security

- All routes except `/login` and `/signup` are protected
- Auth state is managed via Firebase `onAuthStateChanged`
- Each user can only access their own data (scoped by `uid`)
- API keys are stored in `.env` and never committed to version control

---

## 🧑‍💻 Author

**Shaurya Malik**
Group B, Batch 2029 - Building Web Applications with React

---

## 📄 License

This project is built for educational purposes as part of an end-term project submission.
>>>>>>> 7f9ab003e110b2eb5ababdca67349e55352ff26a
