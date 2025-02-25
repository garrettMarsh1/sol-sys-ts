import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solar System Visualization",
  description: "A 3D visualization of the solar system using Three.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
