# Geophysical State Prediction using Markov Chains

Full-stack project for geophysical forecasting modules:
- Solar radiation (Markov chain forecast from NASA POWER data)
- Drought (module scaffold)
- Geomagnetic storms (module scaffold)

Stack:
- Backend: Django + Django REST Framework
- Frontend: React + Vite + React Leaflet

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

## API Inventory

Base URL (local): `http://127.0.0.1:8000`

### Internal Backend APIs
- `GET /`
- `GET /api/solar/health/`
- `GET /api/drought/health/`
- `GET /api/geomagnetic/health/`
- `POST /api/solar/summary/`
- `GET /api/solar/reverse-geocode/?lat=<lat>&lon=<lon>`
- `GET /api/solar/download-csv/?lat=<lat>&lon=<lon>&years=<n>`

### External APIs / Services Used
- NASA POWER API:
  - `https://power.larc.nasa.gov/api/temporal/hourly/point`
  - `https://power.larc.nasa.gov/api/temporal/daily/point`
  - current parameter used in this project: `ALLSKY_SFC_SW_DWN`
- OpenStreetMap Nominatim reverse geocode:
  - `https://nominatim.openstreetmap.org/reverse`
- OpenStreetMap tiles in frontend:
  - `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- `timezonefinder` Python package (local lat/lon -> timezone)

## Solar APIs (Detailed)

### 1) `POST /api/solar/summary/`

Request:
```json
{
  "lat": 42.36,
  "lon": -71.06,
  "years": 5,
  "n_states": 3
}
```

Validation:
- `lat`: `[-90, 90]`
- `lon`: `[-180, 180]`
- `years`: `[1, 20]` (default `5`)
- `n_states`: `[2, 6]` (default `3`)

What backend does:
1. Fetches hourly solar data (~last 48h) from NASA POWER.
2. Fetches daily solar data (last `years`) from NASA POWER.
3. Filters missing values (`-999`).
4. Builds Markov states + transition matrix from daily series.
5. Computes tomorrow/day-7 probabilities and one-step accuracy.
6. Returns:
   - current hourly snapshot
   - latest daily value
   - model output

Response includes:
- `location`
- `current_hour`
- `latest_daily`
- `model`

Note:
- `current_hour.value` may be `null` when upstream hourly data is unavailable for the window.

### 2) `GET /api/solar/reverse-geocode/`

Query params:
- `lat` (required)
- `lon` (required)

Example:
```http
GET /api/solar/reverse-geocode/?lat=16.5168&lon=79.1367
```

Example response:
```json
{
  "location": { "lat": 16.5168, "lon": 79.1367 },
  "place_name": "Peda Adisharla Palli mandal",
  "region": "Telangana, India",
  "timezone": "Asia/Kolkata"
}
```

Timezone behavior:
- Computed from clicked coordinates using `timezonefinder`.
- Fallback format (if needed): `UTC±HH:00`.

### 3) `GET /api/solar/download-csv/`

Query params:
- `lat` (required)
- `lon` (required)
- `years` (optional, default `5`, valid `1..20`)

Example:
```http
GET /api/solar/download-csv/?lat=16.5168&lon=79.1367&years=5
```

Response:
- `Content-Type: text/csv`
- Downloaded file name:
  - `solar-radiation-<lat>-<lon>-<start>-<end>.csv`

CSV columns:
- `date`
- `allsky_sfc_sw_dwn_kwh_m2_day`

## Frontend Map Integration

Implemented in: `frontend/src/pages/MapPage.jsx`

Flow:
1. User clicks map point.
2. Frontend stores selected `lat/lon`.
3. Frontend calls:
   - `GET /api/solar/reverse-geocode/` (place/region/timezone)
   - `POST /api/solar/summary/` (solar data + model + full NASA JSON)
4. Side panel (`Solar Radiation Info`) displays:
   - key NASA solar fields
   - "Download 5-year CSV" button
5. "Open detail" passes location via query params.

Environment variable:
- `VITE_API_BASE_URL` (optional)
  - default used in frontend: `http://127.0.0.1:8000`

## Local Setup

### Backend (PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Quick API Tests

### Solar Summary
```powershell
curl -X POST http://127.0.0.1:8000/api/solar/summary/ ^
  -H "Content-Type: application/json" ^
  -d "{\"lat\":42.36,\"lon\":-71.06,\"years\":5,\"n_states\":3}"
```

### Reverse Geocode
```powershell
curl "http://127.0.0.1:8000/api/solar/reverse-geocode/?lat=16.5168&lon=79.1367"
```

### Download CSV
```powershell
curl -L "http://127.0.0.1:8000/api/solar/download-csv/?lat=16.5168&lon=79.1367&years=5" -o solar-data.csv
```

## CI

Workflow: `.github/workflows/ci.yml`
- Backend checks/tests
- Frontend lint/tests/build

## Branch Protection (Recommended)

For `main`:
- Require pull request before merging
- Require status checks to pass
- Block force pushes
- Restrict deletions
