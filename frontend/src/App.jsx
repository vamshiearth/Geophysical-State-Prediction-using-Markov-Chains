import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import SolarPage from "./pages/SolarPage";
import DroughtPage from "./pages/DroughtPage";
import GeomagneticPage from "./pages/GeomagneticPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <header className="top-nav-wrap">
        <nav className="top-nav">
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
            to="/solar"
            className={({ isActive }) =>
              `top-nav__link${isActive ? " top-nav__link--active" : ""}`
            }
          >
            Solar
          </NavLink>
          <NavLink
            to="/drought"
            className={({ isActive }) =>
              `top-nav__link${isActive ? " top-nav__link--active" : ""}`
            }
          >
            Drought
          </NavLink>
          <NavLink
            to="/geomagnetic"
            className={({ isActive }) =>
              `top-nav__link${isActive ? " top-nav__link--active" : ""}`
            }
          >
            Geomagnetic
          </NavLink>
        </nav>
      </header>

      <div className="app-shell">
        <Routes>
          <Route
            path="/"
            element={
              <section className="home-panel">
                <h1>Geophysical Time-Series Forecasting</h1>
              </section>
            }
          />
          <Route path="/solar" element={<SolarPage />} />
          <Route path="/drought" element={<DroughtPage />} />
          <Route path="/geomagnetic" element={<GeomagneticPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
