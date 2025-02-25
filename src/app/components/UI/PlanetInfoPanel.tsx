// src/app/components/UI/PlanetInfoPanel.tsx
import React, { useState } from "react";

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

  return (
    <div
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    planet-info-panel game-panel
                    max-w-lg w-full max-h-[80vh] overflow-auto pointer-events-auto"
    >
      <div className="game-panel-header">
        <h2 className="game-panel-title text-xl">{planet.name} Scanner</h2>
        <button onClick={onClose} className="game-panel-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="game-tabs">
        <button
          className={`game-tab ${
            activeTab === "overview" ? "game-tab-active" : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`game-tab ${
            activeTab === "physical" ? "game-tab-active" : ""
          }`}
          onClick={() => setActiveTab("physical")}
        >
          Physical Data
        </button>
        <button
          className={`game-tab ${
            activeTab === "orbital" ? "game-tab-active" : ""
          }`}
          onClick={() => setActiveTab("orbital")}
        >
          Orbital Data
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="game-panel-content">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex justify-center items-center">
              <div
                className="planet-image"
                style={{
                  backgroundColor:
                    planet.name === "Sun"
                      ? "#ffcc00"
                      : planet.name === "Mercury"
                      ? "#b5b5b5"
                      : planet.name === "Venus"
                      ? "#e8cda2"
                      : planet.name === "Earth"
                      ? "#3c70b4"
                      : planet.name === "Mars"
                      ? "#d83c22"
                      : planet.name === "Jupiter"
                      ? "#e0b568"
                      : planet.name === "Saturn"
                      ? "#c3a06b"
                      : planet.name === "Uranus"
                      ? "#a6d7e8"
                      : planet.name === "Neptune"
                      ? "#3e66f9"
                      : "#ab9588", // Pluto
                }}
              ></div>
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
                  <div>{formatNumber(planet.diameter)} km</div>

                  <div className="text-cyan-400">Orbital Distance:</div>
                  <div>{formatNumber(planet.distanceFromSun)} km</div>

                  <div className="text-cyan-400">Rotation Period:</div>
                  <div>{planet.rotationPeriod} days</div>

                  <div className="text-cyan-400">Day Length:</div>
                  <div>{planet.lengthOfDay} hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="game-panel-dark p-3 mb-6 rounded">
            <div className="data-label mb-1">Planetary Analysis</div>
            <p className="text-sm leading-relaxed">
              {getPlanetDescription(planet.name)}
            </p>
          </div>

          <div className="flex space-x-4 mb-2">
            <button
              onClick={onWarp}
              className="game-button game-button-primary flex-1 py-3"
            >
              Warp to {planet.name}
            </button>
            <button
              onClick={onFollow}
              className="game-button game-button-success flex-1 py-3"
            >
              Follow Orbit
            </button>
          </div>

          <div className="text-xs text-center text-cyan-300">
            Travel Time Estimate:{" "}
            {formatNumber(Math.sqrt(planet.distanceFromSun) * 0.01)} minutes at
            standard warp
          </div>
        </div>
      )}

      {activeTab === "physical" && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="text-gray-400">Mass:</div>
          <div>{formatNumber(planet.mass)} kg</div>

          <div className="text-gray-400">Diameter:</div>
          <div>{formatNumber(planet.diameter)} km</div>

          <div className="text-gray-400">Density:</div>
          <div>{planet.density} kg/m³</div>

          <div className="text-gray-400">Surface Gravity:</div>
          <div>{planet.gravity} m/s²</div>

          <div className="text-gray-400">Escape Velocity:</div>
          <div>{planet.escapeVelocity} km/s</div>

          <div className="text-gray-400">Surface Temperature:</div>
          <div>{planet.meanTemperature} K</div>

          {planet.surfacePressure > 0 && (
            <>
              <div className="text-gray-400">Surface Pressure:</div>
              <div>{planet.surfacePressure} Pa</div>
            </>
          )}

          <div className="text-gray-400">Number of Moons:</div>
          <div>{planet.numberOfMoons}</div>

          <div className="text-gray-400">Ring System:</div>
          <div>{planet.hasRingSystem ? "Yes" : "No"}</div>

          <div className="text-gray-400">Global Magnetic Field:</div>
          <div>{planet.hasGlobalMagneticField ? "Yes" : "No"}</div>

          {planet.composition && (
            <>
              <div className="text-gray-400 col-span-2 mt-2 mb-1">
                Composition:
              </div>
              <div className="col-span-2">
                <div className="bg-gray-800 p-2 rounded">
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
      )}

      {activeTab === "orbital" && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="text-gray-400">Distance from Sun:</div>
          <div>{formatNumber(planet.distanceFromSun)} km</div>

          <div className="text-gray-400">Perihelion:</div>
          <div>{formatNumber(planet.perihelion)} km</div>

          <div className="text-gray-400">Aphelion:</div>
          <div>{formatNumber(planet.aphelion)} km</div>

          <div className="text-gray-400">Orbital Period:</div>
          <div>{planet.orbitalPeriod} days</div>

          <div className="text-gray-400">Orbital Velocity:</div>
          <div>{planet.orbitalVelocity} km/s</div>

          <div className="text-gray-400">Orbital Inclination:</div>
          <div>{planet.orbitalInclination}°</div>

          <div className="text-gray-400">Eccentricity:</div>
          <div>{planet.orbitalEccentricity}</div>

          <div className="text-gray-400">Axial Tilt:</div>
          <div>{planet.obliquityToOrbit}°</div>

          <div className="text-gray-400">Rotation Period:</div>
          <div>{planet.rotationPeriod} days</div>

          <div className="text-gray-400">Day Length:</div>
          <div>{planet.lengthOfDay} hours</div>
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
