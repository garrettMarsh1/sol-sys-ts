"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import "./components/UI/GameUI.css";

// Use dynamic import with ssr: false to only load MainScene component on the client side
const MainScene = dynamic(() => import("./components/MainScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center">
        <h2 className="text-2xl mb-4">Loading Solar System...</h2>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  ),
});

const HomePage: React.FC = () => {
  // Add custom cursor via useEffect to avoid hydration issues
  useEffect(() => {
    // Add special cursor style for a more game-like feel
    document.body.classList.add("game-cursor");

    // Optional: Add some star background to the page
    const starBackground = document.createElement("div");
    starBackground.className = "star-background";
    document.body.appendChild(starBackground);

    // Cleanup
    return () => {
      document.body.classList.remove("game-cursor");
      if (document.body.contains(starBackground)) {
        document.body.removeChild(starBackground);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <MainScene />
    </div>
  );
};

export default HomePage;
