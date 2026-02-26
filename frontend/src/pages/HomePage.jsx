import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [activeInfoPanel, setActiveInfoPanel] = useState(null);

  useEffect(() => {
    if (!activeInfoPanel) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveInfoPanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeInfoPanel]);

  const panelContent = {
    solar: {
      title: "Solar Radiation",
      sections: [
        {
          heading: "What It Is",
          text: "Solar radiation is electromagnetic energy from the sun that reaches Earth. It is the main driver for solar power output, surface heating, evapotranspiration, and many weather-linked processes.",
        },
        {
          heading: "How It Is Measured",
          text: "Ground stations measure incoming shortwave radiation using pyranometers, while satellite products estimate regional irradiance from cloud cover, aerosols, and atmospheric properties.",
        },
        {
          heading: "Units",
          text: "Short-interval values are typically in W/m². Daily accumulated radiation is commonly reported in kWh/m²/day.",
        },
        {
          heading: "Past Damages and Impacts",
          text: "Rapid radiation variability can cause solar generation ramp events, grid balancing stress, higher operational costs, agricultural water stress, and elevated heat exposure risk.",
        },
        {
          heading: "Why Prediction Is Needed",
          text: "Forecasting enables grid scheduling, better reserve planning, irrigation decisions, and earlier heat-risk response. Probability outputs improve decisions under uncertainty.",
        },
      ],
    },
    drought: {
      title: "Drought",
      sections: [
        {
          heading: "What It Is",
          text: "Drought is a sustained period of below-normal water availability caused by precipitation deficits, high evapotranspiration, and soil moisture depletion.",
        },
        {
          heading: "How It Is Measured",
          text: "Drought is monitored through rainfall anomalies, soil moisture, streamflow, reservoir levels, and composite indicators such as SPI/SPEI and drought severity classes.",
        },
        {
          heading: "Units and Indicators",
          text: "Unlike a single physical unit, drought is often expressed using indices (e.g., SPI values), percentile anomalies, and categorical severity levels.",
        },
        {
          heading: "Past Damages and Impacts",
          text: "Major drought events have caused crop failures, livestock stress, drinking-water shortages, wildfire intensification, economic losses, and ecosystem degradation.",
        },
        {
          heading: "Why Prediction Is Needed",
          text: "Early prediction supports water allocation, crop planning, reservoir management, wildfire readiness, and policy-level drought mitigation before severe impacts accumulate.",
        },
      ],
    },
    geomagnetic: {
      title: "Geomagnetic Storms",
      sections: [
        {
          heading: "What It Is",
          text: "Geomagnetic storms are disturbances in Earth’s magnetic field, typically triggered by solar wind shocks and coronal mass ejections interacting with the magnetosphere.",
        },
        {
          heading: "How It Is Measured",
          text: "Monitoring uses space-weather satellites and ground magnetometers. Activity is summarized using indices like Kp, Dst, and AE to represent storm intensity.",
        },
        {
          heading: "Units and Indices",
          text: "Kp is a quasi-logarithmic index (0-9). Dst is reported in nanotesla (nT) and captures ring-current strength during geomagnetic disturbances.",
        },
        {
          heading: "Past Damages and Impacts",
          text: "Severe storms have disrupted power grids, degraded GNSS accuracy, affected aviation/communications, increased satellite drag, and raised risk to space assets.",
        },
        {
          heading: "Why Prediction Is Needed",
          text: "Short-term forecasting allows operators to protect grid infrastructure, plan satellite operations, harden communications, and reduce exposure during high-activity intervals.",
        },
      ],
    },
  };
  const currentPanel = activeInfoPanel ? panelContent[activeInfoPanel] : null;

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__overlay" />
        <div className="landing-hero__content">
          <div className="hero-visual" aria-hidden="true">
            <span className="hero-pulse hero-pulse--one" />
            <span className="hero-pulse hero-pulse--two" />
            <span className="hero-pulse hero-pulse--three" />
          </div>
          <h1>Climate and Space Prediction Model</h1>
          <p>Predicting Solar Radiation, Drought, and Geomagnetic Storms</p>
          <div className="landing-hero__actions">
            <Link to="/about" className="cta-button cta-button--blue">
              Learn More
            </Link>
            <Link to="/model" className="cta-button cta-button--green">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="prediction-section">
        <h2>Our Model Predicts</h2>
        <div className="prediction-grid">
          <button
            type="button"
            className="prediction-card prediction-card--solar"
            onClick={() => setActiveInfoPanel("solar")}
          >
            <h3>Solar Radiation</h3>
            <p>Forecast future solar energy levels based on Markov chain analysis.</p>
          </button>

          <button
            type="button"
            className="prediction-card prediction-card--drought"
            onClick={() => setActiveInfoPanel("drought")}
          >
            <h3>Drought</h3>
            <p>Predict and assess drought conditions using historical data.</p>
          </button>

          <button
            type="button"
            className="prediction-card prediction-card--geomagnetic"
            onClick={() => setActiveInfoPanel("geomagnetic")}
          >
            <h3>Geomagnetic Storms</h3>
            <p>Monitor and forecast geomagnetic activity and storm risks.</p>
          </button>
        </div>
      </section>

      {currentPanel && (
        <div
          className="solar-info-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${currentPanel.title} Information`}
          onClick={() => setActiveInfoPanel(null)}
        >
          <article className="solar-info-panel" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="solar-info-close"
              aria-label={`Close ${currentPanel.title} information`}
              onClick={() => setActiveInfoPanel(null)}
            >
              ×
            </button>

            <h2>{currentPanel.title}</h2>
            {currentPanel.sections.map((section) => (
              <div key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.text}</p>
              </div>
            ))}
          </article>
        </div>
      )}
    </main>
  );
}
