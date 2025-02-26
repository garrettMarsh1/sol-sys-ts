// src/app/components/planets/Earth.ts
import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

// Preserve the original GLSL shaders
const vertexShader = `
precision highp float;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vDebugColor;

void main() {
    vDebugColor = vWorldPosition;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform sampler2D earthMap;
uniform sampler2D nightMap;
uniform vec3 lightPos;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vec4 dayColor = texture2D(earthMap, vUv);
    vec4 nightColor = texture2D(nightMap, vUv);
    vec3 lightDirection = normalize(lightPos - vWorldPosition);
    float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
    vec4 finalColor = mix(nightColor, dayColor, lightIntensity);
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}
`;

/**
 * Earth planet with realistic physics and day/night shader effects
 */
class Earth extends BasePlanet {
  // Identification
  public name: string = "Earth";

  // Physical properties
  public mass: number = 5.972e24; // kg
  public radius: number = 6371; // km
  public diameter: number = 12742; // km
  public density: number = 5514; // kg/m³
  public gravity: number = 9.807; // m/s²
  public escapeVelocity: number = 11.186; // km/s

  // Rotation parameters
  public rotationPeriod: number = 0.99726; // days (sidereal)
  public lengthOfDay: number = 24.0; // hours
  public obliquityToOrbit: number = 23.439; // degrees (axial tilt)

  // Orbital parameters (Keplerian elements)
  public distanceFromSun: number = 149597890; // km (average)
  public perihelion: number = 147095000; // km (closest approach to Sun)
  public aphelion: number = 152100000; // km (furthest from Sun)
  public semiMajorAxis: number = 149597890; // km (a) - size of the orbit
  public semiMinorAxis: number = 149577000; // km (b) - width of the orbit
  public eccentricity: number = 0.0167; // (e) - shape of the orbit (0=circle, 0-1=ellipse)
  public orbitalPeriod: number = 365.256; // days (sidereal period)
  public orbitalVelocity: number = 29.78; // km/s (average)
  public orbitalInclination: number = 0.0; // degrees (i) - tilt of orbital plane
  public orbitalEccentricity: number = 0.0167; // unitless - same as eccentricity

  // Extended orbital elements (for 3D orbits and relativity)
  public longitudeOfAscendingNode: number = 174.873; // degrees (Ω)
  public argumentOfPerihelion: number = 288.064; // degrees (ω)

  // Environmental properties
  public meanTemperature: number = 288; // K
  public surfaceTemperature: number = 288; // K
  public surfacePressure: number = 101325; // Pa

  // System properties
  public numberOfMoons: number = 1;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; // Sun's mass

  // Earth-specific properties
  public magneticField: { polar: number; equatorial: number } = {
    polar: 2e-5,
    equatorial: 4e-5,
  };
  public atmosphere: {
    layers: { name: string; temperature: number; pressure: number }[];
  } = {
    layers: [
      {
        name: "troposphere",
        temperature: 288,
        pressure: 101325,
      },
      {
        name: "stratosphere",
        temperature: 216,
        pressure: 22632,
      },
      {
        name: "mesosphere",
        temperature: 186,
        pressure: 5474,
      },
      {
        name: "thermosphere",
        temperature: 186,
        pressure: 5474,
      },
    ],
  };

  // Textures
  public texture: THREE.Texture;
  private nightTexture: THREE.Texture;
  private shaderMaterial: THREE.ShaderMaterial;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

    // Load Earth textures
    this.texture = textureLoader.load("/assets/images/earth.jpeg");
    this.nightTexture = textureLoader.load(
      "/assets/images/8k_earth_nightmap.jpeg"
    );

    // Create shader material for day/night effect
    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        earthMap: { value: this.texture },
        nightMap: { value: this.nightTexture },
        lightPos: { value: new THREE.Vector3(0, 0, 0) }, // Sun position
      },
    });

    // Custom initialization to use shader material
    this.initializeWithShader();

    // Enable relativistic effects for Earth
    this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with shader effects at:`,
      this.position
    );
  }

  /**
   * Custom initialization to use shader material instead of standard BasePlanet initialization
   */
  private initializeWithShader(): void {
    // Create the planet group that will handle proper transformations
    this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

    // Create Earth mesh with shader material
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    this.mesh = new THREE.Mesh(geometry, this.shaderMaterial);
    this.mesh.name = this.name;

    // Add the mesh to the group
    this.planetGroup.add(this.mesh);

    // Set initial position
    this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.planetGroup.position.copy(this.position);

    // Calculate initial velocity based on orbital parameters
    this.calculateInitialVelocity();

    // Initialize orbital parameters through OrbitalMechanics
    this.initializeOrbitalElements();

    // Set axial tilt (obliquity)
    this.applyAxialTilt();

    // Add to scene
    this.scene.add(this.planetGroup);
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
    // Initialize orbital parameters from OrbitalMechanics
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
   * Override update to update the shader uniforms
   * @param dt Time step in seconds
   */
  public update(dt: number): void {
    // Use BasePlanet's update for orbital mechanics
    super.update(dt);

    // Update the light source position (Sun)
    if (this.shaderMaterial.uniforms) {
      this.shaderMaterial.uniforms.lightPos.value.set(0, 0, 0);
    }
  }
}

export default Earth;
