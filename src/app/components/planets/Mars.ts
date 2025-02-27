import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Mars extends BasePlanet {
    public name: string = "Mars";

    public mass: number = 6.39e23;   public radius: number = 3396;   public diameter: number = 6792;   public density: number = 3933;   public gravity: number = 3.711;   public escapeVelocity: number = 5.03; 
    public rotationPeriod: number = 1.025;   public lengthOfDay: number = 24.7;   public obliquityToOrbit: number = 25.19; 
    public distanceFromSun: number = 227936640;   public perihelion: number = 206700000;   public aphelion: number = 249200000;   public semiMajorAxis: number = 227936640;   public semiMinorAxis: number = 226936000;   public eccentricity: number = 0.0934;   public orbitalPeriod: number = 686.98;   public orbitalVelocity: number = 24.13;   public orbitalInclination: number = 1.85;   public orbitalEccentricity: number = 0.0934; 
    public longitudeOfAscendingNode: number = 49.58;   public argumentOfPerihelion: number = 286.5; 
    public meanTemperature: number = 210;   public surfaceTemperature: number = 210;   public surfacePressure: number = 0.006; 
    public numberOfMoons: number = 2;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/mars.jpeg");

        this.initialize();

        this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  
  public applyAxialTilt(): void {
    super.applyAxialTilt();

          }
}

export default Mars;
