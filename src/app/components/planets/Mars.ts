// src/app/components/planets/Mars.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Mars extends BasePlanet {
  // Identification
  public name: string = "Mars";

  // Physical properties
  public mass: number = 6.39e23; // kg
  public radius: number = 3396; // km
  public diameter: number = 6792; // km
  public density: number = 3933; // kg/m³
  public gravity: number = 3.711; // m/s²
  public escapeVelocity: number = 5.03; // km/s

  // Rotation parameters
  public rotationPeriod: number = 1.025; // days (sidereal)
  public lengthOfDay: number = 24.7; // hours
  public obliquityToOrbit: number = 25.19; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 227936640; // km (average)
  public perihelion: number = 206700000; // km (closest approach to Sun)
  public aphelion: number = 249200000; // km (furthest from Sun)
  public semiMajorAxis: number = 227936640; // km (a) - size of the orbit
  public semiMinorAxis: number = 226936000; // km (b) - width of the orbit
  public eccentricity: number = 0.0934; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 686.98; // days (sidereal period)
  public orbitalVelocity: number = 24.13; // km/s (average)
  public orbitalInclination: number = 1.85; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.0934; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 49.58; // degrees (Ω)
  public argumentOfPerihelion: number = 286.5; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 210; // K
  public surfaceTemperature: number = 210; // K
  public surfacePressure: number = 0.006; // Pa

  // System properties
  public numberOfMoons: number = 2;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; // Sun's mass

  // Physical appearance
  public texture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Mars texture
    this.texture = textureLoader.load("/assets/images/mars.jpeg");

    // Initialize the planet
    this.initialize();

    // Mars has small relativistic precession
    this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override applyAxialTilt to ensure correct 25.19° tilt
   */
  public applyAxialTilt(): void {
    super.applyAxialTilt();

    // Apply any additional Mars-specific orientation adjustments here if needed
    // Mars has a substantial axial tilt similar to Earth
  }
}

export default Mars;
