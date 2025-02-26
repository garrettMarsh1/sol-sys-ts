// src/app/components/planets/Saturn.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

/**
 * Saturn planet with realistic physics and GLB model for rings
 */
class Saturn extends BasePlanet {
  // Identification
  public name: string = "Saturn";

  // Physical properties
  public mass: number = 5.683e26; // kg
  public radius: number = 58232; // km
  public diameter: number = 116464; // km
  public density: number = 687; // kg/m³
  public gravity: number = 10.44; // m/s²
  public escapeVelocity: number = 35.5; // km/s

  // Rotation parameters
  public rotationPeriod: number = 0.444; // days (sidereal)
  public lengthOfDay: number = 10.66; // hours
  public obliquityToOrbit: number = 26.73; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 1433449370; // km (average)
  public perihelion: number = 1352550000; // km (closest approach to Sun)
  public aphelion: number = 1514348740; // km (furthest from Sun)
  public semiMajorAxis: number = 1433449370; // km (a) - size of the orbit
  public semiMinorAxis: number = 1427000000; // km (b) - width of the orbit
  public eccentricity: number = 0.0565; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 10759.22; // days (sidereal period)
  public orbitalVelocity: number = 9.69; // km/s (average)
  public orbitalInclination: number = 2.485; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.0565; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 113.72; // degrees (Ω)
  public argumentOfPerihelion: number = 339.39; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 134; // K
  public surfaceTemperature: number = 134; // K (no solid surface)
  public surfacePressure: number = 0; // Pa (gas giant)

  // System properties
  public numberOfMoons: number = 82;
  public hasRingSystem: boolean = true;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; // Sun's mass

  // Physical appearance
  public texture: THREE.Texture;

  // Saturn-specific properties
  private modelPath: string = "/assets/models/Saturn_1_120536.glb";
  private gltfModel: THREE.Group | null = null;
  private ringsMesh: THREE.Mesh | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Saturn texture
    this.texture = textureLoader.load("/assets/images/saturn.jpeg");

    // Custom initialization to preserve GLB model functionality
    this.initializeSaturnWithModel();

    console.log(
      `Created ${this.name} planet with ring model at:`,
      this.position
    );
  }

  /**
   * Custom initialization to load and use GLB model
   */
  private initializeSaturnWithModel(): void {
    // Initialize planet group
    this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

    // Create a basic Saturn planet as a fallback
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: this.texture,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = this.name;
    this.planetGroup.add(this.mesh);

    // Set initial position
    this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.planetGroup.position.copy(this.position);

    // Calculate initial velocity based on orbital parameters
    this.calculateInitialVelocity();

    // Initialize orbital parameters
    this.initializeOrbitalElements();

    // Set axial tilt (obliquity)
    this.applyAxialTilt();

    // Try to load the GLTF model
    this.loadGLTFModel();

    // Add to scene
    this.scene.add(this.planetGroup);
  }

  /**
   * Load the GLB model for Saturn with rings
   */
  private loadGLTFModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      this.modelPath,
      (gltf) => {
        console.log("Loaded Saturn GLTF model successfully");

        // Remove placeholder mesh from the group
        const placeholderMesh = this.planetGroup.children.find(
          (child) => child.name === this.name
        );
        if (placeholderMesh) {
          this.planetGroup.remove(placeholderMesh);
        }

        // Scale and position the model
        gltf.scene.scale.set(1000, 1000, 1000); // Adjust scale as needed

        // Store reference to the model
        this.gltfModel = gltf.scene;

        // Add the loaded model to our Saturn group
        this.planetGroup.add(gltf.scene);

        // Traverse to find mesh objects
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            // Store reference to Saturn's main mesh for use in BasePlanet methods
            const mesh = child as THREE.Mesh;
            if (mesh.name.includes("Saturn")) {
              this.mesh = mesh;
            }

            // Store reference to rings if found
            if (mesh.name.includes("Ring")) {
              this.ringsMesh = mesh;
            }
          }
        });

        // Apply axial tilt to the entire model
        this.applyAxialTilt();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error loading Saturn model:", error);
        console.log("Using fallback sphere mesh for Saturn");
      }
    );
  }

  /**
   * Calculate initial velocity based on orbital parameters
   * (Private method to replicate functionality from BasePlanet)
   */
  public calculateInitialVelocity(): void {
    // Set initial mean anomaly
    this.meanAnomaly = 0;

    // Calculate eccentric anomaly
    const E = this.solveKepler(this.meanAnomaly, this.eccentricity);

    // For now, use the provided orbital velocity in the y-direction (tangential)
    this.velocity = new THREE.Vector3(0, this.orbitalVelocity, 0);
  }

  /**
   * Initialize orbital elements
   * (Private method to replicate functionality from BasePlanet)
   */
  private initializeOrbitalElements(): void {
    // Calculate semi-minor axis if needed
    if (!this.semiMinorAxis) {
      this.semiMinorAxis =
        this.semiMajorAxis *
        Math.sqrt(1 - this.eccentricity * this.eccentricity);
    }

    // Set default values for missing orbital elements
    if (this.longitudeOfAscendingNode === undefined) {
      this.longitudeOfAscendingNode = 0;
    }

    if (this.argumentOfPerihelion === undefined) {
      this.argumentOfPerihelion = 0;
    }

    // Convert inclination to radians internally
    this.orbitalInclinationRad = this.orbitalInclination * (Math.PI / 180);
  }

  /**
   * Override update method to include specialized handling for the GLB model
   * @param dt Time step in seconds
   */
  public update(dt: number): void {
    // Use BasePlanet's calculateOrbit for orbital mechanics
    this.calculateOrbit(dt);

    // Update rotation for both Saturn and its rings
    this.updateRotation(dt);
  }

  /**
   * Override updateRotation to handle Saturn's rapid rotation
   * and ensure the GLB model rotates correctly
   * @param dt Time step in seconds
   */
  protected updateRotation(dt: number): void {
    // Saturn rotates rather quickly - once every ~10.7 hours
    const rotationPeriodSeconds = this.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // If we have the GLB model, rotate the entire model
    if (this.gltfModel) {
      this.gltfModel.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        rotationSpeed * dt
      );
    } else {
      // Fall back to rotating just the mesh
      this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
    }
  }
}

export default Saturn;
