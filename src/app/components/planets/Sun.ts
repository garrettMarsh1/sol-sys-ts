import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BasePlanet } from "./BasePlanet";

const sunTexture = new THREE.TextureLoader().load("/assets/images/sun.jpeg");


class Sun extends BasePlanet {
    static mass: number = 1.989e30;
  static position: number = 0;

    public name: string = "Sun";

    public mass: number = 1.989e30;   public radius: number = 696342;   public diameter: number = 1392684;   public density: number = 1408;   public gravity: number = 274.0;   public escapeVelocity: number = 617.7; 
    public rotationPeriod: number = 25.05;   public lengthOfDay: number = 25.05 * 24;   public obliquityToOrbit: number = 7.25; 
    public distanceFromSun: number = 0;   public perihelion: number = 0;   public aphelion: number = 0;   public semiMajorAxis: number = 0;   public semiMinorAxis: number = 0;   public eccentricity: number = 0;   public orbitalPeriod: number = 0;   public orbitalVelocity: number = 0;   public orbitalInclination: number = 0;   public orbitalEccentricity: number = 0; 
    public meanTemperature: number = 5778;   public surfaceTemperature: number = 5778;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 0; 
    public luminosity: number = 3.828e26;   public age: number = 4.6e9;   public composition: Record<string, number> = {
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

    public texture: THREE.Texture = sunTexture;
  private bloomComposer!: EffectComposer; 
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.setupSun();
    this.setupBloom();

        console.log(
      `Created ${this.name} with bloom effects at center of solar system`
    );
  }

  
  private setupSun(): void {
        this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 64, 64),
      new THREE.MeshBasicMaterial({ map: sunTexture })
    );
    this.mesh.position.set(0, 0, 0);

        this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;
    this.planetGroup.add(this.mesh);
    this.planetGroup.position.set(0, 0, 0);

        this.scene.add(this.planetGroup);
  }

  
  private setupBloom(): void {
    this.bloomComposer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.0;     bloomPass.strength = 1.0;     bloomPass.radius = 1.0; 
    this.bloomComposer.addPass(renderPass);
    this.bloomComposer.addPass(bloomPass);
  }

  
  public update(dt: number): void {
        this.mesh.rotation.y += 0.0005;

        this.bloomComposer.render();
  }

  
  public solveKepler(M: number, e: number): number {
    return 0;   }
}

export default Sun;
