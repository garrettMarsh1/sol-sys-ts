import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Neptune extends BasePlanet {
    public name: string = "Neptune";

    public mass: number = 1.024e26;   public radius: number = 24764;   public diameter: number = 49528;   public density: number = 1638;   public gravity: number = 11.15;   public escapeVelocity: number = 23.5; 
    public rotationPeriod: number = 0.67125;   public lengthOfDay: number = 16.11;   public obliquityToOrbit: number = 28.32; 
    public distanceFromSun: number = 4498396441;   public perihelion: number = 4444600000;   public aphelion: number = 4552200000;   public semiMajorAxis: number = 4498396441;   public semiMinorAxis: number = 4497700000;   public eccentricity: number = 0.01;   public orbitalPeriod: number = 60190;   public orbitalVelocity: number = 5.43;   public orbitalInclination: number = 1.77;   public orbitalEccentricity: number = 0.01; 
    public longitudeOfAscendingNode: number = 131.78;   public argumentOfPerihelion: number = 272.85; 
    public meanTemperature: number = 72;   public surfaceTemperature: number = 72;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 14;
  public hasRingSystem: boolean = true;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;

    public composition: Record<string, number> = {
    Hydrogen: 80.0,
    Helium: 19.0,
    Methane: 1.0,
  };

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/neptune.jpeg");

        this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  
  protected updateRotation(dt: number): void {
        const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Neptune;
