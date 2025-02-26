// src/app/components/UI/GameHud.tsx
import React, { useState, useEffect } from "react";
import PlanetInfoPanel from "./PlanetInfoPanel";
import NavigationControls from "./NavigationControls";
import HolographicMiniMap from "./MiniMap";
import TimeControls from "./TimeControls";
import CoordinatesDisplay from "./CoordinatesDisplay";
import CockpitFrame from "./CockpitFrame";
import CockpitInterface from "./CockpitInterface";
import "./GameUI.css";
import "./HolographicUI.css"; // Import the new CSS

interface GameHUDProps {
  currentPlanet: any | null;
  cameraPosition: { x: number; y: number; z: number };
  cameraVelocity: { x: number; y: number; z: number };
  timeScale: number;
  onSetTimeScale: (scale: number) => void;
  onToggleCameraMode: (mode: "fps" | "follow" | "orbit") => void;
  onWarpToPlanet: (planetName: string) => void;
  onFollowPlanet: (planetName: string) => void;
  planets: any[];
  cameraMode: "fps" | "follow" | "orbit";
  rawPlanets: any[];
}

const GameHUD: React.FC<GameHUDProps> = ({
  currentPlanet,
  cameraPosition,
  cameraVelocity,
  timeScale,
  onSetTimeScale,
  onToggleCameraMode,
  onWarpToPlanet,
  onFollowPlanet,
  planets,
  cameraMode,
}) => {
  // States for panel visibility
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Show planet info panel when selecting a planet
  useEffect(() => {
    if (currentPlanet) {
      setShowPlanetInfo(true);
    }
  }, [currentPlanet]);

  // Speed calculation
  const velocityMagnitude = Math.sqrt(
    cameraVelocity.x * cameraVelocity.x +
    cameraVelocity.y * cameraVelocity.y +
    cameraVelocity.z * cameraVelocity.z
  );

  // Custom panel components with close buttons
  const renderCoordinatesPanel = () => (
    <div className="panel-content coordinates-panel">
      <CoordinatesDisplay
        position={cameraPosition}
        velocity={velocityMagnitude}
        targetDistance={
          currentPlanet
            ? Math.sqrt(
                Math.pow(cameraPosition.x - currentPlanet.position.x, 2) +
                Math.pow(cameraPosition.y - currentPlanet.position.y, 2) +
                Math.pow(cameraPosition.z - currentPlanet.position.z, 2)
              )
            : null
        }
        currentPlanet={currentPlanet}
      />
    </div>
  );

  const renderNavigationPanel = () => (
    <div className="panel-content navigation-panel">
      <NavigationControls
        onToggleCameraMode={onToggleCameraMode}
        cameraMode={cameraMode}
      />
    </div>
  );

  const renderMapPanel = () => (
    <div className="panel-content map-panel">
      <HolographicMiniMap
        cameraPosition={cameraPosition}
        planets={planets}
        currentPlanet={currentPlanet}
        onSelectPlanet={(planet) => onWarpToPlanet(planet.name)}
      />
    </div>
  );

  const renderTimePanel = () => (
    <div className="panel-content time-panel">
      <TimeControls 
        timeScale={timeScale} 
        onSetTimeScale={onSetTimeScale} 
      />
    </div>
  );

  const renderPlanetInfoPanel = () => (
    <div className="panel-content planet-info-panel">
      {currentPlanet && (
        <PlanetInfoPanel
          planet={currentPlanet}
          onClose={() => setShowPlanetInfo(false)}
          onWarp={() => onWarpToPlanet(currentPlanet.name)}
          onFollow={() => onFollowPlanet(currentPlanet.name)}
        />
      )}
    </div>
  );

  const renderHelpPanel = () => (
    <div className="panel-content help-panel">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-300">Navigation Controls</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="game-panel-dark p-4">
            <h3 className="text-xl font-bold mb-3 text-cyan-300">Ship Movement</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-cyan-400">Forward/Backward</div>
                <div className="text-white">W / S</div>
              </div>
              <div>
                <div className="text-cyan-400">Strafe Left/Right</div>
                <div className="text-white">A / D</div>
              </div>
              <div>
                <div className="text-cyan-400">Ascend/Descend</div>
                <div className="text-white">Q / E</div>
              </div>
              <div>
                <div className="text-cyan-400">Roll Left/Right</div>
                <div className="text-white">Z / C</div>
              </div>
              <div>
                <div className="text-cyan-400">Boost Speed</div>
                <div className="text-white">SHIFT + W</div>
              </div>
              <div>
                <div className="text-cyan-400">Look Around</div>
                <div className="text-white">MOUSE DRAG</div>
              </div>
            </div>
          </div>

          <div className="game-panel-dark p-4">
            <h3 className="text-xl font-bold mb-3 text-cyan-300">Interface Controls</h3>
            <div className="space-y-4">
              <div>
                <div className="text-cyan-400">Select Planet</div>
                <div className="text-white">Click on planet or use minimap</div>
              </div>
              <div>
                <div className="text-cyan-400">Camera Modes</div>
                <div className="text-white">Free Flight / Follow / Orbit</div>
              </div>
              <div>
                <div className="text-cyan-400">Time Control</div>
                <div className="text-white">Adjust simulation speed</div>
              </div>
              <div>
                <div className="text-cyan-400">Exit Following Mode</div>
                <div className="text-white">ESC key</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CockpitInterface
      currentPlanet={currentPlanet}
      cameraPosition={cameraPosition}
      cameraVelocity={cameraVelocity}
    >
      {/* Status bar at top */}
      <div className="status-bar">
        <div className={`status-indicator ${cameraMode === "fps" ? "status-active" : ""}`}>
          <div className="status-indicator-dot"></div>
          <div className="status-indicator-text">Shields: 100%</div>
        </div>
        <div className={`status-indicator ${velocityMagnitude > 50 ? "status-warning" : "status-active"}`}>
          <div className="status-indicator-dot"></div>
          <div className="status-indicator-text">Fuel: 98%</div>
        </div>
        <div className="status-indicator status-active">
          <div className="status-indicator-dot"></div>
          <div className="status-indicator-text">Life Support: NOMINAL</div>
        </div>
      </div>

      {/* Add cockpit frame with ship controls */}
      <CockpitFrame cameraVelocity={cameraVelocity} />

      {/* Help button - floating in bottom center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="game-button"
        >
          {showHelp ? "Close Help" : "Help"}
        </button>
      </div>

      {/* Panel containers */}
      {showCoordinates && (
        <div className="panel-container panel-left panel-coordinates">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Navigation System</h3>
              <button className="panel-close-button" onClick={() => setShowCoordinates(false)}>×</button>
            </div>
            {renderCoordinatesPanel()}
          </div>
        </div>
      )}

      {showNavigation && (
        <div className="panel-container panel-left panel-navigation panel-offset-1">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Flight Control</h3>
              <button className="panel-close-button" onClick={() => setShowNavigation(false)}>×</button>
            </div>
            {renderNavigationPanel()}
          </div>
        </div>
      )}

      {showMap && (
        <div className="panel-container panel-right panel-map">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>System Map</h3>
              <button className="panel-close-button" onClick={() => setShowMap(false)}>×</button>
            </div>
            {renderMapPanel()}
          </div>
        </div>
      )}

      {showTime && (
        <div className="panel-container panel-right panel-time panel-offset-1">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Temporal Control</h3>
              <button className="panel-close-button" onClick={() => setShowTime(false)}>×</button>
            </div>
            {renderTimePanel()}
          </div>
        </div>
      )}

      {showPlanetInfo && currentPlanet && (
        <div className="panel-container panel-center planet-info-container">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>{currentPlanet.name} Scanner</h3>
              <button className="panel-close-button" onClick={() => setShowPlanetInfo(false)}>×</button>
            </div>
            {renderPlanetInfoPanel()}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="panel-container panel-center help-container">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Control Guide</h3>
              <button className="panel-close-button" onClick={() => setShowHelp(false)}>×</button>
            </div>
            {renderHelpPanel()}
          </div>
        </div>
      )}
    </CockpitInterface>
  );
};

export default GameHUD;