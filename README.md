# BriefForge 🚀

> **AI Creative Brief to Content Generator for agency teams**

BriefForge transforms client briefs into multi-platform social content using an open-source LLM. Submit a brief, pick your tone, and get AI-generated captions, ad copy, hook lines, CTAs, and creative concepts — adapted for Instagram, LinkedIn, Twitter/X, Facebook, and TikTok.

---

## Architecture

```
React (Vite + Tailwind)
       │ Axios (REST + JWT)
       ▼
Node.js / Express  ──── Supabase (PostgreSQL)
       │ HTTP
       ▼
FastAPI (Python)
       │ REST
       ▼
Ollama  ─── mistral:7b-instruct
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | For backend + frontend |
| Python | 3.11+ | For AI service |
| Ollama | latest | [https://ollama.com](https://ollama.com) — download & install |
| Docker | 24+ | Optional (for containerised run) |
| Supabase account | — | Free tier at [supabase.com](https://supabase.com) |

---

## Quick Start (Local Development)

### 1. Clone & install Ollama model

```bash
# Install Ollama from https://ollama.com, then:
ollama pull mistral:7b-instruct
```

### 2. Supabase Setup

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Open **SQL Editor** and run `supabase/migrations/001_init.sql`
3. Optionally run `supabase/seed.sql` for demo data
4. Copy your **Project URL** and **service_role key** from Settings → API

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev
# Runs on http://localhost:3000
```

### 4. AI Service Setup

```bash
cd ai-service
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
```

### 5. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Docker Compose (All-in-One)

```bash
# Copy env files first
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

docker compose up --build
```

> **Note**: On first run, Ollama will pull the `mistral:7b-instruct` model (~4.1 GB). This takes a few minutes.

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- AI Service: http://localhost:8000
- Ollama: http://localhost:11434

---

## Environment Variables

### `backend/.env`

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
AI_SERVICE_URL=http://localhost:8000
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
```

### `ai-service/.env`

```env
OLLAMA_HOST=http://localhost:11434
AI_MODEL=mistral:7b-instruct
```

---

## Demo Credentials (after running seed.sql)

| Email | Password | Role |
|-------|----------|------|
| alice@briefforge.dev | demo1234 | admin |
| bob@briefforge.dev | demo1234 | user |

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT |

### Clients
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clients` | JWT | List your clients |
| POST | `/api/clients` | JWT | Create a client |

### Briefs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/briefs` | JWT | Create a brief |
| GET | `/api/briefs` | JWT | List briefs (filter: client_id, tone, date_from, date_to) |
| GET | `/api/briefs/:id` | JWT | Get brief + all generations |
| DELETE | `/api/briefs/:id` | JWT | Delete brief |

### Generation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/generate/:briefId` | JWT | Trigger AI generation |
| POST | `/api/generate/:briefId/regenerate?type=&platform=` | JWT | Regenerate specific content |

---

## Project Structure

```
briefforge/
├── frontend/                 # React 18 + Vite + Tailwind + TypeScript
│   └── src/
│       ├── pages/            # Login, Dashboard, NewBrief, BriefDetail, History
│       ├── components/       # BriefForm, ToneSelector, OutputCard, PlatformTabs, Navbar
│       ├── services/api.ts   # Typed Axios client
│       └── contexts/         # AuthContext
├── backend/                  # Node.js 20 + Express
│   └── src/
│       ├── routes/           # auth, clients, briefs, generate
│       ├── controllers/      # business logic
│       ├── middleware/auth.js # JWT verification
│       ├── services/aiClient.js
│       └── db/supabase.js
├── ai-service/               # Python 3.11 + FastAPI
│   └── app/
│       ├── main.py           # FastAPI app
│       ├── llm.py            # Ollama client
│       ├── generators.py     # Orchestrates all generation types
│       └── prompts/          # Per-type prompt templates
├── supabase/
│   ├── migrations/001_init.sql
│   └── seed.sql
└── docker-compose.yml
```

---

## LLM Configuration

By default BriefForge uses **Ollama + mistral:7b-instruct** (local, no API key).

To switch models, change `AI_MODEL` in `ai-service/.env`:

```env
AI_MODEL=llama3:8b          # More creative, ~6 GB RAM
AI_MODEL=phi3:mini          # Faster, lighter, ~2 GB RAM
AI_MODEL=mistral:7b-instruct # Default, balanced
```

To use a cloud LLM instead, modify `ai-service/app/llm.py` to call your provider's API.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v3, React Router v6, Axios, react-hot-toast, lucide-react
- **Backend**: Node.js 20, Express 4, Supabase JS v2, jsonwebtoken, bcryptjs, Zod
- **AI Service**: Python 3.11, FastAPI, Pydantic v2, httpx, Ollama
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Containerization**: Docker, Docker Compose

---

## License

MIT — free to use, modify, and distribute.
