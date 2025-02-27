import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Uranus extends BasePlanet {
    public name: string = "Uranus";

    public mass: number = 8.681e25;   public radius: number = 25559;   public diameter: number = 51118;   public density: number = 1271;   public gravity: number = 8.87;   public escapeVelocity: number = 21.3; 
    public rotationPeriod: number = 0.71833;   public lengthOfDay: number = 17.24;   public obliquityToOrbit: number = 97.77; 
    public distanceFromSun: number = 2870658186;   public perihelion: number = 2743000000;   public aphelion: number = 2998400000;   public semiMajorAxis: number = 2870658186;   public semiMinorAxis: number = 2869000000;   public eccentricity: number = 0.046381;   public orbitalPeriod: number = 30688.5;   public orbitalVelocity: number = 6.81;   public orbitalInclination: number = 0.772;   public orbitalEccentricity: number = 0.046381; 
    public longitudeOfAscendingNode: number = 74.23;   public argumentOfPerihelion: number = 96.7; 
    public meanTemperature: number = 77;   public surfaceTemperature: number = 77;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 27;
  public hasRingSystem: boolean = true;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/uranus.jpeg");

        this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  
  public applyAxialTilt(): void {
            super.applyAxialTilt();
  }

  
  protected updateRotation(dt: number): void {
            const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Uranus;
