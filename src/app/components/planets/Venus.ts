// src/app/components/planets/Venus.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Venus extends BasePlanet {
  // Identification
  public name: string = "Venus";

  // Physical properties
  public mass: number = 4.867e24; // kg
  public radius: number = 6052; // km
  public diameter: number = 12104; // km
  public density: number = 5243; // kg/m³
  public gravity: number = 8.87; // m/s²
  public escapeVelocity: number = 10.36; // km/s

  // Rotation parameters
  public rotationPeriod: number = 243; // days (sidereal)
  public lengthOfDay: number = 5832.5; // hours
  public obliquityToOrbit: number = 177.36; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 108208930; // km (average)
  public perihelion: number = 107477000; // km (closest approach to Sun)
  public aphelion: number = 108939000; // km (furthest from Sun)
  public semiMajorAxis: number = 108208930; // km (a) - size of the orbit
  public semiMinorAxis: number = 108207740; // km (b) - width of the orbit
  public eccentricity: number = 0.0067; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 224.701; // days (sidereal period)
  public orbitalVelocity: number = 35.02; // km/s (average)
  public orbitalInclination: number = 3.39; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.0067; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 76.68; // degrees (Ω)
  public argumentOfPerihelion: number = 54.85; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 737; // K
  public surfaceTemperature: number = 737; // K
  public surfacePressure: number = 92e3; // Pa

  // System properties
  public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = false;
  public centralBody: number = 1.989e30; // Sun's mass

  // Physical appearance
  public texture: THREE.Texture;
  private atmosphereTexture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load textures
    this.texture = textureLoader.load("/assets/images/venus.jpeg");
    this.atmosphereTexture = textureLoader.load(
      "/assets/images/venusAtmosphere.jpeg"
    );

    // Use atmosphere texture for main material
    const material = new THREE.MeshPhongMaterial({
      map: this.atmosphereTexture,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });

    // Initialize the planet with custom material
    this.initialize();

    // Replace the default material with atmosphere texture
    if (this.mesh instanceof THREE.Mesh && this.mesh.material) {
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh.material = material;
    }

    // Venus has small but measurable relativistic precession
    this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  /**
   * Override updateRotation to handle Venus's retrograde rotation
   */
  protected updateRotation(dt: number): void {
    // Venus has retrograde rotation (clockwise)
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Apply rotation with negative value for retrograde motion
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationSpeed * dt);
  }
}

export default Venus;
