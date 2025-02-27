import * as THREE from "three";

export interface Planet {
    name: string;

    position: THREE.Vector3;
  velocity: THREE.Vector3;

    mass: number;   radius: number;   diameter: number;   density: number;   gravity: number;   escapeVelocity: number; 
    rotationPeriod: number;   lengthOfDay: number;   obliquityToOrbit: number; 
    distanceFromSun: number;   perihelion: number;   aphelion: number;   semiMajorAxis: number;   semiMinorAxis: number;   eccentricity: number;   orbitalPeriod: number;   orbitalVelocity: number;   orbitalInclination: number;   orbitalEccentricity: number;   meanAnomaly: number; 
    longitudeOfAscendingNode?: number;   argumentOfPerihelion?: number; 
    orbitalInclinationRad?: number;   precessionRate?: number; 
    meanTemperature: number;   surfaceTemperature: number;   surfacePressure: number; 
    numberOfMoons: number;
  hasRingSystem: boolean;
  hasGlobalMagneticField: boolean;
  centralBody: number;

    texture: THREE.Texture;

    magneticField?: { polar: number; equatorial: number };
  atmosphere?: {
    layers: { name: string; temperature: number; pressure: number }[];
  };
  composition?: Record<string, number>;
  albedo?: number;
  atmosphereScale?: number;
  lightDirection?: THREE.Vector3;

    mesh: THREE.Mesh | THREE.Group;
  lastUpdateTime: number;

    update: (dt: number) => void;
  solveKepler: (M: number, e: number) => number;

    calculateOrbit?: (dt: number) => void;
  applyAxialTilt?: () => void;

    hasRelativisticPrecession?: boolean;   initialArgumentOfPerihelion?: number;   cumulativePrecession?: number; }
