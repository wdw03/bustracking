# 🚀 BusTracker — Backend

Yeh folder BusTracker app ka complete backend contain karta hai.

---

## 📁 Structure

```
backend/
├── FULL_DATABASE_SETUP.sql     # ⚡ Single-file SQL (Supabase SQL Editor me 1-click run karne ke liye)
├── config.toml                 # Supabase local/CLI configuration
├── migrations/                 # 10 modular database migration files
│   ├── 001_extensions.sql      # PostGIS (geography) + uuid-ossp + pgcrypto
│   ├── 002_enums.sql           # user_role, school_status, trip_type, etc.
│   ├── 003_tables.sql          # All 18 production tables
│   ├── 004_indexes.sql         # Spatial GiST + B-tree indexes
│   ├── 005_functions.sql       # 15+ Security Definer SQL RPCs
│   ├── 006_triggers.sql        # Updated_at + auto-geometry triggers
│   ├── 007_rls.sql             # 25+ Row-Level Security policies
│   ├── 008_storage.sql         # Avatars, school logos, bus photos buckets
│   ├── 009_realtime.sql        # Supabase Realtime publication setup
│   └── 010_seed.sql            # Default subscription plans + test data
├── functions/                  # 6 Deno TypeScript Supabase Edge Functions
│   ├── admin-actions/          # Super admin school approvals & blocks
│   ├── bus-proximity/          # PostGIS 1km proximity cron/webhook detector
│   ├── google-play-webhook/    # In-App Purchase validation & webhook
│   ├── register-user/          # Parent & Driver registration with contact authorization
│   ├── send-notification/      # Expo & FCM Push notifications
│   └── subscription-check/     # Daily subscription expiry & auto-downgrade
├── scripts/                    # Testing & deployment automation scripts
│   └── test-backend.mjs        # End-to-end backend integration test suite
└── BACKEND_STRUCTURE.md        # Comprehensive backend documentation & architecture guide
```

---

## 🚀 Setup & Deployment Instructions

### 1. Database Setup (Supabase Dashboard)
1. Supabase Dashboard me jao: `https://supabase.com/dashboard/project/aqknhfzktrsyndlgfcpy`
2. Left menu me **SQL Editor** open karo.
3. [`FULL_DATABASE_SETUP.sql`](./FULL_DATABASE_SETUP.sql) ka content copy karke paste karo aur **Run** dabao.
   *(Ya fir `migrations/` folder ki files 001 se 010 tak ek-ek karke run karo)*

### 2. Edge Functions Deploy (CLI)
Supabase CLI install karke edge functions deploy karo:
```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref aqknhfzktrsyndlgfcpy

# Deploy all 6 Edge Functions
npx supabase functions deploy register-user
npx supabase functions deploy bus-proximity
npx supabase functions deploy send-notification
npx supabase functions deploy subscription-check
npx supabase functions deploy google-play-webhook
npx supabase functions deploy admin-actions
```

### 3. Edge Function Secrets Set Karna
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 4. Backend Test Suite Run Karna
```bash
node scripts/test-backend.mjs
```
