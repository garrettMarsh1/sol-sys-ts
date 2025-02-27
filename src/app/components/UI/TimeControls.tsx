import React, { useState, useEffect } from "react";

interface TimeControlsProps {
  timeScale: number;
  onSetTimeScale: (scale: number) => void;
  currentDate: string;
  relativisticEffects: boolean;
  onToggleRelativisticEffects: (enabled: boolean) => void;
  showOrbits: boolean;
  onToggleShowOrbits: (show: boolean) => void;
  onSetDate: (date: Date) => void;
}

const TimeControls: React.FC<TimeControlsProps> = ({
  timeScale,
  onSetTimeScale,
  currentDate = "",
  relativisticEffects = true,
  onToggleRelativisticEffects = () => {},
  showOrbits = false,
  onToggleShowOrbits = () => {},
  onSetDate = () => {},
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
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showPhysicsSettings, setShowPhysicsSettings] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

    useEffect(() => {
    if (currentDate) {
      try {
        setSelectedDate(new Date(currentDate));
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    }
  }, [currentDate]);

    const getTimeScaleClass = () => {
    if (timeScale === 0) return "text-red-400";
    if (timeScale > 1000) return "text-yellow-300";
    return "text-cyan-300";
  };

    const handleApplyDate = () => {
    onSetDate(selectedDate);
    setShowDateSelector(false);
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
          <div className="data-value font-mono">{currentDate}</div>
          <button
            onClick={() => setShowDateSelector(!showDateSelector)}
            className="game-button mt-2 w-full text-xs"
          >
            {showDateSelector ? "Cancel Date Selection" : "Set Date"}
          </button>

          {}
          {showDateSelector && (
            <div className="mt-2 p-2 border border-blue-900 rounded">
              <input
                type="datetime-local"
                className="bg-blue-900/30 border border-blue-800 text-white p-1 w-full mb-2 rounded"
                value={toLocalISOString(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleApplyDate}
                  className="game-button flex-1 text-xs"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowDateSelector(false)}
                  className="game-button flex-1 text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="text-xs text-cyan-300 mt-2">
                Set date to view the solar system configuration at specific
                times
              </div>
            </div>
          )}
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

        {}
        <div className="mt-4 pt-3 border-t border-blue-900">
          <div className="flex items-center mb-2">
            <div className="data-label flex-1">Physics Settings</div>
            <button
              onClick={() => setShowPhysicsSettings(!showPhysicsSettings)}
              className="game-panel-button"
            >
              {showPhysicsSettings ? "-" : "+"}
            </button>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Relativistic Effects</span>
              <button
                onClick={() =>
                  onToggleRelativisticEffects(!relativisticEffects)
                }
                className={`game-button text-xs ${
                  relativisticEffects ? "game-button-primary" : ""
                }`}
              >
                {relativisticEffects ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Show Orbits</span>
              <button
                onClick={() => onToggleShowOrbits(!showOrbits)}
                className={`game-button text-xs ${
                  showOrbits ? "game-button-primary" : ""
                }`}
              >
                {showOrbits ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>

          {}
          {showPhysicsSettings && (
            <div className="mt-3 p-2 border border-blue-900 rounded bg-blue-900/20">
              <div className="text-xs text-cyan-300 mb-1">
                Relativistic effects include:
              </div>
              <ul className="text-xs text-gray-300 ml-4 list-disc space-y-1">
                <li>Perihelion precession (most notable in Mercury)</li>
                <li>Gravitational light deflection</li>
                <li>Time dilation near massive objects</li>
                <li>Relativistic orbital corrections</li>
              </ul>
              <div className="text-xs text-gray-300 mt-2">
                Based on Einstein's General Theory of Relativity
              </div>
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
