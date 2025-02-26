// src/app/components/UI/GameHud.tsx
import React, { useState, useEffect } from "react";
import PlanetInfoPanel from "./PlanetInfoPanel";
import NavigationControls from "./NavigationControls";
import HolographicMiniMap from "./MiniMap";
import TimeControls from "./TimeControls";
import CoordinatesDisplay from "./CoordinatesDisplay";
import CockpitFrame from "./CockpitFrame";
import "./GameUI.css";

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
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTargetingReticle, setShowTargetingReticle] = useState(false);

  useEffect(() => {
    if (currentPlanet) {
      setShowPlanetInfo(true);
      setShowTargetingReticle(true);

      const timer = setTimeout(() => {
        setShowTargetingReticle(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentPlanet]);

  const velocityMagnitude = Math.sqrt(
    cameraVelocity.x * cameraVelocity.x +
      cameraVelocity.y * cameraVelocity.y +
      cameraVelocity.z * cameraVelocity.z
  );

  return (
    <div className="global-game-ui">
      {/* Cockpit Frame - New component */}
      <CockpitFrame cameraVelocity={cameraVelocity} />

      {/* Title Bar - Reduced to minimal display */}
      <div className="absolute top-0 left-0 right-0 h-12 flex justify-center items-center px-4 z-50 pointer-events-none">
        <div className="text-xl font-bold text-cyan-300 flex items-center">
          <span className="text-sm mr-2 text-cyan-400">ALPHA v1.0</span>
          Solar System Explorer
        </div>
      </div>

      {/* Help Dialog */}
      {showHelp && (
        <div className="absolute inset-0 bg-black bg-opacity-90 text-white p-8 overflow-auto z-50">
          <div className="max-w-4xl mx-auto game-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-300">
                Navigation Controls
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="game-button"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="game-panel p-4">
                <h3 className="text-xl font-bold mb-3 text-cyan-300">
                  Ship Movement
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="data-group">
                    <div className="data-label">Forward/Backward</div>
                    <div className="data-value">W / S</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Strafe Left/Right</div>
                    <div className="data-value">A / D</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Ascend/Descend</div>
                    <div className="data-value">Q / E</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Roll Left/Right</div>
                    <div className="data-value">Z / C</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Boost Speed</div>
                    <div className="data-value">SHIFT + W</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Look Around</div>
                    <div className="data-value">MOUSE DRAG</div>
                  </div>
                </div>
              </div>

              <div className="game-panel p-4">
                <h3 className="text-xl font-bold mb-3 text-cyan-300">
                  Interface Controls
                </h3>
                <div className="space-y-4">
                  <div className="data-group">
                    <div className="data-label">Select Planet</div>
                    <div className="data-value">
                      Click on planet or use minimap
                    </div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Camera Modes</div>
                    <div className="data-value">
                      Free Flight / Follow / Orbit
                    </div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Time Control</div>
                    <div className="data-value">Adjust simulation speed</div>
                  </div>
                  <div className="data-group">
                    <div className="data-label">Exit Following Mode</div>
                    <div className="data-value">ESC key</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="game-panel p-4 mb-6">
              <h3 className="text-xl font-bold mb-3 text-cyan-300">
                Exploration Tips
              </h3>
              <ul className="space-y-2">
                <li>
                  <span className="status-indicator status-active"></span> Use
                  the minimap to locate planets and navigate the solar system
                </li>
                <li>
                  <span className="status-indicator status-active"></span>{" "}
                  Adjust time scale to observe planetary motion more clearly
                </li>
                <li>
                  <span className="status-indicator status-active"></span> Try
                  different camera modes when observing planets
                </li>
                <li>
                  <span className="status-indicator status-active"></span> The
                  Follow mode automatically tracks a planet's movement
                </li>
                <li>
                  <span className="status-indicator status-active"></span> Use
                  Orbit mode to circle around planets
                </li>
                <li>
                  <span className="status-indicator status-warning"></span>{" "}
                  Distances in space are vast - use Warp to quickly reach
                  planets
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Coordinates Display - Repositioned for cockpit layout */}
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

      {/* Navigation Controls - Repositioned for cockpit layout */}
      <NavigationControls
        onToggleCameraMode={onToggleCameraMode}
        cameraMode={cameraMode}
      />

      {/* Help Button - Floating in bottom center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="game-button"
        >
          {showHelp ? "Hide Help" : "Help"}
        </button>
      </div>

      {/* Holographic Mini Map - Kept in top right */}
      <HolographicMiniMap
        cameraPosition={cameraPosition}
        planets={planets}
        currentPlanet={currentPlanet}
        onSelectPlanet={(planet) => onWarpToPlanet(planet.name)}
      />

      {/* Time Controls - Kept in bottom right */}
      <TimeControls timeScale={timeScale} onSetTimeScale={onSetTimeScale} />

      {/* Planet Info Panel - Shown in center when a planet is selected */}
      {currentPlanet && showPlanetInfo && (
        <PlanetInfoPanel
          planet={currentPlanet}
          onClose={() => setShowPlanetInfo(false)}
          onWarp={() => onWarpToPlanet(currentPlanet.name)}
          onFollow={() => onFollowPlanet(currentPlanet.name)}
        />
      )}
    </div>
  );
};

export default GameHUD;