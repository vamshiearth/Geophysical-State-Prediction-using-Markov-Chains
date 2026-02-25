from __future__ import annotations

from datetime import UTC, datetime, timedelta
from io import StringIO

import requests
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

try:
    from timezonefinder import TimezoneFinder
except Exception:  # pragma: no cover - fallback when optional dep is missing
    TimezoneFinder = None

NASA_BASE_URL = "https://power.larc.nasa.gov/api/temporal"
PARAMETER = "ALLSKY_SFC_SW_DWN"
SOLAR_PARAMETERS = [
    "ALLSKY_SFC_SW_DWN",
    "ALLSKY_SFC_SW_DNI",
    "ALLSKY_SFC_SW_DIFF",
    "CLRSKY_SFC_SW_DWN",
]
PARAMETER_DESCRIPTIONS = {
    "ALLSKY_SFC_SW_DWN": "All Sky Surface Shortwave Downward Irradiance (global horizontal).",
    "ALLSKY_SFC_SW_DNI": "All Sky Direct Normal Irradiance.",
    "ALLSKY_SFC_SW_DIFF": "All Sky Diffuse Horizontal Irradiance.",
    "CLRSKY_SFC_SW_DWN": "Clear Sky Surface Shortwave Downward Irradiance.",
}
NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
TZ_FINDER = TimezoneFinder() if TimezoneFinder else None


def _format_ymd(dt: datetime) -> str:
    return dt.strftime("%Y%m%d")


def _parse_point_payload(data: dict) -> tuple[float, float, int] | tuple[None, None, None]:
    try:
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
        years = int(data.get("years", 5))
    except (TypeError, ValueError):
        return None, None, None

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None, None, None
    if not (1 <= years <= 20):
        return None, None, None

    return lat, lon, years


def _fetch_nasa_series(
    temporal: str, lat: float, lon: float, start: str, end: str, parameters: list[str]
) -> dict[str, dict[str, float]]:
    url = f"{NASA_BASE_URL}/{temporal}/point"
    params = {
        "parameters": ",".join(parameters),
        "community": "RE",
        "latitude": lat,
        "longitude": lon,
        "start": start,
        "end": end,
        "format": "JSON",
    }
    res = requests.get(url, params=params, timeout=30)
    res.raise_for_status()
    payload = res.json()
    return payload.get("properties", {}).get("parameter", {})


def _latest_valid(series: dict[str, float]) -> tuple[str | None, float | None]:
    items = [(k, float(v)) for k, v in sorted(series.items()) if float(v) != -999.0]
    if not items:
        return None, None
    return items[-1]


def _timezone_for_point(lat: float, lon: float) -> str:
    if TZ_FINDER is not None:
        tz_name = TZ_FINDER.timezone_at(lat=lat, lng=lon)
        if tz_name:
            return tz_name

    # Fallback if timezone library is unavailable.
    hour_offset = int(round(lon / 15.0))
    sign = "+" if hour_offset >= 0 else "-"
    return f"UTC{sign}{abs(hour_offset):02d}:00"


@api_view(["GET"])
def health(_request):
    return Response({"status": "ok", "service": "solar"})


@api_view(["POST"])
def summary(request):
    lat, lon, years = _parse_point_payload(request.data or {})
    if lat is None:
        return Response(
            {
                "error": "Invalid payload. Expected lat/lon plus optional years (1-20)."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    now_utc = datetime.now(tz=UTC)
    daily_end = now_utc - timedelta(days=1)
    daily_start = daily_end - timedelta(days=365 * years)
    hourly_end = now_utc
    hourly_start = now_utc - timedelta(hours=48)

    try:
        hourly_series_map = _fetch_nasa_series(
            "hourly", lat, lon, _format_ymd(hourly_start), _format_ymd(hourly_end), SOLAR_PARAMETERS
        )
        daily_series_map = _fetch_nasa_series(
            "daily", lat, lon, _format_ymd(daily_start), _format_ymd(daily_end), SOLAR_PARAMETERS
        )
    except requests.RequestException as exc:
        return Response(
            {"error": "Failed to fetch NASA POWER data.", "details": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    hourly_raw = hourly_series_map.get(PARAMETER, {})
    daily_raw = daily_series_map.get(PARAMETER, {})

    hourly_items = [(k, float(v)) for k, v in sorted(hourly_raw.items()) if float(v) != -999.0]
    daily_items = [(k, float(v)) for k, v in sorted(daily_raw.items()) if float(v) != -999.0]

    if len(daily_items) < 1:
        return Response(
            {"error": "Insufficient daily data at this location."},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    latest_hour_ts, latest_hour_val = hourly_items[-1] if hourly_items else (None, None)
    latest_day_ts, latest_day_val = daily_items[-1]
    parameter_details = {}
    for param in SOLAR_PARAMETERS:
        hour_ts, hour_val = _latest_valid(hourly_series_map.get(param, {}))
        day_ts, day_val = _latest_valid(daily_series_map.get(param, {}))
        parameter_details[param] = {
            "description": PARAMETER_DESCRIPTIONS.get(param, ""),
            "hourly": {"timestamp": hour_ts, "value": hour_val, "unit": "W/m^2"},
            "daily": {"date": day_ts, "value": day_val, "unit": "kWh/m^2/day"},
        }

    return Response(
        {
            "location": {"lat": lat, "lon": lon},
            "parameters_requested": SOLAR_PARAMETERS,
            "current_hour": {
                "timestamp": latest_hour_ts,
                "value": latest_hour_val,
                "unit": "W/m^2",
                "parameter": PARAMETER,
            },
            "latest_daily": {
                "date": latest_day_ts,
                "value": latest_day_val,
                "unit": "kWh/m^2/day",
                "parameter": PARAMETER,
            },
            "sample_size_days": int(len(daily_items)),
            "solar_parameters": parameter_details,
        }
    )


@api_view(["GET"])
def reverse_geocode(request):
    try:
        lat = float(request.query_params.get("lat"))
        lon = float(request.query_params.get("lon"))
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid query params. Expected lat and lon as numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return Response(
            {"error": "Latitude or longitude out of range."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        res = requests.get(
            NOMINATIM_URL,
            params={"format": "jsonv2", "lat": lat, "lon": lon},
            headers={"User-Agent": "geophysical-markov-app/1.0"},
            timeout=20,
        )
        res.raise_for_status()
        data = res.json()
    except requests.RequestException as exc:
        return Response(
            {"error": "Failed to reverse geocode location.", "details": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    address = data.get("address", {})
    location_name = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("hamlet")
        or address.get("county")
        or address.get("state")
        or "Selected location"
    )
    region = ", ".join(
        [value for value in [address.get("state"), address.get("country")] if value]
    ) or "Unknown region"

    return Response(
        {
            "location": {"lat": lat, "lon": lon},
            "place_name": location_name,
            "region": region,
            "timezone": _timezone_for_point(lat, lon),
        }
    )


@api_view(["GET"])
def geocode(request):
    query = (request.query_params.get("q") or "").strip()
    if len(query) < 2:
        return Response(
            {"error": "Invalid query. Provide q with at least 2 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        res = requests.get(
            NOMINATIM_SEARCH_URL,
            params={
                "format": "jsonv2",
                "q": query,
                "limit": 1,
                "addressdetails": 1,
            },
            headers={"User-Agent": "geophysical-markov-app/1.0"},
            timeout=20,
        )
        res.raise_for_status()
        items = res.json() or []
    except requests.RequestException as exc:
        return Response(
            {"error": "Failed to geocode location.", "details": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not items:
        return Response({"error": "No location found for query."}, status=status.HTTP_404_NOT_FOUND)

    first = items[0]
    try:
        lat = float(first.get("lat"))
        lon = float(first.get("lon"))
    except (TypeError, ValueError):
        return Response({"error": "Upstream geocoder returned invalid coordinates."}, status=status.HTTP_502_BAD_GATEWAY)

    address = first.get("address", {})
    place_name = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("hamlet")
        or address.get("county")
        or address.get("state")
        or first.get("display_name")
        or "Selected location"
    )
    region = ", ".join([value for value in [address.get("state"), address.get("country")] if value]) or "Unknown region"

    return Response(
        {
            "query": query,
            "location": {"lat": lat, "lon": lon},
            "place_name": place_name,
            "region": region,
            "timezone": _timezone_for_point(lat, lon),
        }
    )


@api_view(["GET"])
def download_csv(request):
    try:
        lat = float(request.query_params.get("lat"))
        lon = float(request.query_params.get("lon"))
        years = int(request.query_params.get("years", 5))
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid query params. Expected lat, lon and optional years."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return Response(
            {"error": "Latitude or longitude out of range."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not (1 <= years <= 20):
        return Response({"error": "years must be between 1 and 20."}, status=status.HTTP_400_BAD_REQUEST)

    now_utc = datetime.now(tz=UTC)
    daily_end = now_utc - timedelta(days=1)
    daily_start = daily_end - timedelta(days=365 * years)
    start_ymd = _format_ymd(daily_start)
    end_ymd = _format_ymd(daily_end)

    try:
        daily_series_map = _fetch_nasa_series("daily", lat, lon, start_ymd, end_ymd, SOLAR_PARAMETERS)
    except requests.RequestException as exc:
        return Response(
            {"error": "Failed to fetch NASA POWER data.", "details": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    primary_rows = [(k, float(v)) for k, v in sorted(daily_series_map.get(PARAMETER, {}).items()) if float(v) != -999.0]
    csv_buffer = StringIO()
    headers = ["date"] + [f"{param.lower()}_kwh_m2_day" for param in SOLAR_PARAMETERS]
    csv_buffer.write(",".join(headers) + "\n")
    for date_str, _ in primary_rows:
        values = [date_str]
        for param in SOLAR_PARAMETERS:
            raw = daily_series_map.get(param, {}).get(date_str, "")
            if raw in ("", None):
                values.append("")
                continue
            raw_float = float(raw)
            values.append("" if raw_float == -999.0 else f"{raw_float:.6f}")
        csv_buffer.write(",".join(values) + "\n")

    filename = f"solar-radiation-{lat:.4f}-{lon:.4f}-{start_ymd}-{end_ymd}.csv"
    response = HttpResponse(csv_buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
