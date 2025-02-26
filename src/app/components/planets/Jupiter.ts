// src/app/components/planets/Jupiter.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Jupiter extends BasePlanet {
  // Identification
  public name: string = "Jupiter";

  // Physical properties
  public mass: number = 1.898e27; // kg
  public radius: number = 69911; // km
  public diameter: number = 139822; // km
  public density: number = 1326; // kg/m³
  public gravity: number = 24.79; // m/s²
  public escapeVelocity: number = 59.5; // km/s

  // Rotation parameters
  public rotationPeriod: number = 0.41354; // days (sidereal)
  public lengthOfDay: number = 9.925; // hours
  public obliquityToOrbit: number = 3.13; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 778547200; // km (average)
  public perihelion: number = 740573600; // km (closest approach to Sun)
  public aphelion: number = 816520800; // km (furthest from Sun)
  public semiMajorAxis: number = 778547200; // km (a) - size of the orbit
  public semiMinorAxis: number = 777500000; // km (b) - width of the orbit
  public eccentricity: number = 0.0489; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 4332.59; // days (sidereal period)
  public orbitalVelocity: number = 13.07; // km/s (average)
  public orbitalInclination: number = 1.305; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.0489; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 100.56; // degrees (Ω)
  public argumentOfPerihelion: number = 273.88; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 165; // K
  public surfaceTemperature: number = 165; // K (no solid surface)
  public surfacePressure: number = 0; // Pa (gas giant)

  // System properties
  public numberOfMoons: number = 79;
  public hasRingSystem: boolean = true;
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

    // Load Jupiter texture
    this.texture = textureLoader.load("/assets/images/jupiter.jpeg");

    // Initialize the planet
    this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override updateRotation to handle Jupiter's rapid rotation
   */
  protected updateRotation(dt: number): void {
    // Jupiter rotates very quickly - once every ~10 hours
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Apply rotation
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Jupiter;
