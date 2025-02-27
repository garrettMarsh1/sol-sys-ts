import React, { useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import { PanelType } from "./CockpitInterface";

interface CockpitFrameProps {
  cameraVelocity: { x: number; y: number; z: number };
  onTogglePanel: (panelType: PanelType) => void;
  activePanels: PanelType[];
  cameraMode: string;
  timeScale: number;
  currentPlanet: any | null;
  autopilotProgress?: number;
  warpProgress?: number;
}

const Cockpit3DFrame: React.FC<CockpitFrameProps> = ({
  cameraVelocity,
  onTogglePanel,
  activePanels,
  cameraMode,
  timeScale,
  currentPlanet,
  autopilotProgress = 0,
  warpProgress = 0,
}) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [speedPercent, setSpeedPercent] = useState(0);
  const [forwardThrust, setForwardThrust] = useState(0);
  const [lateralThrust, setLateralThrust] = useState(0);
  const [verticalThrust, setVerticalThrust] = useState(0);
  const [shieldStatus, setShieldStatus] = useState(100);
  const [fuelStatus, setFuelStatus] = useState(98);

  // Calculate velocity and set warnings
  useEffect(() => {
    const velocityMagnitude = Math.sqrt(
      cameraVelocity.x * cameraVelocity.x +
      cameraVelocity.y * cameraVelocity.y +
      cameraVelocity.z * cameraVelocity.z
    );

    const maxSpeed = 100;
    const percent = Math.min(100, (velocityMagnitude / maxSpeed) * 100);
    setSpeedPercent(percent);

    setForwardThrust(Math.abs(cameraVelocity.z) / maxSpeed * 100);
    setLateralThrust(Math.abs(cameraVelocity.x) / maxSpeed * 100);
    setVerticalThrust(Math.abs(cameraVelocity.y) / maxSpeed * 100);

    if (velocityMagnitude > 75) {
      setWarning("WARNING: APPROACHING MAXIMUM VELOCITY");
    } else if (velocityMagnitude > 50) {
      setWarning("CAUTION: HIGH VELOCITY");
    } else {
      setWarning(null);
    }
  }, [cameraVelocity]);

  // Check if a panel is active
  const isPanelActive = (panelType: PanelType): boolean => {
    return activePanels.includes(panelType);
  };

  return (
    <>
      {/* Main 3D Cockpit Structure */}
      <div className="cockpit-3d-frame">
        {/* Top Viewport Glass Simulation */}
        <div className="cockpit-viewport"></div>

        {/* Top Frame with Status Indicators */}
        <div className="cockpit-top-frame">
          <div className="status-display">
            <div className="status-item">
              <div className="status-indicator status-active"></div>
              <div className="status-label">SHIELDS</div>
              <div className="status-value">{shieldStatus}%</div>
            </div>
            <div className="status-item">
              <div className="status-indicator status-active"></div>
              <div className="status-label">FUEL</div>
              <div className="status-value">{fuelStatus}%</div>
            </div>
            <div className="status-item">
              <div className="status-indicator status-active"></div>
              <div className="status-label">MODE</div>
              <div className="status-value">
                {cameraMode === "WARPING" ? "WARP" : cameraMode}
              </div>
            </div>
            {timeScale > 0 && (
              <div className="status-item">
                <div className={`status-indicator ${timeScale > 1000 ? "status-warning" : "status-active"}`}></div>
                <div className="status-label">TIME</div>
                <div className="status-value">{timeScale}x</div>
              </div>
            )}
          </div>
        </div>

        {/* Left Side Control Panel */}
        <div className="cockpit-side-panel cockpit-side-panel-left">
          <button
            className={`cockpit-3d-button ${
              isPanelActive("navigation") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("navigation")}
          >
            {isPanelActive("navigation") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">⚙️</span>
            <span className="cockpit-button-label">Navigation</span>
          </button>

          <button
            className={`cockpit-3d-button ${
              isPanelActive("coordinates") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("coordinates")}
          >
            {isPanelActive("coordinates") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">🔍</span>
            <span className="cockpit-button-label">Systems</span>
          </button>

          <button
            className={`cockpit-3d-button ${
              isPanelActive("controls") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("controls")}
          >
            {isPanelActive("controls") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">📋</span>
            <span className="cockpit-button-label">Controls</span>
          </button>

          <button
            className={`cockpit-3d-button ${
              isPanelActive("destination") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("destination")}
          >
            {isPanelActive("destination") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">🚀</span>
            <span className="cockpit-button-label">Destination</span>
          </button>
        </div>

        {/* Right Side Control Panel */}
        <div className="cockpit-side-panel cockpit-side-panel-right">
          <button
            className={`cockpit-3d-button ${
              isPanelActive("map") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("map")}
          >
            {isPanelActive("map") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">🗺️</span>
            <span className="cockpit-button-label">Star Map</span>
          </button>

          <button
            className={`cockpit-3d-button ${
              isPanelActive("time") ? "cockpit-3d-button-active" : ""
            }`}
            onClick={() => onTogglePanel("time")}
          >
            {isPanelActive("time") && <div className="led-indicator led-active"></div>}
            <span className="cockpit-button-icon">⏱️</span>
            <span className="cockpit-button-label">Time Flow</span>
          </button>

          {currentPlanet && (
            <button
              className={`cockpit-3d-button ${
                isPanelActive("planetInfo") ? "cockpit-3d-button-active" : ""
              }`}
              onClick={() => onTogglePanel("planetInfo")}
            >
              {isPanelActive("planetInfo") && <div className="led-indicator led-active"></div>}
              <span className="cockpit-button-icon">🪐</span>
              <span className="cockpit-button-label">Planet Info</span>
            </button>
          )}

          <button
            className="cockpit-3d-button button-type-warning"
          >
            <span className="cockpit-button-icon">⚠️</span>
            <span className="cockpit-button-label">Systems</span>
          </button>
        </div>

        {/* Main Dashboard */}
        <div className="cockpit-dashboard">
          <div className="dashboard-panels">
            <div className="dashboard-left">
              {/* Thruster indicators */}
              <div className="thruster-bar">
                <div className="thruster-label">LATERAL</div>
                <div className="thruster-fill" style={{ width: `${lateralThrust}%` }}></div>
              </div>
            </div>
            
            <div className="dashboard-center">
              {/* Central radar and targeting system */}
              <div className="targeting-reticle">
                <div className="targeting-reticle-dot" style={{ top: -2, left: -2 }}></div>
                <div className="targeting-reticle-dot" style={{ top: -2, right: -2 }}></div>
                <div className="targeting-reticle-dot" style={{ bottom: -2, right: -2 }}></div>
                <div className="targeting-reticle-dot" style={{ bottom: -2, left: -2 }}></div>
              </div>
              
              {/* Autopilot or warp progress display */}
              {(autopilotProgress > 0 || warpProgress > 0) && (
                <div className="progress-display">
                  <div className="progress-label">
                    {warpProgress > 0 ? "WARP DRIVE" : "AUTOPILOT"}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(warpProgress > 0 ? warpProgress : autopilotProgress) * 100}%`,
                        backgroundColor: warpProgress > 0 ? "#f59e0b" : "#60dfff",
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="dashboard-right">
              {/* Forward thruster indicator */}
              <div className="thruster-bar">
                <div className="thruster-label">FORWARD</div>
                <div className="thruster-fill" style={{ width: `${forwardThrust}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Speedometer */}
        <div className="speedometer">
          <div 
            className="speedometer-needle"
            style={{ transform: `translateX(-50%) rotate(${speedPercent * 1.8 - 90}deg)` }}
          ></div>
          <div className="speedometer-dial"></div>
          <div className="speedometer-value">{Math.round(speedPercent)}</div>
          <div className="speedometer-label">VELOCITY %</div>
        </div>
      </div>

      {/* Warning display */}
      {warning && (
        <div className="hud-warning">{warning}</div>
      )}

      {/* Targeting reticle in the center of screen */}
      <div className="targeting-reticle">
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
      </div>
    </>
  );
};

export default Cockpit3DFrame;