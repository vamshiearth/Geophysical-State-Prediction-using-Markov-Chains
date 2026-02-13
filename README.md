# Geophysical State Prediction using Markov Chains

Full-stack scaffold for geophysical forecasting modules:
- Django backend (`solar`, `drought`, `geomagnetic`, shared `markov_core`)
- React frontend routes/pages for each module
- Notebook area for experiments
- CI with backend and frontend checks

## Project Structure
```text
.
|-- backend/
|   |-- config/
|   |-- solar/
|   |-- drought/
|   |-- geomagnetic/
|   |-- markov_core/
|   `-- tests/
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   `-- __tests__/
|-- notebooks/
`-- .github/workflows/
```

## Current Backend
- Django + DRF configured
- API root at `/`
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

## CI
Workflows included:
- `CI`:
  - `backend` (Django check, Ruff, Bandit, Pytest)
  - `frontend` (ESLint, Vitest, build)

## Branch Ruleset Checklist (GitHub Settings)
For your `main` branch ruleset:

Enable:
- `Restrict deletions`
- `Block force pushes`
- `Require a pull request before merging`
- `Require status checks to pass`

Optional:
- `Require linear history`

When selecting required status checks, choose:
- `backend`
- `frontend`

Note: If checks do not appear in the list yet, first push this branch and run each workflow at least once.

## Local Setup

### Backend (PowerShell)
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

### Frontend
```powershell
cd frontend
npm install
npm run lint
npm run test
npm run build
npm run dev
```
