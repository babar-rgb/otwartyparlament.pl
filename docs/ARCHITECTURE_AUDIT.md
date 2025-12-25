# ARCHITECTURE_AUDIT.md
## otwartyparlament.pl - Technical Audit

> Generated: 2025-12-25 | Architecture: PostgreSQL + PostgREST

---

## 1. Tech Stack

### Frontend
| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.5.3 |
| **Build Tool** | Vite | 5.4.2 |
| **Styling** | TailwindCSS | 3.4.1 |
| **State** | React Context | - |
| **Routing** | React Router | 7.9.5 |
| **Charts** | Recharts + Tremor + ReactFlow | - |
| **Icons** | Lucide React | 0.344.0 |
| **Animations** | Framer Motion | 12.23.24 |

### Backend (ETL)
| Category | Technology |
|----------|------------|
| **Language** | Python 3.11+ |
| **DB Driver** | psycopg2-binary |
| **HTTP** | requests + urllib3 |
| **Scheduler** | APScheduler |

### Database
| Category | Technology |
|----------|------------|
| **Database** | PostgreSQL 15+ |
| **API Layer** | PostgREST |
| **Security** | Row Level Security |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│   BROWSER (React SPA)                                            │
│   └── @supabase/supabase-js (as PostgREST client)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   PostgREST (localhost:3001)                                    │
│   └── Auto-generates REST API from PostgreSQL schema            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   PostgreSQL (otwarty_parlament)                                │
│   ├── mps, votes, vote_results                                  │
│   ├── speeches, interpellations                                 │
│   ├── euro_meps, euro_votes                                     │
│   └── processes (legislative)                                   │
└───────────────────────────▲─────────────────────────────────────┘
                            │ psycopg2 (direct SQL)
┌─────────────────────────────────────────────────────────────────┐
│   Python ETL Backend                                            │
│   ├── backend/etl/sejm.py → api.sejm.gov.pl                     │
│   ├── backend/etl/europarl.py → europarl.europa.eu              │
│   └── backend/services/scheduler.py (daily sync)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
parlament/
├── src/                  # Frontend (React)
│   ├── pages/            # 36 page components
│   ├── components/       # 42 reusable components
│   ├── hooks/            # 8 custom data hooks
│   ├── lib/supabase.ts   # PostgREST client
│   └── types/domain.ts   # TypeScript interfaces
│
├── backend/              # Python ETL
│   ├── core/             # config, db, logger
│   ├── etl/              # data pipelines
│   └── services/         # scheduler, ml
│
├── supabase/             # SQL migrations (40+ files)
├── postgrest.conf        # PostgREST configuration
└── .env.example          # Environment template
```

---

## 4. Environment Variables

```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=otwarty_parlament
POSTGRES_USER=postgres
POSTGRES_PASSWORD=***

# PostgREST (frontend)
VITE_POSTGREST_URL=http://localhost:3001
```

---

## 5. Running the System

```bash
# 1. Start PostgreSQL
pg_ctl start

# 2. Start PostgREST
postgrest postgrest.conf

# 3. Start Frontend (dev)
npm run dev

# 4. Run ETL (once)
python3 -m backend.etl.incremental
```

---

## 6. Gap Analysis

| Area | Status | Recommendation |
|------|--------|----------------|
| Testing | ❌ None | Add Vitest |
| CI/CD | ❌ None | GitHub Actions |
| Docker | ❌ None | Add Dockerfile |
| TypeScript strict | ⚠️ Off | Enable gradually |
| Error tracking | ⚠️ Console only | Add Sentry |
