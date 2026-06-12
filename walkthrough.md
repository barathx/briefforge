# BriefForge — Development Walkthrough

A production-ready AI Creative Brief to Content Generator application has been successfully constructed in the `/briefforge` workspace.

---

## 🛠️ Components Built

### 1. Database (Supabase / PostgreSQL)
- **SQL Migration**: Created `supabase/migrations/001_init.sql` creating tables for `users` (with bcrypt passwords), `clients`, `briefs`, and `generations` (with platforms JSONB). Added indices and enabled **Row Level Security (RLS)** with user-scoping policies.
- **Seeds**: Created `supabase/seed.sql` pre-seeding two mock users (password `demo1234`), active clients (Nike, Starbucks), and sample briefs/generations.

### 2. Node.js Backend API
- **Entry point**: Built Express server (`backend/src/server.js`) with security middleware (`helmet`, `cors`, `morgan`).
- **Auth**: Built custom JWT authentication middleware and login/signup flows (`authController.js`, `auth.js` routes).
- **CRUD Operations**: Constructed controllers for `clientsController.js` and `briefsController.js` supporting dynamic querying, filters, keyword search, and pagination.
- **Dashboard**: Added a custom `dashboardController.js` returning active totals and generations counts.
- **AI Integration**: Built a robust `aiClient.js` translation layer mapping camelCase data, mapping singular types to FastAPI plural schemas, and normalising AI service structures to flat structures.

### 3. FastAPI Python AI Microservice
- **App Entry**: Created `app/main.py` configuring settings and handling request parsing.
- **Ollama Client**: Built `app/llm.py` executing async inference requests to local Ollama (`mistral:7b-instruct`) with retries.
- **Prompts**: Defined high-quality templates for platforms captions, ad headlines, attention hooks, CTAs, and campaign concepts.
- **Generators**: Built parallel async tasks execution (`generators.py`) gathering LLM completions concurrently.

### 4. React 18 / Tailwind Frontend
- **Auth & API Context**: Implemented a global `AuthContext` managing localStorage JWT and decode helper, combined with a typed Axios client (`api.ts`) supporting normalisation.
- **Layout & Pages**: Created `LoginPage` (with animated glass theme), `DashboardPage` (with summary stats and recent briefs table), `NewBriefPage` (multi-step brief submit wizard), `BriefDetailPage` (tabbed details view and regeneration), and `HistoryPage` (keyword search, tones, date ranges, and delete triggers).
- **Components**: Created reusable UI modules like `BriefForm`, `ToneSelector`, `PlatformTabs`, `Navbar`, and `OutputCard` (enhanced to support structured objects like ad copy headlines and visual concepts formatting).

---

## 🔍 Verification & Testing Guide

### 1. Database setup
Execute the migration scripts in your Supabase SQL editor:
1. Paste and run contents of [001_init.sql](file:///c:/Users/rblov/OneDrive/Desktop/creativeBriefContent/briefforge/supabase/migrations/001_init.sql)
2. Paste and run contents of [seed.sql](file:///c:/Users/rblov/OneDrive/Desktop/creativeBriefContent/briefforge/supabase/seed.sql)

### 2. Environment Variables Configuration
Configure environment keys in respective directories matching [env.example](file:///c:/Users/rblov/OneDrive/Desktop/creativeBriefContent/briefforge/.env.example):
- `backend/.env` with your Supabase keys and a custom JWT secret.

### 3. Running Locally
Run services using Docker:
```bash
docker compose up --build
```
Or start them individually:
- Backend: `npm run dev` inside `backend/`
- FastAPI: `uvicorn app.main:app --reload` inside `ai-service/`
- Frontend: `npm run dev` inside `frontend/`

---

## ✅ Integration Enhancements Included
1. **Zod & Postgres snake_case Alignment**: Translated camelCase React models (`clientId`, `createdAt`, `userId`) to snake_case (`client_id`, `created_at`, `user_id`) inside `api.ts` so PostgreSQL maps columns without errors.
2. **FastAPI JSON Coercion**: OutputCard renders structured variants like ad copy variants and creative campaign concepts safely instead of printing `[object Object]`.
3. **Advanced History Filtering**: Supported paginated list filters dynamically on backend `listBriefs` queries (page, search, tone, dates).
