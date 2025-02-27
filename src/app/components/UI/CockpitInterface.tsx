import React, { useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";

interface CockpitInterfaceProps {
  children: React.ReactNode;
  currentPlanet: any | null;
  cameraPosition: { x: number; y: number; z: number };
  cameraVelocity: { x: number; y: number; z: number };
  navigationPanel: React.ReactNode;
  coordinatesPanel: React.ReactNode;
  mapPanel: React.ReactNode;
  timePanel: React.ReactNode;
  planetInfoPanel: React.ReactNode;
  controlsPanel: React.ReactNode;
  destinationPanel: React.ReactNode;
}

export type PanelPosition = "left" | "right" | "top" | "bottom";
export type PanelType =
  | "navigation"
  | "coordinates"
  | "planetInfo"
  | "map"
  | "time"
  | "controls"
  | "destination";

const CockpitInterface: React.FC<CockpitInterfaceProps> = ({
  children,
  cameraPosition,
  cameraVelocity,
  currentPlanet,
  navigationPanel,
  coordinatesPanel,
  mapPanel,
  timePanel,
  planetInfoPanel,
  controlsPanel,
  destinationPanel,
}) => {
    const [visiblePanels, setVisiblePanels] = useState<PanelType[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<any | null>(null);

    useEffect(() => {
    if (currentPlanet) {
      setSelectedPlanet(currentPlanet);
    }
  }, [currentPlanet]);

    const togglePanel = (panelType: PanelType) => {
    console.log(`Toggling panel: ${panelType}`);

        if (panelType === "destination") {
            if (isPanelVisible("map")) {
        setVisiblePanels((prev) => prev.filter((p) => p !== "map"));
      }
    }

        if (panelType === "map") {
            if (isPanelVisible("destination")) {
        setVisiblePanels((prev) => prev.filter((p) => p !== "destination"));
      }
    }

    setVisiblePanels((prev) =>
      prev.includes(panelType)
        ? prev.filter((p) => p !== panelType)
        : [...prev, panelType]
    );
  };

    const isPanelVisible = (panelType: PanelType): boolean => {
    return visiblePanels.includes(panelType);
  };

    const showPlanetDetails = (planet: any) => {
    setSelectedPlanet(planet);
    if (!isPanelVisible("planetInfo")) {
      togglePanel("planetInfo");
    }
  };

    const getPanelAnimationClass = (position: PanelPosition): string => {
    switch (position) {
      case "left":
        return "panel-slide-left";
      case "right":
        return "panel-slide-right";
      case "top":
        return "panel-slide-top";
      case "bottom":
        return "panel-slide-bottom";
      default:
        return "panel-slide-left";
    }
  };

  return (
    <div className="cockpit-interface">
      {}
      <div className="cockpit-frame">
        {}
        <div className="cockpit-controls-left">
          <button
            className={`cockpit-button ${
              isPanelVisible("navigation") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("navigation")}
          >
            <span className="cockpit-button-icon">⚙️</span>
            <span className="cockpit-button-label">NAV</span>
          </button>

          <button
            className={`cockpit-button ${
              isPanelVisible("coordinates") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("coordinates")}
          >
            <span className="cockpit-button-icon">🔍</span>
            <span className="cockpit-button-label">SYS</span>
          </button>

          <button
            className={`cockpit-button ${
              isPanelVisible("controls") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("controls")}
          >
            <span className="cockpit-button-icon">📋</span>
            <span className="cockpit-button-label">CTRL</span>
          </button>

          <button
            className={`cockpit-button ${
              isPanelVisible("destination") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("destination")}
          >
            <span className="cockpit-button-icon">🚀</span>
            <span className="cockpit-button-label">DEST</span>
          </button>
        </div>

        {}
        <div className="cockpit-controls-right">
          <button
            className={`cockpit-button ${
              isPanelVisible("map") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("map")}
          >
            <span className="cockpit-button-icon">🗺️</span>
            <span className="cockpit-button-label">MAP</span>
          </button>

          <button
            className={`cockpit-button ${
              isPanelVisible("time") ? "cockpit-button-active" : ""
            }`}
            onClick={() => togglePanel("time")}
          >
            <span className="cockpit-button-icon">⏱️</span>
            <span className="cockpit-button-label">TIME</span>
          </button>

          {currentPlanet && (
            <button
              className={`cockpit-button ${
                isPanelVisible("planetInfo") ? "cockpit-button-active" : ""
              }`}
              onClick={() => togglePanel("planetInfo")}
            >
              <span className="cockpit-button-icon">🪐</span>
              <span className="cockpit-button-label">INFO</span>
            </button>
          )}
        </div>

        {}
        <div className="cockpit-center-controls">
          <div className="targeting-reticle">
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
          </div>
        </div>
      </div>

      {}
      <CSSTransition
        in={isPanelVisible("navigation")}
        timeout={300}
        classNames={getPanelAnimationClass("left")}
        unmountOnExit
      >
        <div className="panel-container panel-left">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Navigation Control</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("navigation")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{navigationPanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("coordinates")}
        timeout={300}
        classNames={getPanelAnimationClass("left")}
        unmountOnExit
      >
        <div className="panel-container panel-left panel-offset-1">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Coordinates System</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("coordinates")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{coordinatesPanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("map")}
        timeout={300}
        classNames={getPanelAnimationClass("right")}
        unmountOnExit
      >
        <div className="panel-container panel-right">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Star Map</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("map")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{mapPanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("time")}
        timeout={300}
        classNames={getPanelAnimationClass("right")}
        unmountOnExit
      >
        <div className="panel-container panel-right panel-offset-1">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Time Controls</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("time")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{timePanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("planetInfo") && (currentPlanet || selectedPlanet)}
        timeout={300}
        classNames="panel-fade"
        unmountOnExit
      >
        <div className="panel-container panel-center planet-info-panel">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>{(currentPlanet || selectedPlanet)?.name} Scanner</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("planetInfo")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{planetInfoPanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("controls")}
        timeout={300}
        classNames={getPanelAnimationClass("bottom")}
        unmountOnExit
      >
        <div className="panel-container panel-bottom">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Flight Controls</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("controls")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{controlsPanel}</div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        in={isPanelVisible("destination")}
        timeout={300}
        classNames={getPanelAnimationClass("left")}
        unmountOnExit
      >
        <div className="panel-container panel-right panel-offset-1">
          <div className="hologram-effect">
            <div className="panel-header">
              <h3>Destination Selector</h3>
              <button
                className="panel-close-button"
                onClick={() => togglePanel("destination")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">{destinationPanel}</div>
          </div>
        </div>
      </CSSTransition>

      {}
      {children}
    </div>
  );
};

export default CockpitInterface;
