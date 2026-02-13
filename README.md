# Markov Chain Modeling for Geophysical Time-Series Prediction

Security-first full-stack scaffold for geophysical forecasting modules with:
- Django backend (`solar`, `drought`, `geomagnetic`, shared `markov_core`)
- React frontend routes/pages for each module
- CI/CD with linting, tests, and security scanning

## Project Structure
```text
.
├─ backend/
│  ├─ config/
│  ├─ solar/
│  ├─ drought/
│  ├─ geomagnetic/
│  ├─ markov_core/
│  └─ tests/
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  └─ __tests__/
│  └─ ...
└─ .github/workflows/
```

## Current Backend
- Django + DRF configured
- API root at `/` (DRF response)
- DRF auth pages at `/api-auth/`
- Health endpoints:
  - `/api/solar/health/`
  - `/api/drought/health/`
  - `/api/geomagnetic/health/`

## Current Frontend
- React + Vite scaffold
- Routes:
  - `/solar`
  - `/drought`
  - `/geomagnetic`
- Matte dark UI theme with top navigation
- Lightweight module page headers/subtitles (no feature data widgets yet)

## CI / Security
GitHub Actions pipeline includes:
- Dependency Review (PR only)
- Gitleaks (secret scanning)
- CodeQL + Bandit (SAST)
- pip-audit + npm audit (dependency vulnerability checks)
- Ruff + ESLint
- Pytest + Vitest
- Hardened runner permissions

Dependabot configured for:
- `pip` (backend)
- `npm` (frontend)
- GitHub Actions

## Local Setup

### Backend (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
python manage.py migrate
ruff check .
pytest
python manage.py runserver
```

Backend URLs:
- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/api/solar/health/`
- `http://127.0.0.1:8000/api/drought/health/`
- `http://127.0.0.1:8000/api/geomagnetic/health/`

### Frontend
```powershell
cd frontend
npm install
npm run lint
npx vitest run
npm run build
npm run dev
```

Default dev URL:
- `http://127.0.0.1:5173/`

## Notes
- This repository currently focuses on robust scaffolding and secure CI/CD.
- Feature work (map integration, NASA POWER ingestion, Markov model training/inference) is planned for follow-up PRs.
