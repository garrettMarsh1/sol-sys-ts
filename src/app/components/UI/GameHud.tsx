// Updated GameHUD.tsx - improved map integration
import React, { useState, useEffect } from "react";
import PlanetInfoPanel from "./PlanetInfoPanel";
import CockpitFrame from "./CockpitFrame";
import CockpitInterface from "./CockpitInterface";
import HolographicMiniMap from "./MiniMap"; // Import the MiniMap component
import "./GameUI.css";
import "./HolographicUI.css";
import "./HolographicButtons.css"; 

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
  // Additional props from CameraControlsUI
  autopilotProgress?: number;
  warpProgress?: number;
  onStartAutopilot?: () => void;
  onCancelAutopilot?: () => void;
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
  autopilotProgress = 0,
  warpProgress = 0,
  onStartAutopilot = () => {},
  onCancelAutopilot = () => {},
}) => {
  // State for help panel visibility
  const [showHelp, setShowHelp] = useState(false);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  // State for managing selected planet in the map (might be different from currentPlanet)
  const [mapSelectedPlanet, setMapSelectedPlanet] = useState<any | null>(null);
  // State to control the planet info panel visibility
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  
  // Set the mapSelectedPlanet when currentPlanet changes
  useEffect(() => {
    if (currentPlanet) {
      setMapSelectedPlanet(currentPlanet);
    }
  }, [currentPlanet]);

  // Handle planet selection from the map
  const handleSelectPlanet = (planet: any) => {
    console.log("Planet selected from map:", planet.name);
    setMapSelectedPlanet(planet);
    setShowPlanetInfo(true);
  };

  // Speed calculation
  const velocityMagnitude = Math.sqrt(
    cameraVelocity.x * cameraVelocity.x +
    cameraVelocity.y * cameraVelocity.y +
    cameraVelocity.z * cameraVelocity.z
  );
  
  // Helper function to format distance
  function formatDistance(value: number): string {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)} M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)} K`;
    } else {
      return `${value.toFixed(2)}`;
    }
  }
  
  // Helper function to calculate target distance
  function calculateTargetDistance(): number {
    if (!currentPlanet) return 0;
    return Math.sqrt(
      Math.pow(cameraPosition.x - currentPlanet.position.x, 2) +
      Math.pow(cameraPosition.y - currentPlanet.position.y, 2) +
      Math.pow(cameraPosition.z - currentPlanet.position.z, 2)
    );
  }

  // Navigation Controls Panel
  const navigationPanel = (
    <div className="navigation-panel-content">
      <div className="mb-3">
        <div className="data-label mb-2">Navigation Mode</div>
        <div className="flex space-x-2">
          <button
            onClick={() => onToggleCameraMode("fps")}
            className={`hologram-button flex-1 ${
              cameraMode === "fps" ? "hologram-button-primary" : ""
            }`}
          >
            <span className="hologram-button-text">Free Flight</span>
          </button>
          <button
            onClick={() => onToggleCameraMode("follow")}
            className={`hologram-button flex-1 ${
              cameraMode === "follow" ? "hologram-button-primary" : ""
            }`}
          >
            <span className="hologram-button-text">Follow</span>
          </button>
          <button
            onClick={() => onToggleCameraMode("orbit")}
            className={`hologram-button flex-1 ${
              cameraMode === "orbit" ? "hologram-button-primary" : ""
            }`}
          >
            <span className="hologram-button-text">Orbit</span>
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="data-label mb-1">Flight Status</div>
        <div className="data-group">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width:
                  cameraMode === "fps"
                    ? "100%"
                    : cameraMode === "follow"
                    ? "60%"
                    : "30%",
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Manual</span>
            <span>Assisted</span>
            <span>Auto</span>
          </div>
        </div>
      </div>

      {/* Autopilot and warp controls */}
      {currentPlanet && (
        <div className="space-y-2 mb-3">
          <div className="hologram-buttons-container">
            <button
              onClick={
                autopilotProgress > 0
                  ? onCancelAutopilot
                  : onStartAutopilot
              }
              className={`hologram-button ${
                autopilotProgress > 0
                  ? "hologram-button-danger"
                  : "hologram-button-success"
              }`}
              disabled={warpProgress > 0}
            >
              <span className="hologram-button-text">
                {autopilotProgress > 0
                  ? "Cancel Autopilot"
                  : "Start Autopilot"}
              </span>
            </button>
            <button
              onClick={() => onWarpToPlanet(currentPlanet.name)}
              className="hologram-button hologram-button-warning"
              disabled={
                warpProgress > 0 ||
                autopilotProgress > 0
              }
            >
              <span className="hologram-button-text">Warp</span>
            </button>
          </div>
          
          {autopilotProgress > 0 && (
            <div>
              <div className="text-xs mb-1 text-cyan-400">Autopilot Progress</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${autopilotProgress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {warpProgress > 0 && (
            <div>
              <div className="text-xs mb-1 text-yellow-300">Warp Progress</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${warpProgress * 100}%`,
                    backgroundColor: "#f59e0b",
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="data-label mb-1">Control Reference</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div className="text-cyan-400">Movement:</div>
          <div className="text-white">WASD + QE</div>

          <div className="text-cyan-400">Boost:</div>
          <div className="text-white">SHIFT + W</div>

          <div className="text-cyan-400">Roll:</div>
          <div className="text-white">Z / C</div>

          <div className="text-cyan-400">Look:</div>
          <div className="text-white">Click + Drag</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-900">
        <div className="text-xs text-cyan-400">
          {cameraMode === "fps" && "Manual control engaged"}
          {cameraMode === "follow" && "Target tracking active"}
          {cameraMode === "orbit" && "Orbital pattern established"}
        </div>
      </div>
    </div>
  );

  // Coordinates Panel
  const coordinatesPanel = (
    <div className="coordinates-panel-content">
      <div className="mb-3">
        <div className="data-label">Position</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="text-cyan-400">X:</div>
          <div className="text-white">
            {formatDistance(cameraPosition.x)} km
          </div>

          <div className="text-cyan-400">Y:</div>
          <div className="text-white">
            {formatDistance(cameraPosition.y)} km
          </div>

          <div className="text-cyan-400">Z:</div>
          <div className="text-white">
            {formatDistance(cameraPosition.z)} km
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="data-label">Flight Data</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="text-cyan-400">Speed:</div>
          <div className={`text-white ${velocityMagnitude > 50 ? "text-yellow-300" : ""}`}>
            {velocityMagnitude.toFixed(2)} km/s
          </div>

          <div className="text-cyan-400">Status:</div>
          <div className="text-white">
            {velocityMagnitude < 0.1 ? "Stationary" : "In Flight"}
          </div>
        </div>
      </div>

      {currentPlanet && (
        <div>
          <div className="data-label">Target Data</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="text-cyan-400">Object:</div>
            <div className="text-yellow-300">
              {currentPlanet.name}
            </div>

            <div className="text-cyan-400">Status:</div>
            <div className="text-white">
              {calculateTargetDistance() < 100000 ? "Proximity" : "Tracking"}
            </div>

            <div className="text-cyan-400">Distance:</div>
            <div className="text-white">
              {formatDistance(calculateTargetDistance())} km
            </div>
          </div>
        </div>
      )}
      
      <div className="holographic-scanline"></div>
    </div>
  );

  // Planet Selector Panel
  const planetSelectorPanel = (
    <div className="planet-selector-content">
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
        {planets.filter(p => p.name !== "Sun").map((planet) => (
          <div
            key={planet.name}
            className={`p-3 border border-blue-900 rounded hover:bg-blue-900/30 cursor-pointer ${
              mapSelectedPlanet?.name === planet.name
                ? "border-cyan-500 bg-blue-900/50"
                : ""
            }`}
            onClick={() => handleSelectPlanet(planet)}
          >
            <div className="flex justify-between items-center">
              <div className="font-bold text-cyan-300">{planet.name}</div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowPlanet(planet.name);
                  }}
                  className="game-panel-button"
                  title="Select and follow"
                >
                  👁️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWarpToPlanet(planet.name);
                  }}
                  className="game-panel-button"
                  title="Warp to planet"
                >
                  🚀
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Distance:{" "}
              {formatDistance(
                Math.sqrt(
                  Math.pow(cameraPosition.x - planet.position.x, 2) +
                    Math.pow(cameraPosition.y - planet.position.y, 2) +
                    Math.pow(cameraPosition.z - planet.position.z, 2)
                )
              )} km
            </div>
          </div>
        ))}
      </div>
    </div>
  );  

  // Map Panel
  const mapPanel = (
    <div className="map-panel-content" style={{ height: "310px" }}>
      {/* Use the actual HolographicMiniMap component here */}
      <div 
        className="holographic-map-container"
        style={{ 
          width: "100%", 
          height: "250px", 
          border: "1px solid rgba(64, 153, 255, 0.3)",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
          backgroundColor: "rgba(8, 15, 40, 0.6)"
        }}
      >
        <HolographicMiniMap 
          cameraPosition={cameraPosition}
          planets={planets}
          currentPlanet={currentPlanet}
          onSelectPlanet={handleSelectPlanet}
        />
      </div>
      <div className="mt-2 px-2">
        <div className="hologram-buttons-container">
          <button
            onClick={() => setShowDestinationSelector(true)}
            className="hologram-button"
          >
            <span className="hologram-button-text">Open Destination Selector</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Time Controls Panel
  const [showTimeControls, setShowTimeControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the current time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format the date in a futuristic way
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}.${month}.${day} | ${hours}:${minutes}:${seconds}`;
  };

  // Get appropriate class for time scale
  const getTimeScaleClass = () => {
    if (timeScale === 0) return "text-red-400";
    if (timeScale > 1000) return "text-yellow-300";
    return "text-cyan-300";
  };

  const timePanel = (
    <div className="time-panel-content">
      <div className="mb-3">
        <div className="data-label">System Time</div>
        <div className="text-white font-mono">{formatDate(currentTime)}</div>
      </div>

      <div className="mb-3">
        <div className="data-label">Simulation Rate</div>
        <div
          className={`data-value font-mono text-xl ${getTimeScaleClass()}`}
        >
          {timeScale === 0 ? "PAUSED" : `${timeScale}x`}
        </div>

        <div className="progress-bar mt-2">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(
                100,
                timeScale === 0 ? 0 : (Math.log10(timeScale) / 4) * 100
              )}%`,
              backgroundColor:
                timeScale > 1000
                  ? "#f59e0b"
                  : timeScale === 0
                  ? "#ef4444"
                  : "#60dfff",
            }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-2">
          <div className="data-label flex-1">Time Dilation Controls</div>
          <button
            onClick={() => setShowTimeControls(!showTimeControls)}
            className="game-panel-button"
          >
            {showTimeControls ? "-" : "+"}
          </button>
        </div>

        {showTimeControls && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => onSetTimeScale(0)}
              className={`hologram-button text-xs ${
                timeScale === 0 ? "hologram-button-danger" : ""
              }`}
            >
              <span className="hologram-button-text">Pause</span>
            </button>
            <button
              onClick={() => onSetTimeScale(1)}
              className={`hologram-button text-xs ${
                timeScale === 1 ? "hologram-button-primary" : ""
              }`}
            >
              <span className="hologram-button-text">1x</span>
            </button>
            <button
              onClick={() => onSetTimeScale(10)}
              className={`hologram-button text-xs ${
                timeScale === 10 ? "hologram-button-primary" : ""
              }`}
            >
              <span className="hologram-button-text">10x</span>
            </button>
            <button
              onClick={() => onSetTimeScale(100)}
              className={`hologram-button text-xs ${
                timeScale === 100 ? "hologram-button-primary" : ""
              }`}
            >
              <span className="hologram-button-text">100x</span>
            </button>
            <button
              onClick={() => onSetTimeScale(1000)}
              className={`hologram-button text-xs ${
                timeScale === 1000 ? "hologram-button-warning" : ""
              }`}
            >
              <span className="hologram-button-text">1000x</span>
            </button>
            <button
              onClick={() => onSetTimeScale(10000)}
              className={`hologram-button text-xs ${
                timeScale === 10000 ? "hologram-button-warning" : ""
              }`}
            >
              <span className="hologram-button-text">10000x</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-900">
        <div className="text-xs text-cyan-400">
          {timeScale === 0
            ? "Simulation paused"
            : timeScale === 1
            ? "Real-time simulation"
            : `Time acceleration: ${timeScale}x`}
        </div>
      </div>
    </div>
  );

  // Planet Info Panel
  const planetInfoPanel = mapSelectedPlanet && (
    <PlanetInfoPanel
      planet={mapSelectedPlanet}
      onClose={() => setShowPlanetInfo(false)}
      onWarp={() => onWarpToPlanet(mapSelectedPlanet.name)}
      onFollow={() => onFollowPlanet(mapSelectedPlanet.name)}
    />
  );

  // Help/Controls Panel
  const controlsPanel = (
    <div className="controls-panel-content">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hologram-panel-dark p-4">
          <h3 className="text-lg text-cyan-300 mb-3">Ship Movement</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-cyan-400">Forward/Backward</div>
            <div className="text-white">W / S</div>
            <div className="text-cyan-400">Strafe Left/Right</div>
            <div className="text-white">A / D</div>
            <div className="text-cyan-400">Ascend/Descend</div>
            <div className="text-white">Q / E</div>
            <div className="text-cyan-400">Roll Left/Right</div>
            <div className="text-white">Z / C</div>
            <div className="text-cyan-400">Boost Speed</div>
            <div className="text-white">SHIFT + W</div>
            <div className="text-cyan-400">Look Around</div>
            <div className="text-white">MOUSE DRAG</div>
          </div>
        </div>

        <div className="hologram-panel-dark p-4">
          <h3 className="text-lg text-cyan-300 mb-3">Navigation Modes</h3>
          <div className="space-y-2">
            <div>
              <div className="text-cyan-400">Free Flight</div>
              <div className="text-white text-sm">Manual control of spacecraft</div>
            </div>
            <div>
              <div className="text-cyan-400">Follow Mode</div>
              <div className="text-white text-sm">Automatically follow planet</div>
            </div>
            <div>
              <div className="text-cyan-400">Orbit Mode</div>
              <div className="text-white text-sm">Establish stable orbit around planet</div>
            </div>
            <div>
              <div className="text-cyan-400">Autopilot</div>
              <div className="text-white text-sm">Computer plots optimal course to target</div>
            </div>
            <div>
              <div className="text-cyan-400">Warp Drive</div>
              <div className="text-white text-sm">FTL travel between distant locations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CockpitInterface
        currentPlanet={currentPlanet}
        cameraPosition={cameraPosition}
        cameraVelocity={cameraVelocity}
        navigationPanel={navigationPanel}
        coordinatesPanel={coordinatesPanel}
        mapPanel={mapPanel}
        timePanel={timePanel}
        planetInfoPanel={planetInfoPanel}
        controlsPanel={controlsPanel}
        destinationPanel={planetSelectorPanel}
      >
        {/* Status bar at top */}
        {/* <div className="status-bar">
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
        </div> */}

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
        
        {/* Central autopilot/warp status indicator */}
        {(autopilotProgress > 0 || warpProgress > 0) && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div
              className={`text-2xl font-bold ${
                warpProgress > 0
                  ? "text-yellow-300"
                  : "text-cyan-300"
              }`}
            >
              {warpProgress > 0
                ? "WARP DRIVE ACTIVE"
                : "AUTOPILOT ENGAGED"}
            </div>
            <div className="text-lg">
              {currentPlanet && `Destination: ${currentPlanet.name}`}
            </div>
            <div className="mt-2 w-64 mx-auto">
              <div className="progress-bar h-2">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      (warpProgress > 0
                        ? warpProgress
                        : autopilotProgress) * 100
                    }%`,
                    backgroundColor:
                      warpProgress > 0 ? "#f59e0b" : "#60dfff",
                  }}
                ></div>
              </div>
            </div>
            <div className="text-sm mt-2">
              {warpProgress > 0
                ? `Warp progress: ${Math.round(warpProgress * 100)}%`
                : `Autopilot progress: ${Math.round(autopilotProgress * 100)}%`}
            </div>
          </div>
        )}
        
        {/* Destination Selector Modal */}
        {showDestinationSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="game-panel w-96 max-h-[80vh]">
              <div className="game-panel-header">
                <div className="game-panel-title">Select Destination</div>
                <button 
                  onClick={() => setShowDestinationSelector(false)}
                  className="game-panel-button"
                >
                  ✕
                </button>
              </div>
              <div className="game-panel-content max-h-[calc(80vh-120px)] overflow-y-auto">
                {planetSelectorPanel}
              </div>
              <div className="game-panel-footer">
                Click a planet to view details or select travel options
              </div>
            </div>
          </div>
        )}
        
        {/* Planet Info Modal */}
        {showPlanetInfo && mapSelectedPlanet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="game-panel w-[700px] max-h-[80vh]">
              <div className="game-panel-header">
                <div className="game-panel-title">{mapSelectedPlanet.name} Information</div>
                <button 
                  onClick={() => setShowPlanetInfo(false)}
                  className="game-panel-button"
                >
                  ✕
                </button>
              </div>
              <div className="game-panel-content">
                {planetInfoPanel}
              </div>
            </div>
          </div>
        )}
      </CockpitInterface>
    </>
  );
};

export default GameHUD;