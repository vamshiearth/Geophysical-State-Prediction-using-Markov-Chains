import { useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import SolarRadiationPage from "./pages/SolarPage";
import DroughtPage from "./pages/DroughtPage";
import GeomagneticPage from "./pages/GeomagneticPage";
import HomePage from "./pages/HomePage";
import MapPage, { MapDetailPage } from "./pages/MapPage";
import "./App.css";

function AboutPage() {
  const sections = useMemo(
    () => [
      {
        id: "introduction",
        label: "Introduction",
        title: "About This Project",
        paragraphs: [
          "This platform predicts geophysical state transitions using Markov chains, with an interactive map-first workflow for location-specific analysis.",
          "The current production flow is focused on solar radiation, while drought and geomagnetic storm modules are scaffolded and ready for phased expansion.",
          "The goal is practical decision support: convert historical environmental observations into interpretable short-horizon probabilities.",
        ],
      },
      {
        id: "getting-started",
        label: "Getting Started",
        title: "Getting Started",
        paragraphs: [
          "Open the Map page and search for a location or click directly on the map.",
          "The app fetches location metadata and solar observations, then computes state-transition outputs.",
          "Use Open Detail to review the trend chart and selected-point snapshot for that location.",
        ],
      },
      {
        id: "data-outputs",
        label: "Data outputs",
        title: "Data outputs",
        paragraphs: [
          "Location outputs include latest hourly/daily radiation where available, model state, transition matrix, and short-horizon probabilities.",
          "Solar parameter panels include core all-sky and clear-sky irradiance metrics with units and latest values.",
          "CSV export is provided for multi-year daily data retrieval at the selected point.",
        ],
      },
      {
        id: "data-sources",
        label: "Data sources",
        title: "Data sources",
        paragraphs: [
          "Primary source for the solar module is NASA POWER temporal point APIs (hourly and daily).",
          "Geocoding and reverse location resolution are handled through geospatial lookup services integrated in the backend flow.",
          "All upstream feeds may have occasional delays or missing intervals depending on provider availability.",
        ],
      },
      {
        id: "methodology",
        label: "Methodology",
        title: "Methodology",
        paragraphs: [
          "Continuous solar values are cleaned and mapped into discrete states (for example: Low, Medium, High).",
          "A first-order transition matrix is estimated from historical state sequences at the selected point.",
          "Forecast probabilities are produced by propagating current state through the transition matrix across forecast horizons.",
        ],
      },
      {
        id: "accuracy",
        label: "Accuracy",
        title: "Accuracy",
        paragraphs: [
          "Reported accuracy reflects one-step historical agreement over the training window.",
          "Performance varies by region, seasonality, state-threshold choice, and data completeness.",
          "These outputs are probabilistic guidance, not deterministic guarantees.",
        ],
      },
      {
        id: "user-guide",
        label: "User guide",
        title: "User guide",
        paragraphs: [
          "Use the map marker as the active analysis point; panel outputs always reflect the current marker position.",
          "Use search for fast navigation; the map animates and recenters to the selected location.",
          "Read trend peaks/lows and transition probabilities together for short-term interpretation.",
        ],
      },
      {
        id: "faqs",
        label: "FAQs",
        title: "FAQs",
        paragraphs: [
          "Why is current-hour data sometimes missing? Upstream hourly feeds can lag or return temporary gaps.",
          "Why do long-horizon probabilities flatten? Markov chains naturally move toward steady-state behavior.",
          "Can state thresholds be changed? Yes, but threshold choices directly affect matrix structure and forecast behavior.",
        ],
      },
      {
        id: "further-resources",
        label: "Further resources",
        title: "Further resources",
        paragraphs: [
          "Review NASA POWER API documentation for parameter definitions and temporal endpoint options.",
          "Use repository tests and sample payloads to validate API contracts during development.",
          "Follow the README for local setup, route behavior, and module status.",
        ],
      },
      {
        id: "release-notes",
        label: "Release notes",
        title: "Release notes",
        paragraphs: [
          "Current release includes map search, animated location focus, and streamlined Open Detail view.",
          "Trend charts now highlight turning points with month-year annotations for readability.",
          "Upcoming updates include functional drought and geomagnetic prediction pipelines.",
        ],
      },
      {
        id: "terms",
        label: "Terms of use",
        title: "Terms of use",
        paragraphs: [
          "This project is intended for educational, research, and prototype analytics use.",
          "External data providers retain their own licensing and service terms.",
          "Users are responsible for independent validation before operational or safety-critical decisions.",
        ],
      },
    ],
    [],
  );
  const [activeTab, setActiveTab] = useState("introduction");
  const selected = sections.find((s) => s.id === activeTab) ?? sections[0];

  return (
    <main className="about-support-page">
      <section className="about-layout">
        <aside className="about-sidebar">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`about-tab${activeTab === section.id ? " about-tab--active" : ""}`}
              onClick={() => setActiveTab(section.id)}
            >
              {section.label}
            </button>
          ))}
        </aside>

        <section className="about-content">
          <h2>{selected.title}</h2>
          {selected.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      </section>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="module-page">
      <section className="module-hero">
        <h1>Contact</h1>
        <p>For project support, please open an issue in the repository or contact the team lead.</p>
      </section>
    </main>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMapPage = location.pathname === "/map";
  const mapSearchInputRef = useRef(null);
  const mapSearchQuery = isMapPage ? new URLSearchParams(location.search).get("q") || "" : "";

  function onMapSearchSubmit(event) {
    event.preventDefault();
    const query = (mapSearchInputRef.current?.value || "").trim();
    mapSearchInputRef.current?.blur();
    if (!query) {
      navigate("/map");
      return;
    }
    navigate(`/map?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <header className="top-nav-wrap">
        <nav className="top-nav">
          <div className="top-nav__links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `top-nav__link${isActive ? " top-nav__link--active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `top-nav__link${isActive ? " top-nav__link--active" : ""}`
              }
            >
              Map
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `top-nav__link${isActive ? " top-nav__link--active" : ""}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/model"
              className={({ isActive }) =>
                `top-nav__link${isActive ? " top-nav__link--active" : ""}`
              }
            >
              Model
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `top-nav__link${isActive ? " top-nav__link--active" : ""}`
              }
            >
              Contact
            </NavLink>
          </div>

          <div className="top-nav__right-slot">
            {isMapPage ? (
              <form className="top-nav__search-wrap" onSubmit={onMapSearchSubmit}>
                <input
                  key={mapSearchQuery}
                  ref={mapSearchInputRef}
                  type="text"
                  className="top-nav__search"
                  defaultValue={mapSearchQuery}
                  placeholder="Search locations"
                  aria-label="Search places"
                />
                <button type="submit" className="top-nav__search-btn" aria-label="Search">
                  <Search size={22} />
                </button>
              </form>
            ) : null}
          </div>
        </nav>
      </header>

      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/map/detail" element={<MapDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/model" element={<SolarRadiationPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/solar" element={<SolarRadiationPage />} />
          <Route path="/drought" element={<DroughtPage />} />
          <Route path="/geomagnetic" element={<GeomagneticPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
