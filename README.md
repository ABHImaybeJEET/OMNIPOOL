<div align="center">

# 🌐 OmniPool

**The AI-Driven Community Hardware & Skill Allocation Engine**

[![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Vector_Search-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_1.5_Pro-orange?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com/)

<p align="center">
  A full-stack, AI-powered ecosystem designed to connect makers, distribute hardware, and match human talent to physical projects dynamically.
</p>

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Core Features](#-core-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
  - [Frontend Ecosystem](#frontend-ecosystem)
  - [Backend Ecosystem](#backend-ecosystem)
  - [Database & AI Pipeline](#database--ai-pipeline)
- [The OmniPool UI (Ivory Theme)](#-the-omnipool-ui-ivory-theme)
- [Getting Started 🚀](#-getting-started-)
  - [Prerequisites](#prerequisites)
  - [Environment Variables Setup](#environment-variables-setup)
  - [Running the Application](#running-the-application)
- [Atlas Vector Search (Required for ML Engine)](#-atlas-vector-search-required-for-ml-engine)
- [Development & Mock Mode](#-development--mock-mode)
- [API Reference](#-api-reference)

---

## 💡 About The Project

Building hardware projects is hard when resources and knowledge are siloed. **OmniPool** democratizes hardware development by scanning project descriptions, extracting the required Bill of Materials (BOM), and instantly matching the project with idle hardware owned by community members, as well as finding local mentors with the necessary technical skills. 

By leveraging **Retrieval-Augmented Generation (RAG)**, the AI acts as a project advisor grounded strictly in *what is actually available* around you.

---

## ✨ Core Features

1. **AI Project Parsing & RAG Advisor**
   - Submit a plain-English idea (e.g., *"I want to build a weather-tracking drone that logs data to the cloud"*).
   - Gemini 1.5 Pro analyzes the text, generates a detailed BOM, and maps out required skills (e.g., Soldering, Python, Aerodynamics).
   - The RAG system cross-references these needs against the community database, suggesting alternative parts if exact matches aren't available.

2. **Vector Search Matching Engine**
   - Uses `text-embedding-004` to create embeddings for all hardware items and user skill sets.
   - MongoDB Atlas Vector Search performs cosine similarity queries to precisely match the AI-generated BOM to real community inventory.

3. **Hardware Registry & 3D Interactive Previews**
   - Users can list their idle components (Raspberry Pis, motors, tools).
   - **React Three Fiber** provides interactive 3D visualizations (e.g., `.glb` models of soldering irons and microcontrollers) right in the browser.

4. **Real-Time Collaboration**
   - Integrated live WebSockets (`Socket.io`) for real-time team chat, allowing matched mentors and hardware donors to coordinate pickups and strategies seamlessly.

5. **Robust Identity & Security**
   - End-to-end authentication managed visually by Firebase Auth on the client and continuously verified via Firebase Admin SDK on the Express backend.

6. **Persistent AI Conversations (Copilot Sidebar)**
   - Saves project prompts, generated BOM lists, strategy outlines, and steps directly to the backend.
   - Features a clean, ChatGPT-like conversation sidebar allowing users to switch threads, trigger "New Project" starts, and load previous chats seamlessly.

7. **Interactive Leaderboard Glimpse**
   - Dynamic, unified preview of the top 3 contributors from both Community and Enterprise divisions on the landing page with sliding toggles.
   - Automatically ranks and styles contributors using styled medals and dynamic scoring metadata.

8. **Automatic Scroll Restoration**
   - Embedded route listeners that ensure transitioning pages (like Privacy Policy or Terms of Service) automatically reset the window scroll to the top.

---

## 🏗️ Architecture & Tech Stack

OmniPool utilizes a robust MERN (MongoDB, Express, React, Node) architecture, deeply augmented by AI and Web3/3D technologies.

### Frontend Ecosystem
- **Core:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, custom CSS variables
- **Animations:** Framer Motion, GSAP (GreenSock) for scroll-triggered magic.
- **3D Rendering:** `three.js`, `@react-three/fiber`, `@react-three/drei`
- **State Management:** Zustand
- **Networking:** Axios, `socket.io-client`

### Backend Ecosystem
- **Core:** Node.js 20+, Express.js
- **Real-Time:** Socket.io
- **Security:** Helmet, CORS, Firebase Admin SDK integration
- **AI Integration:** Google Genkit (`@genkit-ai/google-genai`), official Gemini SDK

### Database & AI Pipeline
- **Primary Data Store:** MongoDB (via Mongoose)
- **Vector Database:** MongoDB Atlas Vector Search
- **Embedding Model:** Google `text-embedding-004`
- **Generation Model:** Google Gemini 1.5 Pro

---

## 🎨 The OmniPool UI (Ivory Theme)

The platform features a distinct, highly polished **Premium Ivory UI**. Moving away from generic dark themes, OmniPool employs:
- **Minimalist Light Mode:** Clean, high-contrast typography prioritizing readability.
- **Engineering Grids:** Subtle, mathematically precise background textures evoking a drafting table.
- **Glassmorphism:** Frosted glass panels for modals, popups, and sticky navigation headers.
- **Micro-interactions:** Spring physics via Framer Motion on hover states, and smooth GSAP timeline reveals on page load.

---

## 🚀 Getting Started 

### Prerequisites
Before you start, ensure you have the following installed and set up:
- **Node.js** (v20 or higher)
- **Git**
- A **MongoDB Atlas Cluster** (M0 Free Tier works fine)
- A **Google Gemini API Key** (from Google AI Studio)
- A **Firebase Project**

### Environment Variables Setup

Create a `.env` file in the root of the project using the structure from `.env.sample`. The file will automatically load for both the client (Vite prefix) and server.

```env
# ─── Backend (Server) ───────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pwd>@<cluster>.mongodb.net/<app_name>
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
VECTOR_SEARCH_INDEX_NAME=default
EMBEDDING_DIMENSIONS=768

# Firebase Admin SDK (Replace with your service account details)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# ─── Frontend (Client / Vite) ──────────────────────────────
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:your_app_id
```

### Running the Application

You can launch the project using NPM or Docker.

#### Option A: NPM Manual Launch

1. **Start the Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *The server will start on port 5000 and connect to MongoDB & WebSockets.*

2. **Start the Frontend (in a new terminal):**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *The client will be available at `http://localhost:5173`.*

#### Option B: Docker Compose
If you prefer an isolated containerized environment:
```bash
docker-compose up --build
```

---

## 🧠 Atlas Vector Search (Required for ML Engine)

To enable the RAG semantic vector search, you must configure Atlas Vector Search indexes on your cluster:

1. Navigate to **MongoDB Atlas → Your Cluster → Atlas Search → Create Index**.
2. Select **JSON Editor**.
3. Create an index on the `Hardware` collection with the following JSON:
   ```json
   {
     "mappings": {
       "dynamic": true,
       "fields": {
         "item_description_embedding": {
           "dimensions": 768,
           "similarity": "cosine",
           "type": "knnVector"
         }
       }
     }
   }
   ```
4. Repeat the process for the `User` collection targeting the `skills_embedding` field.

---

## 🧪 Development & Mock Mode

To allow rapid UI development without burning through API quotas or requiring an internet connection:
- If `GEMINI_API_KEY` is omitted or invalid, the server automatically falls back to **Mock Mode**.
- In this mode, the AI endpoints return contextually rich fallback payloads using keyword detection (e.g., detecting "robot", "drone", "station") from `utils/mockData.js`. 
- This enables testing the 3D rendering, animations, and state transitions freely.

---

## 🔌 API Reference

### Real-time & WebSocket Events
- **`connection`** - Connect to the global OmniPool relay.
- **`chat:join_project`** - Subscribe to a project's collaboration room.
- **`chat:send_message`** - Dispatch a real-time message to peers.

### REST Endpoints
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/ai/parse-project` | `POST` | *Public* | Generates semantic BOM from text via Gemini |
| `/api/ai/match-resources` | `POST` | *Public* | Triggers Atlas Vector Query against community DB |
| `/api/ai/conversations` | `GET/POST` | *Auth Required* | Fetch past AI Copilot chats / Save current conversation |
| `/api/ai/conversations/:id` | `GET` | *Auth Required* | Fetch a specific past AI Copilot conversation |
| `/api/users/profile` | `GET/PUT` | *Auth Required* | Fetch/Update Firebase-verified identity |
| `/api/hardware` | `GET/POST` | *Auth Required* | View global registry / Delegate personal hardware |
| `/api/hardware/:id` | `PUT/DEL` | *Auth Required* | Edit/Delete a hardware item |
| `/api/projects` | `GET/POST` | *Auth Required* | Browse active community builds / Spawn new project |

---

<div align="center">
  <b>Built with ❤️ for the global maker community. Let's build together.</b>
</div>
