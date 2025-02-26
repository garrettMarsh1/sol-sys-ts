// src/app/components/planets/Mercury.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

/**
 * Mercury planet class with enhanced physics and relativistic effects
 * Mercury exhibits the largest relativistic precession of perihelion
 * (approximately 43 arcseconds per century)
 */
class Mercury extends BasePlanet {
  // Identification
  public name: string = "Mercury";

  // Physical properties
  public mass: number = 3.285e23; // kg
  public radius: number = 2439.7; // km
  public diameter: number = 4879.4; // km
  public density: number = 5427; // kg/m³
  public gravity: number = 3.7; // m/s²
  public escapeVelocity: number = 4.3; // km/s

  // Rotation parameters
  public rotationPeriod: number = 58.646; // days (sidereal)
  public lengthOfDay: number = 4222.6; // hours
  public obliquityToOrbit: number = 0.034; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 57909050; // km (average)
  public perihelion: number = 46001200; // km (closest approach to Sun)
  public aphelion: number = 69816900; // km (furthest from Sun)
  public semiMajorAxis: number = 57909050; // km (a) - size of the orbit
  public semiMinorAxis: number = 56671900; // km (b) - width of the orbit
  public eccentricity: number = 0.2056; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 87.969; // days (sidereal period)
  public orbitalVelocity: number = 47.87; // km/s (average)
  public orbitalInclination: number = 7.0; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.2056; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 48.331; // degrees (Ω)
  public argumentOfPerihelion: number = 29.124; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 440; // K
  public surfaceTemperature: number = 700; // K (day side), 100 (night side)
  public surfacePressure: number = 0; // Pa (negligible atmosphere)

  // System properties
  public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; // Sun's mass

  // Relativistic properties
  public precessionRate: number = 43.0; // arcsec/century (observed value)

  // Physical appearance
  public texture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Mercury texture
    this.texture = textureLoader.load("/assets/images/mercury.jpeg");

    // Flag for relativistic effects (important for Mercury)
    this.hasRelativisticPrecession = true;

    // Mercury has the most significant relativistic precession in the solar system
    this.precessionRate = 43.0; // arcseconds per century

    // Initialize the planet
    this.initialize();

    console.log(
      `Created ${this.name} planet with relativistic precession enabled`
    );
    console.log(`Precession rate: ${this.precessionRate} arcsec/century`);
  }

  /**
   * Override updateRotation to handle Mercury's 3:2 spin-orbit resonance
   * Mercury rotates exactly three times for every two orbits around the Sun
   */
  protected updateRotation(dt: number): void {
    // Mercury has a 3:2 spin-orbit resonance
    // Rotation period is approximately 58.646 days
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Apply rotation with correct axial orientation
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Mercury;
