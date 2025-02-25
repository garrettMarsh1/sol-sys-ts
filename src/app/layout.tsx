// src/app/layout.tsx

"use-client";

import "./globals.css";
import React from "react";

export const metadata = {
  title: "Solar System Visualization",
  description: "A 3D visualization of the solar system using Three.js",
};

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="src/app/globals.css" />
      </head>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
