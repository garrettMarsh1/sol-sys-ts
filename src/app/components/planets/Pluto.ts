// src/app/components/planets/Pluto.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Pluto extends BasePlanet {
  // Identification
  public name: string = "Pluto";

  // Physical properties
  public mass: number = 1.303e22; // kg
  public radius: number = 1188; // km
  public diameter: number = 2376; // km
  public density: number = 2095; // kg/m³
  public gravity: number = 0.62; // m/s²
  public escapeVelocity: number = 1.3; // km/s

  // Rotation parameters
  public rotationPeriod: number = 6.3872; // days (sidereal)
  public lengthOfDay: number = 153.3; // hours
  public obliquityToOrbit: number = 122.53; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 5906380624; // km (average)
  public perihelion: number = 4436000000; // km (closest approach to Sun)
  public aphelion: number = 7375000000; // km (furthest from Sun)
  public semiMajorAxis: number = 5906380624; // km (a) - size of the orbit
  public semiMinorAxis: number = 5720000000; // km (b) - width of the orbit
  public eccentricity: number = 0.2488; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 90560; // days (sidereal period)
  public orbitalVelocity: number = 4.74; // km/s (average)
  public orbitalInclination: number = 17.15; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.2488; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 110.3; // degrees (Ω)
  public argumentOfPerihelion: number = 113.83; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 44; // K
  public surfaceTemperature: number = 44; // K
  public surfacePressure: number = 0.00001; // Pa (extremely thin atmosphere)

  // System properties
  public numberOfMoons: number = 5;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = false;
  public centralBody: number = 1.989e30; // Sun's mass

  // Physical appearance
  public texture: THREE.Texture;

  // Composition information
  public composition: Record<string, number> = {
    "Nitrogen ice": 70,
    "Methane ice": 20,
    "Carbon monoxide ice": 10,
  };

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Pluto texture
    this.texture = textureLoader.load("/assets/images/pluto.jpeg");

    // Initialize the planet
    this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override applyAxialTilt to implement Pluto's extreme axial tilt (122.53°)
   * Pluto, like Uranus, has a very unusual tilt
   */
  public applyAxialTilt(): void {
    // Let the OrbitalMechanics utility handle the basic tilt
    super.applyAxialTilt();

    // Add any Pluto-specific adjustments here if needed
  }

  /**
   * Calculate orbit with special handling for Pluto's highly eccentric and inclined orbit
   * @param elapsedTimeSeconds Time elapsed in seconds
   */
  public calculateOrbit(elapsedTimeSeconds: number): void {
    // Use the base implementation which includes relativistic effects if enabled
    super.calculateOrbit(elapsedTimeSeconds);
  }
}

export default Pluto;
