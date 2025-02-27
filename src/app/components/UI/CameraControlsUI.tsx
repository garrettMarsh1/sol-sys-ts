import React, { useState, useEffect } from "react";
import { CameraMode } from "../Camera/AdvancedSpaceCamera";
import { Planet } from "../Interface/PlanetInterface";

interface CameraControlsUIProps {
  cameraMode: CameraMode;
  currentTarget: Planet | null;
  position: { x: number; y: number; z: number };
  speed: number;
  autopilotProgress: number;
  warpProgress: number;
  trajectoryInfo?: {
    estimatedTime: number;
    fuelRequired: number;
    success: boolean;
  } | null;
  onSetCameraMode: (mode: CameraMode) => void;
  onWarpToPlanet: (planetName: string) => void;
  onFollowPlanet: (planetName: string) => void;
  onStartAutopilot: () => void;
  onCancelAutopilot: () => void;
  planets: Planet[];
}

const CameraControlsUI: React.FC<CameraControlsUIProps> = ({
  cameraMode,
  currentTarget,
  position,
  speed,
  autopilotProgress,
  warpProgress,
  onSetCameraMode,
  onWarpToPlanet,
  onFollowPlanet,
  onStartAutopilot,
  onCancelAutopilot,
  planets,
}) => {
  const [showPlanetSelector, setShowPlanetSelector] = useState(false);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

    const formatDistance = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)} M km`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)} K km`;
    } else {
      return `${value.toFixed(2)} km`;
    }
  };

    const getSpeedColor = () => {
    if (speed > 50000) return "text-orange-400";
    if (speed > 10000) return "text-yellow-300";
    return "text-cyan-300";
  };

    const getModeText = () => {
    switch (cameraMode) {
      case CameraMode.FREE_FLIGHT:
        return "FREE FLIGHT";
      case CameraMode.AUTOPILOT:
        return "AUTOPILOT ENGAGED";
      case CameraMode.ORBIT:
        return "ORBITAL MODE";
      case CameraMode.FOLLOW:
        return "FOLLOW MODE";
      case CameraMode.WARPING:
        return "WARP DRIVE ACTIVE";
      default:
        return "UNKNOWN MODE";
    }
  };

    const targetablePlanets = planets.filter((p) => p.name !== "Sun");

  return (
    <div className="camera-controls-ui">
      {}
      <div className="absolute top-16 left-4 game-panel navigation-panel">
        <div className="game-panel-header">
          <div className="game-panel-title">Navigation Control</div>
          <div
            className={`status-indicator ${
              cameraMode === CameraMode.AUTOPILOT ||
              cameraMode === CameraMode.WARPING
                ? "status-warning"
                : "status-active"
            }`}
          ></div>
        </div>

        <div className="game-panel-content">
          {}
          <div className="mb-3">
            <div className="data-label">Current Position</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="data-label">X:</div>
              <div className="data-value font-mono">
                {formatDistance(position.x)}
              </div>
              <div className="data-label">Y:</div>
              <div className="data-value font-mono">
                {formatDistance(position.y)}
              </div>
              <div className="data-label">Z:</div>
              <div className="data-value font-mono">
                {formatDistance(position.z)}
              </div>
            </div>
          </div>

          {}
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="data-label">Speed:</div>
              <div className={`data-value font-mono ${getSpeedColor()}`}>
                {speed.toFixed(2)} km/s
              </div>
              <div className="data-label">Mode:</div>
              <div className="data-value font-mono">{getModeText()}</div>
            </div>
          </div>

          {}
          <div className="mb-3">
            <div className="data-label">Target</div>
            {currentTarget ? (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="data-label">Name:</div>
                <div className="data-value font-mono text-yellow-300">
                  {currentTarget.name}
                </div>
                <div className="data-label">Distance:</div>
                <div className="data-value font-mono">
                  {formatDistance(
                    Math.sqrt(
                      Math.pow(position.x - currentTarget.position.x, 2) +
                        Math.pow(position.y - currentTarget.position.y, 2) +
                        Math.pow(position.z - currentTarget.position.z, 2)
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic text-sm">
                No target selected
              </div>
            )}
          </div>

          {}
          <div className="space-y-2">
            {}
            <div className="flex space-x-2">
              <button
                onClick={() => onSetCameraMode(CameraMode.FREE_FLIGHT)}
                className={`game-button flex-1 ${
                  cameraMode === CameraMode.FREE_FLIGHT
                    ? "game-button-primary"
                    : ""
                }`}
              >
                Free Flight
              </button>
              {currentTarget && (
                <button
                  onClick={() => onSetCameraMode(CameraMode.ORBIT)}
                  className={`game-button flex-1 ${
                    cameraMode === CameraMode.ORBIT ? "game-button-primary" : ""
                  }`}
                >
                  Orbit
                </button>
              )}
              {currentTarget && (
                <button
                  onClick={() => onSetCameraMode(CameraMode.FOLLOW)}
                  className={`game-button flex-1 ${
                    cameraMode === CameraMode.FOLLOW
                      ? "game-button-primary"
                      : ""
                  }`}
                >
                  Follow
                </button>
              )}
            </div>

            {}
            {currentTarget && (
              <div className="flex space-x-2">
                <button
                  onClick={
                    cameraMode === CameraMode.AUTOPILOT
                      ? onCancelAutopilot
                      : onStartAutopilot
                  }
                  className={`game-button flex-1 ${
                    cameraMode === CameraMode.AUTOPILOT
                      ? "game-button-danger"
                      : "game-button-success"
                  }`}
                  disabled={cameraMode === CameraMode.WARPING}
                >
                  {cameraMode === CameraMode.AUTOPILOT
                    ? "Cancel Autopilot"
                    : "Start Autopilot"}
                </button>
                <button
                  onClick={() => onWarpToPlanet(currentTarget.name)}
                  className="game-button game-button-warning flex-1"
                  disabled={
                    cameraMode === CameraMode.WARPING ||
                    cameraMode === CameraMode.AUTOPILOT
                  }
                >
                  Warp
                </button>
              </div>
            )}

            {}
            <button
              onClick={() => setShowPlanetSelector(!showPlanetSelector)}
              className="game-button w-full"
            >
              {showPlanetSelector
                ? "Hide Planet Selector"
                : "Choose Destination"}
            </button>

            {}
            <button
              onClick={() => setShowControlsHelp(!showControlsHelp)}
              className="game-button w-full"
            >
              {showControlsHelp ? "Hide Controls" : "View Controls"}
            </button>
          </div>
        </div>

        {}
        <div className="game-panel-footer">
          {cameraMode === CameraMode.AUTOPILOT && (
            <div>
              <div className="text-xs mb-1">Autopilot Progress</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${autopilotProgress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          {cameraMode === CameraMode.WARPING && (
            <div>
              <div className="text-xs mb-1">Warp Progress</div>
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
          {cameraMode !== CameraMode.AUTOPILOT &&
            cameraMode !== CameraMode.WARPING && (
              <div>
                <span className="text-xs">Right-click planet to target</span>
              </div>
            )}
        </div>
      </div>

      {}
      {showPlanetSelector && (
        <div className="absolute top-20 left-64 game-panel planet-selector-panel">
          <div className="game-panel-header">
            <div className="game-panel-title">Destination Selector</div>
            <button
              onClick={() => setShowPlanetSelector(false)}
              className="game-panel-button"
            >
              ✕
            </button>
          </div>
          <div className="game-panel-content max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {targetablePlanets.map((planet) => (
                <div
                  key={planet.name}
                  className={`p-2 border border-blue-900 rounded hover:bg-blue-900/30 cursor-pointer ${
                    currentTarget?.name === planet.name
                      ? "border-cyan-500 bg-blue-900/50"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-cyan-300">{planet.name}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onFollowPlanet(planet.name)}
                        className="game-panel-button"
                        title="Select and follow"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => onWarpToPlanet(planet.name)}
                        className="game-panel-button"
                        title="Warp to planet"
                      >
                        Warp
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Distance:{" "}
                    {formatDistance(
                      Math.sqrt(
                        Math.pow(position.x - planet.position.x, 2) +
                          Math.pow(position.y - planet.position.y, 2) +
                          Math.pow(position.z - planet.position.z, 2)
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {}
      {showControlsHelp && (
        <div className="absolute top-20 right-4 game-panel controls-help-panel">
          <div className="game-panel-header">
            <div className="game-panel-title">Controls Guide</div>
            <button
              onClick={() => setShowControlsHelp(false)}
              className="game-panel-button"
            >
              ✕
            </button>
          </div>
          <div className="game-panel-content">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="data-label">Forward/Backward:</div>
              <div className="data-value">W / S</div>

              <div className="data-label">Strafe Left/Right:</div>
              <div className="data-value">A / D</div>

              <div className="data-label">Up/Down:</div>
              <div className="data-value">Q / E</div>

              <div className="data-label">Roll Left/Right:</div>
              <div className="data-value">Z / C</div>

              <div className="data-label">Speed Boost:</div>
              <div className="data-value">SHIFT</div>

              <div className="data-label">Brake:</div>
              <div className="data-value">SPACE</div>

              <div className="data-label">Toggle Autopilot:</div>
              <div className="data-value">F</div>

              <div className="data-label">Activate Warp:</div>
              <div className="data-value">R</div>

              <div className="data-label">Cancel Automated:</div>
              <div className="data-value">ESC</div>

              <div className="data-label">Look Around:</div>
              <div className="data-value">Left Mouse + Drag</div>

              <div className="data-label">Select Planet:</div>
              <div className="data-value">Right Mouse Click</div>

              <div className="data-label">Adjust Speed:</div>
              <div className="data-value">Mouse Wheel</div>
            </div>
          </div>
        </div>
      )}

      {}
      {(cameraMode === CameraMode.AUTOPILOT ||
        cameraMode === CameraMode.WARPING) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div
            className={`text-2xl font-bold ${
              cameraMode === CameraMode.WARPING
                ? "text-yellow-300"
                : "text-cyan-300"
            }`}
          >
            {cameraMode === CameraMode.WARPING
              ? "WARP DRIVE ACTIVE"
              : "AUTOPILOT ENGAGED"}
          </div>
          <div className="text-lg">
            {currentTarget && `Destination: ${currentTarget.name}`}
          </div>
          <div className="mt-2 w-64 mx-auto">
            <div className="progress-bar h-2">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${
                    (cameraMode === CameraMode.WARPING
                      ? warpProgress
                      : autopilotProgress) * 100
                  }%`,
                  backgroundColor:
                    cameraMode === CameraMode.WARPING ? "#f59e0b" : "#60dfff",
                }}
              ></div>
            </div>
          </div>
          <div className="text-sm mt-2">
            {cameraMode === CameraMode.WARPING
              ? `Warp progress: ${Math.round(warpProgress * 100)}%`
              : `Autopilot progress: ${Math.round(autopilotProgress * 100)}%`}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraControlsUI;