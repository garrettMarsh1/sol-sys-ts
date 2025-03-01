import React, { useState, useEffect } from "react";

interface CoordinatesDisplayProps {
  position: { x: number; y: number; z: number };
  velocity: number;
  targetDistance: number | null;
  currentPlanet: any | null;
}

const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  position,
  velocity,
  targetDistance,
  currentPlanet,
}) => {
  const [animatedVelocity, setAnimatedVelocity] = useState(0);

    useEffect(() => {
    setAnimatedVelocity((prev) => {
      const diff = velocity - prev;
      return prev + diff * 0.1;
    });
  }, [velocity]);

    const formatDistance = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)} M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)} K`;
    } else {
      return `${value.toFixed(2)}`;
    }
  };

    const getVelocityColor = () => {
    if (animatedVelocity > 100) return "text-orange-400";
    if (animatedVelocity > 50) return "text-yellow-300";
    return "text-cyan-300";
  };

    const getTargetStatus = () => {
    if (!currentPlanet) return "No Target";
    if (targetDistance && targetDistance < 100000) return "Proximity";
    return "Tracking";
  };

  return (
    <div className="absolute top-[80px] left-[50px] coordinates-panel game-panel">
      <div className="game-panel-header">
        <div className="game-panel-title">Navigation System</div>
        <div
          className={`status-indicator ${
            currentPlanet ? "status-active" : "status-warning"
          }`}
        ></div>
      </div>

      <div className="game-panel-content">
        <div className="mb-3">
          <div className="data-label">Position</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="data-label">X:</div>
            <div className="data-value font-mono">
              {formatDistance(position.x)} km
            </div>

            <div className="data-label">Y:</div>
            <div className="data-value font-mono">
              {formatDistance(position.y)} km
            </div>

            <div className="data-label">Z:</div>
            <div className="data-value font-mono">
              {formatDistance(position.z)} km
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="data-label">Flight Data</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="data-label">Speed:</div>
            <div className={`data-value font-mono ${getVelocityColor()}`}>
              {animatedVelocity.toFixed(2)} km/s
            </div>

            <div className="data-label">Status:</div>
            <div className="data-value font-mono">
              {velocity < 0.1 ? "Stationary" : "In Flight"}
            </div>
          </div>
        </div>

        {currentPlanet && (
          <div>
            <div className="data-label">Target Data</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="data-label">Object:</div>
              <div className="data-value font-mono text-yellow-300">
                {currentPlanet.name}
              </div>

              <div className="data-label">Status:</div>
              <div className="data-value font-mono">{getTargetStatus()}</div>

              {targetDistance !== null && (
                <>
                  <div className="data-label">Distance:</div>
                  <div className="data-value font-mono">
                    {formatDistance(targetDistance)} km
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {}
      <div className="holographic-scanline"></div>
    </div>
  );
};

export default CoordinatesDisplay;