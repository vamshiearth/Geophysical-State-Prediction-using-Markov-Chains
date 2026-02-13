# Geophysical State Prediction using Markov Chains

Security-first full-stack scaffold for geophysical forecasting modules:
- Django backend (`solar`, `drought`, `geomagnetic`, shared `markov_core`)
- React frontend routes/pages for each module
- Notebook area for experiments
- CI/CD with linting, tests, and security scanning

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
|-- scripts/
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

## CI and Security
Workflows included:
- `CI`:
  - `backend` (Django check, Ruff, Bandit, Pytest)
  - `frontend` (ESLint, Vitest, build)
  - `notebooks` (validate `.ipynb` files are clean)
- `Security Audit`:
  - `gitleaks`
  - `pip-audit`
  - `npm-audit`
- `Dependency Review` (PR only)
- `CodeQL` (`analyze` for Python and JavaScript)

Dependabot updates are enabled for:
- `pip` (`/backend`)
- `npm` (`/frontend`)
- GitHub Actions (`/`)

## Branch Ruleset Checklist (GitHub Settings)
For your `main` branch ruleset:

Enable:
- `Restrict deletions`
- `Block force pushes`
- `Require a pull request before merging`
- `Require status checks to pass`

Optional but recommended once team flow is stable:
- `Require linear history`
- `Require code scanning results`

Do not enable yet (until you set it up intentionally):
- `Require signed commits`
- `Require deployments to succeed`

When selecting required status checks, choose:
- `backend`
- `frontend`
- `notebooks`
- `dependency-review`
- `gitleaks`
- `pip-audit`
- `npm-audit`
- `analyze` (CodeQL)

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

### Notebook Validation
```powershell
python scripts/check_notebooks.py notebooks
```
