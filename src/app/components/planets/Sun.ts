// src/app/components/planets/Sun.ts
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BasePlanet } from "./BasePlanet";

// Keep the original texture loader
const sunTexture = new THREE.TextureLoader().load("/assets/images/sun.jpeg");

/**
 * Sun class with original appearance and bloom effects,
 * but integrated with the BasePlanet physics system
 */
class Sun extends BasePlanet {
  // Static properties needed by other components
  static mass: number = 1.989e30;
  static position: number = 0;

  // Identification
  public name: string = "Sun";

  // Physical properties
  public mass: number = 1.989e30; // kg
  public radius: number = 696342; // km
  public diameter: number = 1392684; // km
  public density: number = 1408; // kg/m³
  public gravity: number = 274.0; // m/s²
  public escapeVelocity: number = 617.7; // km/s

  // Rotation parameters
  public rotationPeriod: number = 25.05; // days (equatorial, sidereal)
  public lengthOfDay: number = 25.05 * 24; // hours
  public obliquityToOrbit: number = 7.25; // degrees (axial tilt)

  // Orbital parameters (all zero or undefined since Sun is the central body)
  public distanceFromSun: number = 0; // km
  public perihelion: number = 0; // km
  public aphelion: number = 0; // km
  public semiMajorAxis: number = 0; // km
  public semiMinorAxis: number = 0; // km
  public eccentricity: number = 0; //
  public orbitalPeriod: number = 0; // days
  public orbitalVelocity: number = 0; // km/s
  public orbitalInclination: number = 0; // degrees
  public orbitalEccentricity: number = 0; //

  // Environmental properties
  public meanTemperature: number = 5778; // K (surface)
  public surfaceTemperature: number = 5778; // K (photosphere)
  public surfacePressure: number = 0; // Pa (not applicable)

  // System properties
  public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 0; // Sun is its own central body

  // Special Sun properties
  public luminosity: number = 3.828e26; // watts
  public age: number = 4.6e9; // years
  public composition: Record<string, number> = {
    Hydrogen: 74.9,
    Helium: 24.1,
    Oxygen: 0.06,
    Carbon: 0.03,
    Neon: 0.01,
    Nitrogen: 0.01,
  };
  public atmosphere: {
    layers: { name: string; temperature: number; pressure: number }[];
  } = {
    layers: [
      { name: "photosphere", temperature: 5778, pressure: 0 },
      { name: "chromosphere", temperature: 10000, pressure: 0 },
      { name: "corona", temperature: 1e6, pressure: 0 },
    ],
  };
  public magneticField: { polar: number; equatorial: number } = {
    polar: 2e-5,
    equatorial: 4e-5,
  };

  // Visual effect properties
  public texture: THREE.Texture = sunTexture;
  private bloomComposer!: EffectComposer; // Add definite assignment assertion

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Set up original Sun mesh and bloom effects
    this.setupSun();
    this.setupBloom();

    // Static properties already defined above
    console.log(
      `Created ${this.name} with bloom effects at center of solar system`
    );
  }

  /**
   * Set up the Sun mesh with original appearance - preserved from original
   */
  private setupSun(): void {
    // Create the Sun mesh using MeshBasicMaterial with the original texture
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 64, 64),
      new THREE.MeshBasicMaterial({ map: sunTexture })
    );
    this.mesh.position.set(0, 0, 0);

    // Set up planet group (required by BasePlanet)
    this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;
    this.planetGroup.add(this.mesh);
    this.planetGroup.position.set(0, 0, 0);

    // Add to scene
    this.scene.add(this.planetGroup);
  }

  /**
   * Set up bloom post-processing effect - preserved from original
   */
  private setupBloom(): void {
    this.bloomComposer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.0; // Minimum brightness to trigger bloom
    bloomPass.strength = 1.0; // Intensity of bloom
    bloomPass.radius = 1.0; // Radius of bloom glow

    this.bloomComposer.addPass(renderPass);
    this.bloomComposer.addPass(bloomPass);
  }

  /**
   * Update method - preserved from original but adapted to work with BasePlanet
   */
  public update(dt: number): void {
    // Use original rotation speed for consistent appearance
    this.mesh.rotation.y += 0.0005;

    // Render the bloom effect
    this.bloomComposer.render();
  }

  /**
   * Solve Kepler's equation - override for Sun (not used)
   */
  public solveKepler(M: number, e: number): number {
    return 0; // Sun doesn't orbit
  }
}

export default Sun;
