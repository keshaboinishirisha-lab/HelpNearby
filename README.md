# GiveNearby
> **Donate Anything. Help Someone Nearby.**  
> *Don’t just donate nearby. Donate where it’s needed most.*

GiveNearby is a location-aware, need-prioritized community donation and resource-sharing platform that intelligently matches available resources with nearby verified requests while guaranteeing zero-leak location privacy and safe, transparent handovers.

---

## 1. Architectural Blueprint & Boundaries

```
[ Web Browser ]
      │
      ▼ (HTTPS / JSON API)
[ Next.js 14 App Router + TypeScript + Tailwind CSS ]
  ├── Public: Landing, About, How It Works, Browse Donations, Browse Needs
  ├── Authenticated: Dashboard, Create Donation (AI Assist), Create Request, Match Explorer
  ├── Safe Handover Portal: OTP Exchange, Verification Handshake, Meeting Spot Finder
  └── Portals: Volunteer Operations, NGO Community Hub, Admin Moderation
      │
      ▼ (Bearer JWT Authorization)
[ Python FastAPI Authoritative Backend ]
  ├── Matching Engine: Multi-factor explainable need-prioritized matcher (0–100)
  ├── Need Scorer: Objective need prioritization without discriminatory bias
  ├── Trust Scorer: Separated community trust metrics (0–100)
  ├── Geospatial Privacy Service: Deterministic neighborhood centroid fuzzing (~1.2 km grid)
  ├── Handover & Cryptographic OTP Service: 6-digit one-time code verification
  ├── Assistive AI Service: Semantic category and condition suggestion
  └── Social Impact Aggregator: Defensible waste diverted and food rescued calculations
      │
      ▼ (SQLAlchemy / psycopg2 / PostGIS)
[ Supabase PostgreSQL + PostGIS Database ]
  ├── PostGIS Spatial Geometry (Point, 4326) with GiST Spatial Indexes
  ├── Foreign Keys, Cascade Deletes, and Check Constraints
  ├── Row Level Security (RLS) Policies
  └── Normalized Relational Entities
```

---

## 2. Core Differentiators

### A. Need-Prioritized Geospatial Matching Engine
Unlike passive classified boards where the fastest scroller takes all items regardless of urgency, GiveNearby actively ranks potential matches using an explainable formula:

$$\text{Match Score} = (\text{Category} \times 0.25) + (\text{Distance} \times 0.25) + (\text{Need Priority} \times 0.25) + (\text{Trust} \times 0.15) + (\text{Availability} \times 0.10)$$

Every match outputs **human-readable rationale bullets**, e.g.:
- `✓ Exact Category match in Educational Materials & Books`
- `✓ Hyperlocal: 1.4 km away (within 10 km radius)`
- `✓ Urgent community need (Priority Score: 88/100)`
- `✓ Verified community members (94/100 trust)`

### B. Zero-Leak Location Privacy
- **Public Listings**: Precise home GPS coordinates and street addresses are **never** rendered publicly. The system uses deterministic geohash/grid fuzzing to output an approximate neighborhood centroid (~1.2 km grid).
- **Exact Address Release**: Exact meeting locations are encrypted and revealed **strictly after both parties mutually confirm a match**.
- **Safe Public Meeting Spot Finder**: Proactively suggests public, monitored handover locations (civic centers, community libraries, transit plazas).

### C. Cryptographic Safe Handover (OTP Code Handshake)
- When a match is mutually accepted, the system issues a **6-digit cryptographic OTP** visible **only to the recipient**.
- At the meeting point, the recipient presents the code to the donor.
- The donor inputs the code into the GiveNearby Safe Handover Portal.
- Verification confirms delivery, increases both users' trust scores (+2.5 pts), triggers social impact metric increments, and prompts community feedback.

### D. Defensible Environmental Impact Metrics
GiveNearby adheres to a strict scientific standard: **we never invent impact numbers**. All environmental savings are derived from verified item weight averages per category:
- Educational Materials: $2.5\text{ kg}$ avg. paper/cardboard diverted from municipal landfills.
- Packaged Food: $100\%$ of verified weight recorded as organic food rescue.
- Household Goods & Electronics: $2.0 - 4.5\text{ kg}$ hardware landfill prevention.

---

## 3. Technology Stack

- **Frontend**: Next.js 14.2 (App Router), React 18, TypeScript 5, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI 0.141, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PyJWT, direct Bcrypt, HTTPX, Pillow, Numpy.
- **Database**: Supabase PostgreSQL + PostGIS (with SQLite fallback for zero-dependency standalone execution).
- **Testing**: Pytest 9.1, FastApi TestClient.

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js `v18+` (Tested on `v24.19.0`)
- Python `3.10+`

### 1. Backend Setup & Run
```bash
# Navigate to project root
cd c:\Users\user\OneDrive\Desktop\project.2

# Populate database with rich realistic seed data (categories, users, donations, urgent requests)
python -m backend.seed

# Run the backend test suite
python -m pytest backend/tests/ -v

# Start FastAPI backend server (Runs on http://127.0.0.1:8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation available at:
- Swagger UI: `http://127.0.0.1:8000/api/docs`
- ReDoc: `http://127.0.0.1:8000/api/redoc`

### 2. Frontend Setup & Run
```bash
# Navigate to frontend
cd frontend

# Install dependencies (already prepared)
npm install

# Run production build validation
npm run build

# Start Next.js development server (Runs on http://localhost:3000)
npm run dev
```

---

## 5. Seeded Demo Accounts (1-Click Switcher Available on Login)

| Role | Email | Password | Primary Mission |
|---|---|---|---|
| **Donor** | `donor@givenearby.org` | `Password123!` | Donates textbooks, packaged food, laptops |
| **Requester** | `requester@givenearby.org` | `Password123!` | Urgent need for 8th grade textbooks |
| **Volunteer** | `volunteer@givenearby.org` | `Password123!` | Community courier for deliveries |
| **NGO / Shelter** | `ngo@givenearby.org` | `Password123!` | Bulk weekend food pantry distribution |
| **Platform Admin**| `admin@givenearby.org` | `AdminSecurePassword2026!`| Platform moderation & governance |

---

## 6. Verification & Test Evidence

All 10 automated test suites pass cleanly:
```
backend/tests/test_advanced_workflows.py::test_rbac_and_admin_security PASSED
backend/tests/test_advanced_workflows.py::test_report_and_moderation PASSED
backend/tests/test_advanced_workflows.py::test_volunteer_workflow PASSED
backend/tests/test_advanced_workflows.py::test_safe_points_recommendation PASSED
backend/tests/test_api.py::test_health_endpoint PASSED
backend/tests/test_api.py::test_geospatial_distance_and_privacy PASSED
backend/tests/test_api.py::test_need_priority_scoring PASSED
backend/tests/test_api.py::test_trust_scoring PASSED
backend/tests/test_api.py::test_ai_assisted_categorization PASSED
backend/tests/test_api.py::test_full_critical_donation_to_handover_workflow PASSED
======================== 10 passed in 7.61s ========================
```

Frontend production build output:
```
✓ Compiled successfully
✓ Checking validity of types
✓ Generating static pages (22/22)
Finalizing page optimization ...
Route (app)                              Size     First Load JS
┌ ○ /                                    9.4 kB          105 kB
├ ○ /about                               188 B          95.4 kB
├ ○ /admin                               6.67 kB        93.9 kB
├ ○ /browse/donations                    2.99 kB         102 kB
├ ○ /browse/requests                     2.34 kB         101 kB
├ ○ /dashboard                           3.96 kB         104 kB
├ ƒ /donations/[id]                      5.65 kB         101 kB
├ ○ /donations/create                    8.03 kB        95.2 kB
├ ○ /donations/my                        4.66 kB        99.8 kB
├ ƒ /handover/[id]                       7.23 kB         102 kB
├ ○ /how-it-works                        188 B          95.4 kB
├ ○ /impact                              6.33 kB        93.5 kB
├ ○ /login                               4.94 kB         100 kB
├ ○ /matches                             1.84 kB         102 kB
├ ƒ /matches/[id]                        6.06 kB         101 kB
├ ○ /ngo                                 4.86 kB         100 kB
├ ○ /notifications                       5.5 kB         92.7 kB
├ ƒ /ratings/[id]                        5.26 kB         100 kB
├ ○ /register                            5.81 kB         101 kB
├ ƒ /requests/[id]                       5.35 kB         101 kB
├ ○ /requests/create                     7.42 kB        94.6 kB
├ ○ /requests/my                         4.57 kB        99.8 kB
└ ○ /volunteer                           5.14 kB         100 kB
```
