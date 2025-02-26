"use client";

import React, { useEffect } from "react";
import MainScene from "./components/MainScene";
import "./components/UI/GameUI.css";

const HomePage: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("game-cursor");

    const starBackground = document.createElement("div");
    starBackground.className = "star-background";
    document.body.appendChild(starBackground);

    return () => {
      document.body.classList.remove("game-cursor");
      if (document.body.contains(starBackground)) {
        document.body.removeChild(starBackground);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing Solar System Simulation</div>
      </div>

      <MainScene />
    </div>
  );
};

export default HomePage;
