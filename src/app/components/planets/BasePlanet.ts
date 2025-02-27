import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import OrbitalMechanics from "../Physics/OrbitalMechanics";


export abstract class BasePlanet implements Planet {
    public abstract name: string;

    public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();

    public abstract mass: number;   public abstract radius: number;   public abstract diameter: number;   public abstract density: number;   public abstract gravity: number;   public abstract escapeVelocity: number; 
    public abstract rotationPeriod: number;   public abstract lengthOfDay: number;   public abstract obliquityToOrbit: number; 
    public abstract distanceFromSun: number;   public abstract perihelion: number;   public abstract aphelion: number;   public abstract semiMajorAxis: number;   public abstract semiMinorAxis: number;   public abstract eccentricity: number;   public abstract orbitalPeriod: number;   public abstract orbitalVelocity: number;   public abstract orbitalInclination: number;   public abstract orbitalEccentricity: number;   public meanAnomaly: number = 0; 
    public longitudeOfAscendingNode?: number;   public argumentOfPerihelion?: number; 
    public orbitalInclinationRad?: number;   public precessionRate?: number;   public hasRelativisticPrecession: boolean = false;   public initialArgumentOfPerihelion?: number;   public cumulativePrecession: number = 0; 
    public abstract meanTemperature: number;   public abstract surfaceTemperature: number;   public abstract surfacePressure: number; 
    public abstract numberOfMoons: number;
  public abstract hasRingSystem: boolean;
  public abstract hasGlobalMagneticField: boolean;
  public abstract centralBody: number;

    public abstract texture: THREE.Texture;

    public magneticField?: { polar: number; equatorial: number };
  public atmosphere?: {
    layers: { name: string; temperature: number; pressure: number }[];
  };
  public composition?: Record<string, number>;
  public albedo?: number;
  public atmosphereScale?: number;
  public lightDirection?: THREE.Vector3;

    public mesh: THREE.Mesh = new THREE.Mesh();
  public planetGroup: THREE.Group = new THREE.Group();
  public lastUpdateTime: number = Date.now();

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

        this.mesh = new THREE.Mesh();
    this.planetGroup = new THREE.Group();
  }

  
  public initialize(): void {
        this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        const material = new THREE.MeshPhongMaterial({
      map: this.texture,
      specular: new THREE.Color(0x333333),
      shininess: 5,
      bumpScale: 0.01,
    });

        this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = this.name;

        this.planetGroup.add(this.mesh);

        this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.mesh.position.set(0, 0, 0);     this.planetGroup.position.copy(this.position);

        this.calculateInitialVelocity();

        OrbitalMechanics.initializeOrbitalElements(this);

        this.applyAxialTilt();

        this.scene.add(this.planetGroup);

    console.log(`Initialized ${this.name} at position:`, this.position);
  }

  
  protected calculateInitialVelocity(): void {
        this.meanAnomaly = 0;

        const E = this.solveKepler(this.meanAnomaly, this.eccentricity);

        const theta =
      2 *
      Math.atan(
        Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) *
          Math.tan(E / 2)
      );

        const mu = 1.32712440018e20;     const p = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity);

        const vRadial = Math.sqrt(mu / p) * this.eccentricity * Math.sin(theta);
    const vTransverse =
      Math.sqrt(mu / p) * (1 + this.eccentricity * Math.cos(theta));

                this.velocity = new THREE.Vector3(0, this.orbitalVelocity, 0);
  }

  
  public applyAxialTilt(): void {
        OrbitalMechanics.applyAxialTilt(this.mesh, this);
  }

  
  public solveKepler(M: number, e: number): number {
        return OrbitalMechanics.solveKepler(M, e);
  }

  
  public calculateOrbit(elapsedTimeSeconds: number): void {
        const sunMass = 1.989e30; 
        const newPosition = OrbitalMechanics.calculateOrbitalPosition(
      this,
      elapsedTimeSeconds,
      sunMass
    );

        this.position.copy(newPosition);
    this.planetGroup.position.copy(newPosition);
  }

  
  public update(dt: number): void {
        if (this.name.toLowerCase() === "sun") {
      this.updateRotation(dt);
      return;
    }

        this.calculateOrbit(dt);

    this.planetGroup.position.copy(this.position);

        this.updateRotation(dt);
  }

  
  protected updateRotation(dt: number): void {
        const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        const isRetrograde = this.obliquityToOrbit > 90;
    const rotationDirection = isRetrograde ? -1 : 1;

        this.mesh.rotateOnAxis(
      new THREE.Vector3(0, 1, 0),
      rotationSpeed * dt * rotationDirection
    );
  }

  
  public dispose(): void {
        this.scene.remove(this.planetGroup);

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
