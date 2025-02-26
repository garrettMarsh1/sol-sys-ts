// src/app/components/planets/Uranus.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Uranus extends BasePlanet {
  // Identification
  public name: string = "Uranus";

  // Physical properties
  public mass: number = 8.681e25; // kg
  public radius: number = 25559; // km
  public diameter: number = 51118; // km
  public density: number = 1271; // kg/m³
  public gravity: number = 8.87; // m/s²
  public escapeVelocity: number = 21.3; // km/s

  // Rotation parameters
  public rotationPeriod: number = 0.71833; // days (sidereal)
  public lengthOfDay: number = 17.24; // hours
  public obliquityToOrbit: number = 97.77; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 2870658186; // km (average)
  public perihelion: number = 2743000000; // km (closest approach to Sun)
  public aphelion: number = 2998400000; // km (furthest from Sun)
  public semiMajorAxis: number = 2870658186; // km (a) - size of the orbit
  public semiMinorAxis: number = 2869000000; // km (b) - width of the orbit
  public eccentricity: number = 0.046381; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 30688.5; // days (sidereal period)
  public orbitalVelocity: number = 6.81; // km/s (average)
  public orbitalInclination: number = 0.772; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.046381; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 74.23; // degrees (Ω)
  public argumentOfPerihelion: number = 96.7; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 77; // K
  public surfaceTemperature: number = 77; // K (no solid surface)
  public surfacePressure: number = 0; // Pa (gas giant)

  // System properties
  public numberOfMoons: number = 27;
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

    // Load Uranus texture
    this.texture = textureLoader.load("/assets/images/uranus.jpeg");

    // Initialize the planet
    this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override applyAxialTilt to implement Uranus's extreme axial tilt (97.77°)
   * Uranus is unique in that it rotates almost on its side
   */
  public applyAxialTilt(): void {
    // Let the OrbitalMechanics utility handle this special case
    // The utility has a special condition for Uranus in applyAxialTilt method
    super.applyAxialTilt();
  }

  /**
   * Override updateRotation to handle Uranus's special rotation characteristics
   */
  protected updateRotation(dt: number): void {
    // Uranus rotates "on its side" - this is handled by the axial tilt
    // Here we just need to set the correct rotation speed
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Apply rotation around the already-tilted axis
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Uranus;
