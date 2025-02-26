// Enhanced PlanetInfoPanel.tsx
import React, { useState, useEffect } from "react";

interface PlanetInfoPanelProps {
  planet: any;
  onClose: () => void;
  onWarp: () => void;
  onFollow: () => void;
}

const PlanetInfoPanel: React.FC<PlanetInfoPanelProps> = ({
  planet,
  onClose,
  onWarp,
  onFollow,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "physical" | "orbital"
  >("overview");

  // Reset to overview tab when a new planet is selected
  useEffect(() => {
    setActiveTab("overview");
  }, [planet?.name]);

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return "Unknown";
    }

    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M km`;
    } else if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(2)}K km`;
    } else {
      return `${num.toFixed(2)} km`;
    }
  };

  // Get planet color for visualization
  const getPlanetColor = (name: string): string => {
    switch (name.toLowerCase()) {
      case "sun": return "#ffcc00";
      case "mercury": return "#b5b5b5";
      case "venus": return "#e8cda2";
      case "earth": return "#3c70b4";
      case "mars": return "#d83c22";
      case "jupiter": return "#e0b568";
      case "saturn": return "#c3a06b";
      case "uranus": return "#a6d7e8";
      case "neptune": return "#3e66f9";
      case "pluto": return "#ab9588";
      default: return "#ffffff";
    }
  };

  return (
    <div className="planet-info-content">
      <div className="hologram-tabs">
        <button
          className={`hologram-tab ${
            activeTab === "overview" ? "hologram-tab-active" : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`hologram-tab ${
            activeTab === "physical" ? "hologram-tab-active" : ""
          }`}
          onClick={() => setActiveTab("physical")}
        >
          Physical
        </button>
        <button
          className={`hologram-tab ${
            activeTab === "orbital" ? "hologram-tab-active" : ""
          }`}
          onClick={() => setActiveTab("orbital")}
        >
          Orbital
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="tab-content overview-tab p-4">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex justify-center items-center">
              <div
                className="planet-image relative"
                style={{
                  backgroundColor: getPlanetColor(planet.name),
                }}
              >
                {/* Add rings for Saturn */}
                {planet.name === "Saturn" && (
                  <div 
                    className="absolute inset-0 transform -rotate-12" 
                    style={{
                      overflow: 'hidden',
                      zIndex: -1
                    }}
                  >
                    <div 
                      className="absolute" 
                      style={{
                        width: '200%',
                        height: '40px',
                        left: '-50%',
                        top: 'calc(50% - 20px)',
                        background: 'linear-gradient(90deg, rgba(195, 160, 107, 0) 0%, rgba(195, 160, 107, 0.8) 50%, rgba(195, 160, 107, 0) 100%)',
                        boxShadow: '0 0 10px rgba(195, 160, 107, 0.5)',
                        borderRadius: '50%',
                        transform: 'rotate(0deg)'
                      }}
                    ></div>
                  </div>
                )}

                {/* Add atmosphere glow for Earth, Venus, etc. */}
                {["Earth", "Venus", "Uranus", "Neptune"].includes(planet.name) && (
                  <div 
                    className="absolute inset-0 rounded-full" 
                    style={{
                      boxShadow: `0 0 20px ${getPlanetColor(planet.name)}`,
                      zIndex: -1
                    }}
                  ></div>
                )}

                {/* Add scanline effect */}
                <div 
                  className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                  style={{ zIndex: 2 }}
                >
                  <div 
                    className="absolute w-full h-1 bg-blue-400 opacity-30"
                    style={{ 
                      animation: 'scan-line 2s linear infinite'
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <div className="data-label">Classification</div>
              <div className="data-value text-lg mb-2">
                {planet.name === "Sun"
                  ? "G-Type Main Sequence Star"
                  : ["Mercury", "Venus", "Earth", "Mars"].includes(planet.name)
                  ? "Terrestrial Planet"
                  : ["Jupiter", "Saturn"].includes(planet.name)
                  ? "Gas Giant"
                  : ["Uranus", "Neptune"].includes(planet.name)
                  ? "Ice Giant"
                  : "Dwarf Planet"}
              </div>

              <div className="data-group">
                <div className="data-label">Key Parameters</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                  <div className="text-cyan-400">Diameter:</div>
                  <div>{formatNumber(planet.diameter)}</div>

                  <div className="text-cyan-400">Orbital Distance:</div>
                  <div>{formatNumber(planet.distanceFromSun)}</div>

                  <div className="text-cyan-400">Rotation Period:</div>
                  <div>{planet.rotationPeriod || "Unknown"} {planet.rotationPeriod ? "days" : ""}</div>

                  <div className="text-cyan-400">Day Length:</div>
                  <div>{planet.lengthOfDay || "Unknown"} {planet.lengthOfDay ? "hours" : ""}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hologram-panel-dark p-3 mb-6 rounded">
            <div className="data-label mb-1">Planetary Analysis</div>
            <p className="text-sm leading-relaxed">
              {getPlanetDescription(planet.name)}
            </p>
          </div>

          <div className="hologram-buttons-container">
            <button
              onClick={onWarp}
              className="hologram-button hologram-button-primary"
            >
              <span className="hologram-button-icon">🚀</span>
              <span className="hologram-button-text">Warp to {planet.name}</span>
            </button>
            <button
              onClick={onFollow}
              className="hologram-button hologram-button-success"
            >
              <span className="hologram-button-icon">🔄</span>
              <span className="hologram-button-text">Follow Orbit</span>
            </button>
          </div>

          <div className="text-xs text-center text-cyan-300 mt-3">
            Travel Time Estimate:{" "}
            {formatNumber(Math.sqrt(planet.distanceFromSun || 0) * 0.01)} minutes at
            standard warp
          </div>
        </div>
      )}

      {activeTab === "physical" && (
        <div className="tab-content physical-tab p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="text-cyan-400">Mass:</div>
            <div>{formatNumber(planet.mass)} kg</div>

            <div className="text-cyan-400">Diameter:</div>
            <div>{formatNumber(planet.diameter)}</div>

            <div className="text-cyan-400">Density:</div>
            <div>{planet.density || "Unknown"} {planet.density ? "kg/m³" : ""}</div>

            <div className="text-cyan-400">Surface Gravity:</div>
            <div>{planet.gravity || "Unknown"} {planet.gravity ? "m/s²" : ""}</div>

            <div className="text-cyan-400">Escape Velocity:</div>
            <div>{planet.escapeVelocity || "Unknown"} {planet.escapeVelocity ? "km/s" : ""}</div>

            <div className="text-cyan-400">Surface Temperature:</div>
            <div>{planet.meanTemperature || "Unknown"} {planet.meanTemperature ? "K" : ""}</div>

            {(planet.surfacePressure > 0 || planet.name === "Earth") && (
              <>
                <div className="text-cyan-400">Surface Pressure:</div>
                <div>{planet.surfacePressure || "1 atm"} {planet.surfacePressure ? "Pa" : ""}</div>
              </>
            )}

            <div className="text-cyan-400">Number of Moons:</div>
            <div>{planet.numberOfMoons || "0"}</div>

            <div className="text-cyan-400">Ring System:</div>
            <div>{planet.name === "Saturn" || planet.name === "Uranus" || planet.name === "Jupiter" || planet.name === "Neptune" ? "Yes" : "No"}</div>

            <div className="text-cyan-400">Global Magnetic Field:</div>
            <div>{["Earth", "Jupiter", "Saturn", "Uranus", "Neptune"].includes(planet.name) ? "Yes" : "No"}</div>

            {planet.composition && (
              <>
                <div className="text-cyan-400 col-span-2 mt-4 mb-2">
                  Composition:
                </div>
                <div className="col-span-2">
                  <div className="hologram-panel-dark p-2 rounded">
                    {Object.entries(planet.composition).map(
                      ([element, percentage]: [string, any]) => (
                        <div key={element} className="flex justify-between mb-1">
                          <span>{element}</span>
                          <span>
                            {typeof percentage === "number"
                              ? `${percentage.toFixed(1)}%`
                              : percentage}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="hologram-buttons-container mt-4">
            <button
              onClick={onWarp}
              className="hologram-button hologram-button-primary"
            >
              <span className="hologram-button-icon">🚀</span>
              <span className="hologram-button-text">Warp to {planet.name}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "orbital" && (
        <div className="tab-content orbital-tab p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="text-cyan-400">Distance from Sun:</div>
            <div>{formatNumber(planet.distanceFromSun)}</div>

            <div className="text-cyan-400">Perihelion:</div>
            <div>{formatNumber(planet.perihelion)}</div>

            <div className="text-cyan-400">Aphelion:</div>
            <div>{formatNumber(planet.aphelion)}</div>

            <div className="text-cyan-400">Orbital Period:</div>
            <div>{planet.orbitalPeriod || "Unknown"} {planet.orbitalPeriod ? "days" : ""}</div>

            <div className="text-cyan-400">Orbital Velocity:</div>
            <div>{planet.orbitalVelocity || "Unknown"} {planet.orbitalVelocity ? "km/s" : ""}</div>

            <div className="text-cyan-400">Orbital Inclination:</div>
            <div>{planet.orbitalInclination || "0"}°</div>

            <div className="text-cyan-400">Eccentricity:</div>
            <div>{planet.orbitalEccentricity || "0"}</div>

            <div className="text-cyan-400">Axial Tilt:</div>
            <div>{planet.obliquityToOrbit || "0"}°</div>

            <div className="text-cyan-400">Rotation Period:</div>
            <div>{planet.rotationPeriod || "Unknown"} {planet.rotationPeriod ? "days" : ""}</div>

            <div className="text-cyan-400">Day Length:</div>
            <div>{planet.lengthOfDay || "Unknown"} {planet.lengthOfDay ? "hours" : ""}</div>
          </div>
          
          <div className="hologram-buttons-container mt-4">
            <button
              onClick={onFollow}
              className="hologram-button hologram-button-success"
            >
              <span className="hologram-button-icon">🔄</span>
              <span className="hologram-button-text">Track Orbit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get a description for each planet
function getPlanetDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Sun: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating energy mainly as visible light, ultraviolet, and infrared radiation.",
    Mercury:
      "Mercury is the smallest and innermost planet in the Solar System. It has a rocky body like Earth but is smaller, with a diameter of about 4,880 km. Its surface is heavily cratered, resembling Earth's Moon.",
    Venus:
      "Venus is the second planet from the Sun and is Earth's closest planetary neighbor. It's similar in structure and size to Earth, but its thick atmosphere traps heat in a runaway greenhouse effect, making it the hottest planet in our solar system.",
    Earth:
      "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth's surface is covered with water, and the remaining 29% consists of continents and islands.",
    Mars: 'Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being larger than only Mercury. Mars is often referred to as the "Red Planet" because the iron oxide prevalent on its surface gives it a reddish appearance.',
    Jupiter:
      "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets in the Solar System combined, but slightly less than one-thousandth the mass of the Sun.",
    Saturn:
      "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth. Saturn is known for its prominent ring system.",
    Uranus:
      "Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus is similar in composition to Neptune, and both have bulk chemical compositions which differ from that of the larger gas giants.",
    Neptune:
      "Neptune is the eighth and farthest known Solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet. Neptune is 17 times the mass of Earth.",
    Pluto:
      "Pluto is a dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It was the first Kuiper belt object to be discovered and is the largest known dwarf planet. Pluto was classified as a planet until 2006.",
  };

  return descriptions[name] || "No description available.";
}

export default PlanetInfoPanel;