// src/app/components/UI/TimeControls.tsx
import React, { useState, useEffect } from "react";

interface TimeControlsProps {
  timeScale: number;
  onSetTimeScale: (scale: number) => void;
}

const TimeControls: React.FC<TimeControlsProps> = ({
  timeScale,
  onSetTimeScale,
}) => {
  const timeScaleOptions = [
    { label: "Pause", value: 0 },
    { label: "1x", value: 1 },
    { label: "10x", value: 10 },
    { label: "100x", value: 100 },
    { label: "1000x", value: 1000 },
    { label: "10000x", value: 10000 },
  ];

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

  return (
    <div className="absolute bottom-4 right-4 time-controls-panel game-panel">
      <div className="game-panel-header">
        <div className="game-panel-title">Temporal Control</div>
        <div
          className={`status-indicator ${
            timeScale === 0 ? "status-warning" : "status-active"
          }`}
        ></div>
      </div>

      <div className="game-panel-content">
        <div className="mb-3">
          <div className="data-label">System Time</div>
          <div className="data-value font-mono">{formatDate(currentTime)}</div>
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
              {showTimeControls ? "Hide" : "Adjust"}
            </button>
          </div>

          {showTimeControls && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {timeScaleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSetTimeScale(option.value)}
                  className={`game-button text-xs ${
                    timeScale === option.value
                      ? option.value === 0
                        ? "game-button-danger"
                        : option.value > 1000
                        ? "game-button-warning"
                        : "game-button-primary"
                      : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="game-panel-footer">
        {timeScale === 0
          ? "Simulation paused"
          : timeScale === 1
          ? "Real-time simulation"
          : `Time acceleration: ${timeScale}x`}
      </div>
    </div>
  );
};

export default TimeControls;
