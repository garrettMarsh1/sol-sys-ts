import React from "react";

interface NavigationControlsProps {
  onToggleCameraMode: (mode: "fps" | "follow" | "orbit") => void;
  cameraMode: "fps" | "follow" | "orbit";
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  onToggleCameraMode,
  cameraMode,
}) => {
  return (
    <div className="absolute bottom-4 left-4 navigation-panel game-panel">
      <div className="game-panel-header">
        <div className="game-panel-title">Flight Control System</div>
        <div className="status-indicator status-active"></div>
      </div>

      <div className="game-panel-content">
        <div className="mb-3">
          <div className="data-label mb-2">Navigation Mode</div>
          <div className="flex space-x-2">
            <button
              onClick={() => onToggleCameraMode("fps")}
              className={`game-button ${
                cameraMode === "fps" ? "game-button-primary" : ""
              }`}
            >
              Free Flight
            </button>
            <button
              onClick={() => onToggleCameraMode("follow")}
              className={`game-button ${
                cameraMode === "follow" ? "game-button-primary" : ""
              }`}
            >
              Follow
            </button>
            <button
              onClick={() => onToggleCameraMode("orbit")}
              className={`game-button ${
                cameraMode === "orbit" ? "game-button-primary" : ""
              }`}
            >
              Orbit
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
            <div className="flex justify-between text-xs">
              <span>Manual</span>
              <span>Assisted</span>
              <span>Auto</span>
            </div>
          </div>
        </div>

        <div>
          <div className="data-label mb-1">Control Reference</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="data-label">Movement:</div>
            <div className="data-value">WASD + QE</div>

            <div className="data-label">Boost:</div>
            <div className="data-value">SHIFT + W</div>

            <div className="data-label">Roll:</div>
            <div className="data-value">Z / C</div>

            <div className="data-label">Look:</div>
            <div className="data-value">Click + Drag</div>
          </div>
        </div>
      </div>

      <div className="game-panel-footer">
        {cameraMode === "fps" && "Manual control engaged"}
        {cameraMode === "follow" && "Target tracking active"}
        {cameraMode === "orbit" && "Orbital pattern established"}
      </div>
    </div>
  );
};

export default NavigationControls;
