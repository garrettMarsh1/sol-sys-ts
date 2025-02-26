import * as THREE from "three";

export interface Planet {
  // Basic identification
  name: string;

  // Position and motion
  position: THREE.Vector3;
  velocity: THREE.Vector3;

  // Physical properties
  mass: number; // kg
  radius: number; // km
  diameter: number; // km
  density: number; // kg/m³
  gravity: number; // m/s²
  escapeVelocity: number; // km/s

  // Rotation parameters
  rotationPeriod: number; // days (sidereal)
  lengthOfDay: number; // hours
  obliquityToOrbit: number; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  distanceFromSun: number; // km (average)
  perihelion: number; // km (closest approach to Sun)
  aphelion: number; // km (furthest from Sun)
  semiMajorAxis: number; // km (a) - size of the orbit
  semiMinorAxis: number; // km (b) - width of the orbit
  eccentricity: number; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  orbitalPeriod: number; // days (sidereal period)
  orbitalVelocity: number; // km/s (average)
  orbitalInclination: number; // degrees (i) - tilt of orbital plane
  orbitalEccentricity: number; // unitless - same as eccentricity
  meanAnomaly: number; // radians (M) - position in orbit

  // Extended orbital elements (for 3D orbits and relativity)
  longitudeOfAscendingNode?: number; // degrees (Ω) - where orbit crosses reference plane
  argumentOfPerihelion?: number; // degrees (ω) - orientation of ellipse in orbit

  // Internal calculation properties (added by OrbitalMechanics)
  orbitalInclinationRad?: number; // radians - orbital inclination for calculations
  precessionRate?: number; // arcsec/century - relativistic perihelion precession

  // Environmental properties
  meanTemperature: number; // K
  surfaceTemperature: number; // K
  surfacePressure: number; // Pa

  // System properties
  numberOfMoons: number;
  hasRingSystem: boolean;
  hasGlobalMagneticField: boolean;
  centralBody: number;

  // Physical appearance
  texture: THREE.Texture;

  // Optional physical properties
  magneticField?: { polar: number; equatorial: number };
  atmosphere?: {
    layers: { name: string; temperature: number; pressure: number }[];
  };
  composition?: Record<string, number>;
  albedo?: number;
  atmosphereScale?: number;
  lightDirection?: THREE.Vector3;

  // Rendering properties
  mesh: THREE.Mesh | THREE.Group;
  lastUpdateTime: number;

  // Required methods
  update: (dt: number) => void;
  solveKepler: (M: number, e: number) => number;

  // Optional methods for enhanced physics
  calculateOrbit?: (dt: number) => void;
  applyAxialTilt?: () => void;

  // Special properties for relativistic calculations
  hasRelativisticPrecession?: boolean; // Flag to enable relativistic calculations
  initialArgumentOfPerihelion?: number; // Initial value at J2000 epoch
  cumulativePrecession?: number; // Accumulated precession since simulation start
}
