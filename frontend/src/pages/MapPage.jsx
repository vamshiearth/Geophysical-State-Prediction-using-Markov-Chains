import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { Bookmark, ChevronLeft, ChevronUp, FileText, Grid2x2, Info, MapPin, Share2, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const SOLAR_BASEMAP_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const SOLAR_BASEMAP_ATTRIBUTION =
  '&copy; Esri, HERE, Garmin, Intermap, increment P Corp, GEBCO, USGS';

function normalizeLongitude(lon) {
  let normalized = lon;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function ClickMarker({ position, onPick }) {
  const markerIcon = useMemo(
    () =>
      divIcon({
        className: "atlas-map-pin-icon",
        html: renderToStaticMarkup(<MapPin size={30} strokeWidth={2.3} />),
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    [],
  );

  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, normalizeLongitude(event.latlng.lng)]);
    },
  });

  return <Marker position={position} icon={markerIcon} />;
}

function SearchFlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const lat = Number(target.lat);
    const lon = Number(target.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;

    const startZoom = map.getZoom();
    const firstZoom = Math.max(2, Math.min(4, startZoom - 1));
    map.flyTo([lat, lon], firstZoom, { animate: true, duration: 0.7, easeLinearity: 0.25 });

    const timer = window.setTimeout(() => {
      map.flyTo([lat, lon], 7, { animate: true, duration: 1.2, easeLinearity: 0.2 });
    }, 360);

    return () => window.clearTimeout(timer);
  }, [map, target]);

  return null;
}

function formatNasaDate(value) {
  if (!value || typeof value !== "string") return "-";
  if (value.length === 8) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  if (value.length === 10) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(8, 10)}:00`;
  }
  return value;
}

function formatMonthYearCompact(value) {
  if (!value || typeof value !== "string") return "";
  const cleaned = value.trim();
  let year = "";
  let monthNum = 0;

  if (/^\d{8}$/.test(cleaned)) {
    year = cleaned.slice(0, 4);
    monthNum = Number(cleaned.slice(4, 6));
  } else if (/^\d{10}$/.test(cleaned)) {
    year = cleaned.slice(0, 4);
    monthNum = Number(cleaned.slice(4, 6));
  } else {
    const date = new Date(cleaned);
    if (Number.isNaN(date.getTime())) return cleaned;
    year = String(date.getFullYear());
    monthNum = date.getMonth() + 1;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[Math.max(1, Math.min(12, monthNum)) - 1];
  return `${month}${year}`;
}

function formatNasaValue(value, unit) {
  if (value === null || value === undefined) return "Not available";
  return `${Number(value).toFixed(3)} ${unit}`;
}

function SolarRadiationInfoTable({ summary, loading, error, lat, lon }) {
  const [collapsed, setCollapsed] = useState(false);
  const parameter = summary?.current_hour?.parameter || summary?.latest_daily?.parameter || "-";
  const csvUrl = `${API_BASE}/api/solar/download-csv/?lat=${lat}&lon=${lon}&years=5`;
  const parameterRows = Object.entries(summary?.solar_parameters || {}).flatMap(([code, details]) => [
    [
      `${code} latest daily`,
      formatNasaValue(details?.daily?.value, details?.daily?.unit || "kWh/m^2/day"),
      details?.description || "NASA POWER solar parameter.",
    ],
    [
      `${code} latest hourly`,
      formatNasaValue(details?.hourly?.value, details?.hourly?.unit || "W/m^2"),
      details?.description || "NASA POWER solar parameter.",
    ],
  ]);
  const rows = [
    ["Source", "NASA POWER", "Data provider: NASA Prediction Of Worldwide Energy Resources (POWER)."],
    ["Primary model parameter", parameter, "Parameter currently used for Markov-chain state modeling."],
    [
      "Parameters requested",
      (summary?.parameters_requested || []).join(", ") || parameter,
      "NASA POWER parameter codes requested in this API call.",
    ],
    [
      "Current hour timestamp",
      formatNasaDate(summary?.current_hour?.timestamp),
      "Latest available hourly timestamp from NASA POWER for the selected location.",
    ],
    [
      "Current hour radiation",
      formatNasaValue(summary?.current_hour?.value, summary?.current_hour?.unit || "W/m^2"),
      "Hourly shortwave irradiance value at surface under all-sky conditions.",
    ],
    [
      "Current hour unit",
      summary?.current_hour?.unit || "W/m^2",
      "Unit for hourly irradiance (Watts per square meter).",
    ],
    [
      "Latest daily date",
      formatNasaDate(summary?.latest_daily?.date),
      "Latest available daily record date from NASA POWER.",
    ],
    [
      "Latest daily radiation",
      formatNasaValue(summary?.latest_daily?.value, summary?.latest_daily?.unit || "kWh/m^2/day"),
      "Daily integrated solar radiation (energy per area per day).",
    ],
    [
      "Latest daily unit",
      summary?.latest_daily?.unit || "kWh/m^2/day",
      "Unit for daily radiation (kilowatt-hours per square meter per day).",
    ],
    ...parameterRows,
  ];

  return (
    <section className="atlas-card">
      <div className="atlas-card__head">
        <h3>SOLAR RADIATION INFO</h3>
        <button
          type="button"
          className="atlas-card__chevron"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
        >
          <ChevronUp
            size={18}
            className={collapsed ? "atlas-card__chevron-icon atlas-card__chevron-icon--down" : "atlas-card__chevron-icon"}
          />
        </button>
      </div>
      <div className={`atlas-card__body ${collapsed ? "atlas-card__body--collapsed" : ""}`}>
        {loading || error ? (
          <div className="atlas-status atlas-status--loading" role="status" aria-label="Buffering">
            <span className="atlas-spinner" aria-hidden="true" />
          </div>
        ) : null}
        {!loading && !error ? (
          <>
            <a href={csvUrl} className="atlas-download-csv">
              Download 5-year CSV
            </a>

            <div className="atlas-table atlas-table--two-col">
              {rows.map(([label, value, description]) => (
                <div key={label} className="atlas-row atlas-row--two-col">
                  <div className="atlas-row__name atlas-row__name--with-help">
                    <span>{label}</span>
                    <span className="atlas-help" title={description} aria-label={description}>
                      <Info size={14} />
                    </span>
                  </div>
                  <div className="atlas-row__value">{value}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function ModuleInfoCard({ title, status, description, bullets }) {
  return (
    <section className="atlas-card">
      <div className="atlas-card__head">
        <h3>{title}</h3>
      </div>
      <div className="atlas-module-info">
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>{description}</p>
        <ul>
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function parseSolarCsv(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  const primaryColIndex = headers.findIndex((h) => h === "allsky_sfc_sw_dwn_kwh_m2_day");
  if (primaryColIndex === -1) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    const date = cols[0];
    const value = Number(cols[primaryColIndex]);
    if (!Number.isNaN(value)) {
      rows.push({ date, value });
    }
  }
  return rows;
}

function SolarSeriesChart({ data }) {
  if (!data.length) {
    return <div className="atlas-placeholder-map">No chart data available.</div>;
  }

  const width = 980;
  const height = 380;
  const padLeft = 66;
  const padRight = 42;
  const padTop = 18;
  const padBottom = 70;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1e-6);
  const yMin = Math.max(0, min - spread * 0.05);
  const yMax = max + spread * 0.05;
  const ySpread = Math.max(yMax - yMin, 1e-6);
  const stepX = (width - padLeft - padRight) / Math.max(data.length - 1, 1);
  const toX = (idx) => padLeft + idx * stepX;
  const toY = (val) => padTop + ((yMax - val) / ySpread) * (height - padTop - padBottom);

  const window = Math.min(data.length, 182);
  const trendValues = values.map((_, idx) => {
    const start = Math.max(0, idx - Math.floor(window / 2));
    const end = Math.min(values.length, idx + Math.floor(window / 2) + 1);
    const slice = values.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const trendPointPairs = trendValues.map((v, idx) => [toX(idx), toY(v)]);
  const trendPath = buildSmoothPath(trendPointPairs);
  const yTicks = 6;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);
  const extrema = [];
  const minGap = Math.max(1, Math.floor(trendValues.length / 10));
  let lastIdx = -minGap;
  for (let i = 1; i < trendValues.length - 1; i += 1) {
    const prev = trendValues[i - 1];
    const curr = trendValues[i];
    const next = trendValues[i + 1];
    const isPeak = curr > prev && curr >= next;
    const isValley = curr < prev && curr <= next;
    if ((isPeak || isValley) && i - lastIdx >= minGap) {
      extrema.push({ idx: i, value: curr, type: isPeak ? "peak" : "low" });
      lastIdx = i;
    }
  }
  const refineWindow = Math.max(3, Math.floor(trendValues.length / 60));
  const refinedExtrema = extrema.map((point) => {
    const start = Math.max(0, point.idx - refineWindow);
    const end = Math.min(trendValues.length - 1, point.idx + refineWindow);
    let bestIdx = point.idx;
    let bestVal = trendValues[point.idx];
    for (let i = start; i <= end; i += 1) {
      const v = trendValues[i];
      if (point.type === "peak" ? v > bestVal : v < bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    }
    return { ...point, idx: bestIdx, value: bestVal };
  });

  return (
    <div className="atlas-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="atlas-chart" role="img" aria-label="5-year solar radiation chart">
        <rect x="0" y="0" width={width} height={height} fill="#f8fbff" />
        {yTickValues.map((tick) => {
          const y = toY(tick);
          return (
            <line
              key={`y-${tick}`}
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#dee7f0"
              strokeWidth="1"
            />
          );
        })}
        <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#cddbea" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#cddbea" />
        <path fill="none" stroke="#2d8ed4" strokeWidth="2.7" d={trendPath} />
        {yTickValues.map((tick) => (
          <text
            key={`y-lbl-${tick}`}
            x={padLeft - 8}
            y={toY(tick) + 4}
            fill="#5b7793"
            fontSize="11.5"
            textAnchor="end"
          >
            {tick.toFixed(1)}
          </text>
        ))}
        {refinedExtrema.map((point) => {
          const x = toX(point.idx);
          const y = toY(point.value);
          const dy = point.type === "peak" ? -10 : 16;
          const label = point.value.toFixed(1);
          const dateLabel = formatMonthYearCompact(data[point.idx]?.date || "");
          return (
            <g key={`ext-${point.idx}`}>
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={height - padBottom}
                stroke="#1f1f1f"
                strokeWidth="1.4"
                strokeDasharray="4 4"
                opacity="0.9"
              />
              <circle cx={x} cy={y} r="2.8" fill="#1e7fcc" />
              <text x={x} y={y + dy} fill="#2f5f89" fontSize="10.5" fontWeight="600" textAnchor="middle">
                {label}
              </text>
              <text x={x} y={height - padBottom + 22} fill="#4f6f8f" fontSize="10.8" textAnchor="middle">
                {dateLabel}
              </text>
            </g>
          );
        })}
        <text x={width / 2 - 20} y={height - 12} fill="#355a7e" fontSize="13.5" fontWeight="600">
          Date
        </text>
        <text
          transform={`translate(20 ${height / 2 + 18}) rotate(-90)`}
          fill="#355a7e"
          fontSize="13.5"
          fontWeight="600"
        >
          Radiation (kWh/m^2/day)
        </text>
        <text x={padLeft} y={padTop - 4} fill="#2d6fa8" fontSize="12.5" fontWeight="700">
          Date vs Radiation (kWh/m^2/day)
        </text>
      </svg>
    </div>
  );
}

function buildSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function encodeLocationSearch({ lat, lon, place, region, timezone }) {
  const params = new URLSearchParams();
  params.set("lat", lat.toFixed(6));
  params.set("lon", lon.toFixed(6));
  params.set("place", place);
  params.set("region", region);
  params.set("timezone", timezone);
  return `?${params.toString()}`;
}

const NASA_SOLAR_PARAMETERS = [
  ["ALLSKY_SFC_SW_DWN", "All-sky global horizontal irradiance (GHI)."],
  ["ALLSKY_SFC_SW_DNI", "All-sky direct normal irradiance (DNI)."],
  ["ALLSKY_SFC_SW_DIFF", "All-sky diffuse horizontal irradiance (DHI)."],
  ["CLRSKY_SFC_SW_DWN", "Clear-sky global horizontal irradiance."],
  ["CLRSKY_SFC_SW_DNI", "Clear-sky direct normal irradiance."],
  ["CLRSKY_SFC_SW_DIFF", "Clear-sky diffuse horizontal irradiance."],
  ["ALLSKY_KT", "All-sky clearness index."],
  ["ALLSKY_NKT", "All-sky normalized clearness index."],
];

export default function MapPage() {
  const worldBounds = useMemo(
    () => [
      [-85, -180],
      [85, 180],
    ],
    [],
  );

  const [searchParams] = useSearchParams();
  const geocodeQuery = (searchParams.get("q") || "").trim();
  const lastGeocodeQueryRef = useRef("");
  const [position, setPosition] = useState([16.5168, 79.1367]);
  const [searchFlyTarget, setSearchFlyTarget] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [placeName, setPlaceName] = useState("Loading...");
  const [regionLabel, setRegionLabel] = useState("Locating...");
  const [timezoneLabel, setTimezoneLabel] = useState("-");
  const [nasaSummary, setNasaSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    const [lat, lon] = position;
    const controller = new AbortController();

    async function reverseGeocode() {
      try {
        const response = await fetch(
          `${API_BASE}/api/solar/reverse-geocode/?lat=${lat}&lon=${lon}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("reverse geocode request failed");
        }
        const data = await response.json();
        setPlaceName(data.place_name || "Selected location");
        setRegionLabel(data.region || "Unknown region");
        setTimezoneLabel(data.timezone || "-");
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setPlaceName("Selected location");
        setRegionLabel("Unknown region");
        setTimezoneLabel("-");
      }
    }

    async function fetchSummary() {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const response = await fetch(`${API_BASE}/api/solar/summary/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon, years: 5, n_states: 3 }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("summary request failed");
        }
        const data = await response.json();
        if (controller.signal.aborted) return;
        setNasaSummary(data);
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setSummaryError("buffering");
      } finally {
        if (controller.signal.aborted) return;
        setSummaryLoading(false);
      }
    }

    reverseGeocode();
    fetchSummary();

    return () => controller.abort();
  }, [position]);

  useEffect(() => {
    if (!geocodeQuery || geocodeQuery === lastGeocodeQueryRef.current) return;
    const controller = new AbortController();

    async function geocodeSearch() {
      try {
        const response = await fetch(
          `${API_BASE}/api/solar/geocode/?q=${encodeURIComponent(geocodeQuery)}`,
          { signal: controller.signal },
        );
        if (response.ok) {
          const data = await response.json();
          const lat = Number(data?.location?.lat);
          const lon = Number(data?.location?.lon);
          if (Number.isNaN(lat) || Number.isNaN(lon)) return;
          if (controller.signal.aborted) return;
          setPosition([lat, normalizeLongitude(lon)]);
          setSearchFlyTarget({ lat, lon: normalizeLongitude(lon), key: Date.now() });
          setPanelOpen(true);
          lastGeocodeQueryRef.current = geocodeQuery;
          return;
        }

        // Compatibility fallback: use ArcGIS geocoder when backend geocode endpoint is not available yet.
        if (response.status === 404) {
          const fallback = await fetch(
            `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=pjson&singleLine=${encodeURIComponent(
              geocodeQuery,
            )}&maxLocations=1`,
            { signal: controller.signal },
          );
          if (!fallback.ok) return;
          const payload = await fallback.json();
          const first = payload?.candidates?.[0];
          const lat = Number(first?.location?.y);
          const lon = Number(first?.location?.x);
          if (Number.isNaN(lat) || Number.isNaN(lon)) return;
          if (controller.signal.aborted) return;
          setPosition([lat, normalizeLongitude(lon)]);
          setSearchFlyTarget({ lat, lon: normalizeLongitude(lon), key: Date.now() });
          setPanelOpen(true);
          lastGeocodeQueryRef.current = geocodeQuery;
          return;
        }
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
      }
    }

    geocodeSearch();
    return () => controller.abort();
  }, [geocodeQuery]);

  const detailSearch = useMemo(
    () =>
      encodeLocationSearch({
        lat: position[0],
        lon: position[1],
        place: placeName,
        region: regionLabel,
        timezone: timezoneLabel,
      }),
    [placeName, position, regionLabel, timezoneLabel],
  );

  return (
    <main className="atlas-page">
      <section className={`atlas-main ${panelOpen ? "atlas-main--open" : "atlas-main--collapsed"}`}>
        <div className="atlas-map-shell">
          <MapContainer
            center={position}
            zoom={3}
            minZoom={3}
            maxBounds={worldBounds}
            maxBoundsViscosity={1.0}
            worldCopyJump={false}
            className="atlas-map"
          >
            <TileLayer url={SOLAR_BASEMAP_URL} attribution={SOLAR_BASEMAP_ATTRIBUTION} noWrap />
            <SearchFlyTo target={searchFlyTarget} />
            <ClickMarker position={position} onPick={setPosition} />
          </MapContainer>
        </div>

        <aside className={`atlas-side ${panelOpen ? "atlas-side--open" : "atlas-side--closed"}`}>
          <button
            type="button"
            className={`atlas-panel-slide atlas-panel-slide--left${
              panelOpen ? " atlas-panel-slide--close" : ""
            }`}
            onClick={() => setPanelOpen((open) => !open)}
            aria-label={panelOpen ? "Collapse side panel" : "Expand side panel"}
          >
            {panelOpen ? (
              <X size={18} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
            )}
          </button>

          <div className="atlas-side-content">
            <div className="atlas-location">
              <h2>{placeName}</h2>
              <p>
                {position[0].toFixed(6)} deg, {position[1].toFixed(6)} deg
              </p>
              <p>{regionLabel}</p>
              <p className="atlas-location__meta">Time zone: {timezoneLabel}</p>
            </div>

            <div className="atlas-actions">
              <Link to={`/map/detail${detailSearch}`} className="atlas-action-link">
                <Grid2x2 size={24} />
                <span>Open detail</span>
              </Link>
              <button type="button" className="atlas-action-link">
                <Bookmark size={24} />
                <span>Bookmark</span>
              </button>
              <button type="button" className="atlas-action-link">
                <Share2 size={24} />
                <span>Share</span>
              </button>
              <button type="button" className="atlas-action-link">
                <FileText size={24} />
                <span>Reports</span>
              </button>
            </div>

            <SolarRadiationInfoTable
              summary={nasaSummary}
              loading={summaryLoading}
              error={summaryError}
              lat={position[0]}
              lon={position[1]}
            />

            <ModuleInfoCard
              title="DROUGHT INFO"
              status="Coming soon"
              description="Drought module UI and data integration are under active development."
              bullets={[
                "State definitions and drought indicators will be added.",
                "Map-based forecast cards will appear here.",
              ]}
            />

            <ModuleInfoCard
              title="GEOMAGNETIC INFO"
              status="Coming soon"
              description="Geomagnetic storms module is being prepared for full integration."
              bullets={[
                "Space weather feeds and alerts will be connected.",
                "Probability outputs will be shown in this panel.",
              ]}
            />

            <Link to={`/map/detail${detailSearch}`} className="atlas-open-detail">
              Open detail
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

export function MapDetailPage() {
  const worldBounds = useMemo(
    () => [
      [-85, -180],
      [85, 180],
    ],
    [],
  );
  const [searchParams] = useSearchParams();
  const lat = searchParams.get("lat") ?? "-";
  const lon = searchParams.get("lon") ?? "-";
  const place = searchParams.get("place") ?? "Selected location";
  const region = searchParams.get("region") ?? "Unknown region";
  const timezone = searchParams.get("timezone") ?? "-";
  const latNum = Number(lat);
  const lonNum = Number(lon);
  const hasPoint = !Number.isNaN(latNum) && !Number.isNaN(lonNum);
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState("");

  useEffect(() => {
    if (!hasPoint) return;
    const controller = new AbortController();

    async function fetchSeries() {
      setSeriesLoading(true);
      setSeriesError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/solar/download-csv/?lat=${latNum}&lon=${lonNum}&years=5`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("csv download failed");
        const csvText = await res.text();
        if (controller.signal.aborted) return;
        setSeries(parseSolarCsv(csvText));
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setSeriesError("buffering");
      } finally {
        if (controller.signal.aborted) return;
        setSeriesLoading(false);
      }
    }

    fetchSeries();
    return () => controller.abort();
  }, [hasPoint, latNum, lonNum]);

  return (
    <main className="atlas-detail-page">
      <section className="atlas-detail-grid atlas-detail-grid--single">
        <div className="atlas-detail-split">
          <section className="atlas-card">
            <div className="atlas-card__head">
              <h3>Open Detail Info</h3>
            </div>
            <div className="atlas-module-info">
              <p>
                <strong>{place}</strong>
              </p>
              <p>
                {lat} deg, {lon} deg
              </p>
              <p>{region}</p>
              <p>Time zone: {timezone}</p>
            </div>
          </section>

          <section className="atlas-card">
            <div className="atlas-card__head">
              <h3>Selected Point Map Preview</h3>
            </div>
            <div className="atlas-detail-preview">
              {hasPoint ? (
                <MapContainer
                  center={[latNum, lonNum]}
                  zoom={6}
                  minZoom={3}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  touchZoom={false}
                  doubleClickZoom={false}
                  boxZoom={false}
                  keyboard={false}
                  maxBounds={worldBounds}
                  maxBoundsViscosity={1.0}
                  worldCopyJump={false}
                  className="atlas-preview-map"
                >
                  <TileLayer url={SOLAR_BASEMAP_URL} attribution={SOLAR_BASEMAP_ATTRIBUTION} noWrap />
                  <CircleMarker
                    center={[latNum, lonNum]}
                    radius={8}
                    pathOptions={{ color: "#1f84cf", weight: 3, fillColor: "#58b7ff", fillOpacity: 0.7 }}
                  />
                </MapContainer>
              ) : (
                <div className="atlas-placeholder-map">Invalid location.</div>
              )}
            </div>
          </section>
        </div>

        <section className="atlas-card">
          <div className="atlas-card__head">
            <h3>5-Year Solar Radiation Trend</h3>
          </div>
          {seriesLoading || seriesError ? (
            <div className="atlas-status atlas-status--loading" role="status" aria-label="Buffering">
              <span className="atlas-spinner" aria-hidden="true" />
            </div>
          ) : null}
          {!seriesLoading && !seriesError ? <SolarSeriesChart data={series} /> : null}
        </section>
      </section>
    </main>
  );
}


