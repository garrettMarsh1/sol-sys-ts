// src/app/components/planets/BasePlanet.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import OrbitalMechanics from "../Physics/OrbitalMechanics";

/**
 * Base planet class that implements the Planet interface
 * Provides common functionality for all planets
 */
export abstract class BasePlanet implements Planet {
  // Identification
  public abstract name: string;

  // Position and motion
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();

  // Physical properties
  public abstract mass: number; // kg
  public abstract radius: number; // km
  public abstract diameter: number; // km
  public abstract density: number; // kg/m³
  public abstract gravity: number; // m/s²
  public abstract escapeVelocity: number; // km/s

  // Rotation parameters
  public abstract rotationPeriod: number; // days (sidereal)
  public abstract lengthOfDay: number; // hours
  public abstract obliquityToOrbit: number; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public abstract distanceFromSun: number; // km (average)
  public abstract perihelion: number; // km (closest approach to Sun)
  public abstract aphelion: number; // km (furthest from Sun)
  public abstract semiMajorAxis: number; // km (a) - size of the orbit
  public abstract semiMinorAxis: number; // km (b) - width of the orbit
  public abstract eccentricity: number; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public abstract orbitalPeriod: number; // days (sidereal period)
  public abstract orbitalVelocity: number; // km/s (average)
  public abstract orbitalInclination: number; // degrees (i) - tilt of orbital plane
  public abstract orbitalEccentricity: number; // unitless - same as eccentricity
  public meanAnomaly: number = 0; // radians (M) - position in orbit

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode?: number; // degrees (Ω) - where orbit crosses reference plane
  public argumentOfPerihelion?: number; // degrees (ω) - orientation of ellipse in orbit

  // Internal calculation properties (added by OrbitalMechanics)
  public orbitalInclinationRad?: number; // radians - orbital inclination for calculations
  public precessionRate?: number; // arcsec/century - relativistic perihelion precession
  public hasRelativisticPrecession: boolean = false; // Enable relativistic calculations
  public initialArgumentOfPerihelion?: number; // Initial value at J2000 epoch
  public cumulativePrecession: number = 0; // Accumulated precession since simulation start

  // Environmental properties
  public abstract meanTemperature: number; // K
  public abstract surfaceTemperature: number; // K
  public abstract surfacePressure: number; // Pa

  // System properties
  public abstract numberOfMoons: number;
  public abstract hasRingSystem: boolean;
  public abstract hasGlobalMagneticField: boolean;
  public abstract centralBody: number;

  // Physical appearance
  public abstract texture: THREE.Texture;

  // Optional physical properties
  public magneticField?: { polar: number; equatorial: number };
  public atmosphere?: {
    layers: { name: string; temperature: number; pressure: number }[];
  };
  public composition?: Record<string, number>;
  public albedo?: number;
  public atmosphereScale?: number;
  public lightDirection?: THREE.Vector3;

  // Rendering properties
  public mesh: THREE.Mesh = new THREE.Mesh();
  public planetGroup: THREE.Group = new THREE.Group();
  public lastUpdateTime: number = Date.now();

  // Renderer and scene references
  protected renderer: THREE.WebGLRenderer;
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Will be initialized by child classes
    this.mesh = new THREE.Mesh();
    this.planetGroup = new THREE.Group();
  }

  /**
   * Initialize the planet by setting up its mesh, texture, and orbital elements
   */
  public initialize(): void {
    // Create the planet group that will handle proper transformations
    this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

    // Create the planet mesh using the provided radius
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

    // Use a standard material if a custom one isn't provided
    const material = new THREE.MeshPhongMaterial({
      map: this.texture,
      specular: new THREE.Color(0x333333),
      shininess: 5,
      bumpScale: 0.01,
    });

    // Create the mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = this.name;

    // Add the mesh to the group
    this.planetGroup.add(this.mesh);

    // Set initial position
    this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.mesh.position.set(0, 0, 0); // Local position is at center of group
    this.planetGroup.position.copy(this.position);

    // Calculate initial velocity based on orbital parameters
    this.calculateInitialVelocity();

    // Initialize orbital parameters - use OrbitalMechanics utility
    OrbitalMechanics.initializeOrbitalElements(this);

    // Set axial tilt (obliquity) - use OrbitalMechanics utility
    this.applyAxialTilt();

    // Add to scene
    this.scene.add(this.planetGroup);

    console.log(`Initialized ${this.name} at position:`, this.position);
  }

  /**
   * Calculate initial velocity based on orbital parameters
   */
  protected calculateInitialVelocity(): void {
    // Set initial mean anomaly
    this.meanAnomaly = 0;

    // Calculate eccentric anomaly
    const E = this.solveKepler(this.meanAnomaly, this.eccentricity);

    // Calculate true anomaly
    const theta =
      2 *
      Math.atan(
        Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) *
          Math.tan(E / 2)
      );

    // Calculate orbital velocity
    const mu = 1.32712440018e20; // G * M_sun in m^3/s^2
    const p = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity);

    // Calculate velocity components in orbital plane
    const vRadial = Math.sqrt(mu / p) * this.eccentricity * Math.sin(theta);
    const vTransverse =
      Math.sqrt(mu / p) * (1 + this.eccentricity * Math.cos(theta));

    // For now, use the provided orbital velocity in the y-direction (tangential)
    // A more accurate implementation would use the components in the orbital plane
    // transformed into the reference plane
    this.velocity = new THREE.Vector3(0, this.orbitalVelocity, 0);
  }

  /**
   * Apply axial tilt to the planet
   */
  public applyAxialTilt(): void {
    // Use OrbitalMechanics utility to apply the axial tilt correctly
    OrbitalMechanics.applyAxialTilt(this.mesh, this);
  }

  /**
   * Kepler's equation solver to find eccentric anomaly
   * @param M Mean anomaly in radians
   * @param e Eccentricity
   * @returns Eccentric anomaly in radians
   */
  public solveKepler(M: number, e: number): number {
    // Use OrbitalMechanics utility's implementation
    return OrbitalMechanics.solveKepler(M, e);
  }

  /**
   * Calculate orbital position with Keplerian elements and relativistic effects
   * @param elapsedTimeSeconds Time elapsed in seconds
   */
  public calculateOrbit(elapsedTimeSeconds: number): void {
    // Get Sun's mass (approximate since we don't have direct access)
    const sunMass = 1.989e30; // kg

    // Use OrbitalMechanics utility to calculate position with relativity
    const newPosition = OrbitalMechanics.calculateOrbitalPosition(
      this,
      elapsedTimeSeconds,
      sunMass
    );

    // Update planet position
    this.position.copy(newPosition);
    this.planetGroup.position.copy(newPosition);
  }

  /**
   * Update the planet's position and rotation
   * @param dt Time step in seconds
   */
  public update(dt: number): void {
    // Skip update for Sun
    if (this.name.toLowerCase() === "sun") {
      this.updateRotation(dt);
      return;
    }

    // Update orbital position
    this.calculateOrbit(dt);

    this.planetGroup.position.copy(this.position);

    // Update rotation (with correct direction based on obliquity)
    this.updateRotation(dt);
  }

  /**
   * Update planet's rotation
   * @param dt Time step in seconds
   */
  protected updateRotation(dt: number): void {
    // Calculate rotation speed in radians per second
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Determine rotation direction (retrograde if obliquity > 90°)
    const isRetrograde = this.obliquityToOrbit > 90;
    const rotationDirection = isRetrograde ? -1 : 1;

    // Apply rotation
    this.mesh.rotateOnAxis(
      new THREE.Vector3(0, 1, 0),
      rotationSpeed * dt * rotationDirection
    );
  }

  /**
   * Clean up resources when planet is no longer needed
   */
  public dispose(): void {
    // Remove from scene
    this.scene.remove(this.planetGroup);

    // Dispose of geometry and materials
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }

    if (this.mesh.material) {
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((material) => material.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
  }
}
