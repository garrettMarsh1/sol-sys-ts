// src/app/components/UI/CockpitInterface.tsx
import React, { useState } from "react";
import { CSSTransition } from "react-transition-group";

interface CockpitInterfaceProps {
  children: React.ReactNode;
  cameraPosition: { x: number; y: number; z: number };
  cameraVelocity: { x: number; y: number; z: number };
  currentPlanet: any | null;
}

// Panel positions and types
export type PanelPosition = "left" | "right" | "top" | "bottom";
export type PanelType = "navigation" | "coordinates" | "planetInfo" | "map" | "time" | "controls";

// Panel configuration interface
interface PanelConfig {
  type: PanelType;
  label: string;
  position: PanelPosition;
  icon: string;
  component: React.ReactNode;
}

const CockpitInterface: React.FC<CockpitInterfaceProps> = ({ 
  children, 
  cameraPosition, 
  cameraVelocity, 
  currentPlanet 
}) => {
  // Track which panels are visible
  const [visiblePanels, setVisiblePanels] = useState<PanelType[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<any | null>(null);
  
  // Function to toggle panel visibility
  const togglePanel = (panelType: PanelType) => {
    setVisiblePanels(prev => 
      prev.includes(panelType) 
        ? prev.filter(p => p !== panelType) 
        : [...prev, panelType]
    );
  };

  // Function to check if panel is visible
  const isPanelVisible = (panelType: PanelType): boolean => {
    return visiblePanels.includes(panelType);
  };

  // Function to show planet details
  const showPlanetDetails = (planet: any) => {
    setSelectedPlanet(planet);
    if (!isPanelVisible("planetInfo")) {
      togglePanel("planetInfo");
    }
  };

  // Get the animation class for a panel based on its position
  const getPanelAnimationClass = (position: PanelPosition): string => {
    switch (position) {
      case "left": return "panel-slide-left";
      case "right": return "panel-slide-right";
      case "top": return "panel-slide-top";
      case "bottom": return "panel-slide-bottom";
      default: return "panel-slide-left";
    }
  };

  return (
    <div className="cockpit-interface">
      {/* Main cockpit frame with interactive buttons */}
      <div className="cockpit-frame">
        {/* Left side cockpit controls */}
        <div className="cockpit-controls-left">
          <button 
            className={`cockpit-button ${isPanelVisible("navigation") ? "cockpit-button-active" : ""}`} 
            onClick={() => togglePanel("navigation")}
          >
            <span className="cockpit-button-icon">⚙️</span>
            <span className="cockpit-button-label">NAV</span>
          </button>
          
          <button 
            className={`cockpit-button ${isPanelVisible("coordinates") ? "cockpit-button-active" : ""}`} 
            onClick={() => togglePanel("coordinates")}
          >
            <span className="cockpit-button-icon">🔍</span>
            <span className="cockpit-button-label">SYS</span>
          </button>
          
          <button 
            className={`cockpit-button ${isPanelVisible("controls") ? "cockpit-button-active" : ""}`} 
            onClick={() => togglePanel("controls")}
          >
            <span className="cockpit-button-icon">📋</span>
            <span className="cockpit-button-label">CTRL</span>
          </button>
        </div>
        
        {/* Right side cockpit controls */}
        <div className="cockpit-controls-right">
          <button 
            className={`cockpit-button ${isPanelVisible("map") ? "cockpit-button-active" : ""}`} 
            onClick={() => togglePanel("map")}
          >
            <span className="cockpit-button-icon">🗺️</span>
            <span className="cockpit-button-label">MAP</span>
          </button>
          
          <button 
            className={`cockpit-button ${isPanelVisible("time") ? "cockpit-button-active" : ""}`} 
            onClick={() => togglePanel("time")}
          >
            <span className="cockpit-button-icon">⏱️</span>
            <span className="cockpit-button-label">TIME</span>
          </button>
          
          {currentPlanet && (
            <button 
              className={`cockpit-button ${isPanelVisible("planetInfo") ? "cockpit-button-active" : ""}`} 
              onClick={() => togglePanel("planetInfo")}
            >
              <span className="cockpit-button-icon">🪐</span>
              <span className="cockpit-button-label">SCAN</span>
            </button>
          )}
        </div>
        
        {/* Central targeting system */}
        <div className="cockpit-center-controls">
          <div className="targeting-reticle">
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
            <div className="targeting-reticle-dot"></div>
          </div>
        </div>
      </div>
      
      {/* Animated panel containers */}
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
            <div className="panel-content">
              {/* Navigation panel will be inserted here */}
            </div>
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
            <div className="panel-content">
              {/* Coordinates panel will be inserted here */}
            </div>
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
            <div className="panel-content">
              {/* Map panel will be inserted here */}
            </div>
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
            <div className="panel-content">
              {/* Time panel will be inserted here */}
            </div>
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
              <h3>{(currentPlanet || selectedPlanet)?.name} Details</h3>
              <button 
                className="panel-close-button" 
                onClick={() => togglePanel("planetInfo")}
              >
                ×
              </button>
            </div>
            <div className="panel-content">
              {/* Planet info panel will be inserted here */}
            </div>
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
            <div className="panel-content">
              {/* Controls panel will be inserted here */}
            </div>
          </div>
        </div>
      </CSSTransition>
      
      {/* Pass through children (original UI elements) */}
      {children}
    </div>
  );
};

export default CockpitInterface;