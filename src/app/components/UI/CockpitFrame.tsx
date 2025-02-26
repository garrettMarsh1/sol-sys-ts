// src/app/components/UI/CockpitFrame.tsx
import React, { useEffect, useState } from "react";

interface CockpitFrameProps {
  cameraVelocity: { x: number; y: number; z: number };
}

const CockpitFrame: React.FC<CockpitFrameProps> = ({ cameraVelocity }) => {
  const [forwardThrust, setForwardThrust] = useState(0);
  const [lateralThrust, setLateralThrust] = useState(0);
  const [verticalThrust, setVerticalThrust] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [speedPercent, setSpeedPercent] = useState(0);

  // Calculate the velocity magnitude
  useEffect(() => {
    const velocityMagnitude = Math.sqrt(
      cameraVelocity.x * cameraVelocity.x +
      cameraVelocity.y * cameraVelocity.y +
      cameraVelocity.z * cameraVelocity.z
    );

    // Normalize to percentage (assuming max speed of 100 km/s)
    const maxSpeed = 100;
    const percent = Math.min(100, (velocityMagnitude / maxSpeed) * 100);
    setSpeedPercent(percent);

    // Set forward thrust
    setForwardThrust(Math.abs(cameraVelocity.z) / maxSpeed * 100);
    setLateralThrust(Math.abs(cameraVelocity.x) / maxSpeed * 100);
    setVerticalThrust(Math.abs(cameraVelocity.y) / maxSpeed * 100);

    // Show warning at high speeds
    if (velocityMagnitude > 75) {
      setWarning("WARNING: APPROACHING MAXIMUM VELOCITY");
    } else {
      setWarning(null);
    }
  }, [cameraVelocity]);

  return (
    <>
      {/* Cockpit frame using CSS */}
      <div className="cockpit-frame-css">
        <div className="cockpit-side-left"></div>
        <div className="cockpit-side-right"></div>
      </div>

      {/* Warning message */}
      {warning && (
        <div className="hud-warning">{warning}</div>
      )}

      {/* Thruster indicators */}
      <div className="thruster-indicators">
        <div className="thruster-bar" style={{ marginRight: '10px' }}>
          <div className="thruster-label">LATERAL</div>
          <div className="thruster-fill" style={{ width: `${lateralThrust}%` }}></div>
        </div>
        <div className="thruster-bar">
          <div className="thruster-label">FORWARD</div>
          <div className="thruster-fill" style={{ width: `${forwardThrust}%` }}></div>
        </div>
        <div className="thruster-bar" style={{ marginLeft: '10px' }}>
          <div className="thruster-label">VERTICAL</div>
          <div className="thruster-fill" style={{ width: `${verticalThrust}%` }}></div>
        </div>
      </div>

      {/* Speedometer */}
      <div className="speedometer">
        <div 
          className="speedometer-needle"
          style={{ transform: `translateX(-50%) rotate(${speedPercent * 1.8 - 90}deg)` }}
        ></div>
        <div className="speedometer-dial"></div>
        <div className="speedometer-value">{Math.round(speedPercent)}</div>
        <div className="speedometer-label">VELOCITY %</div>
      </div>

      {/* Status indicators */}
      <div className="status-indicators">
        <div className="status-item">
          <div className="status-indicator status-active"></div>
          <div className="status-label">SHIELDS</div>
          <div className="status-value">100%</div>
        </div>
        <div className="status-item">
          <div className="status-indicator status-active"></div>
          <div className="status-label">FUEL</div>
          <div className="status-value">98%</div>
        </div>
        <div className="status-item">
          <div className="status-indicator status-active"></div>
          <div className="status-label">LIFE SUP.</div>
          <div className="status-value">NOMINAL</div>
        </div>
      </div>

      {/* Center targeting reticle with dots */}
      <div className="targeting-reticle">
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
        <div className="targeting-reticle-dot"></div>
      </div>
    </>
  );
};

export default CockpitFrame;