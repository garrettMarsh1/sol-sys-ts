// src/app/components/planets/Neptune.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Neptune extends BasePlanet {
  // Identification
  public name: string = "Neptune";

  // Physical properties
  public mass: number = 1.024e26; // kg
  public radius: number = 24764; // km
  public diameter: number = 49528; // km
  public density: number = 1638; // kg/m³
  public gravity: number = 11.15; // m/s²
  public escapeVelocity: number = 23.5; // km/s

  // Rotation parameters
  public rotationPeriod: number = 0.67125; // days (sidereal)
  public lengthOfDay: number = 16.11; // hours
  public obliquityToOrbit: number = 28.32; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 4498396441; // km (average)
  public perihelion: number = 4444600000; // km (closest approach to Sun)
  public aphelion: number = 4552200000; // km (furthest from Sun)
  public semiMajorAxis: number = 4498396441; // km (a) - size of the orbit
  public semiMinorAxis: number = 4497700000; // km (b) - width of the orbit
  public eccentricity: number = 0.01; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 60190; // days (sidereal period)
  public orbitalVelocity: number = 5.43; // km/s (average)
  public orbitalInclination: number = 1.77; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.01; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 131.78; // degrees (Ω)
  public argumentOfPerihelion: number = 272.85; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 72; // K
  public surfaceTemperature: number = 72; // K (no solid surface)
  public surfacePressure: number = 0; // Pa (gas giant)

  // System properties
  public numberOfMoons: number = 14;
  public hasRingSystem: boolean = true;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; // Sun's mass

  // Physical appearance
  public texture: THREE.Texture;

  // Composition information
  public composition: Record<string, number> = {
    Hydrogen: 80.0,
    Helium: 19.0,
    Methane: 1.0,
  };

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Neptune texture
    this.texture = textureLoader.load("/assets/images/neptune.jpeg");

    // Initialize the planet
    this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override updateRotation to handle Neptune's rapid rotation
   */
  protected updateRotation(dt: number): void {
    // Neptune rotates rather quickly - once every ~16 hours
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Apply rotation
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Neptune;
