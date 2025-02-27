import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Jupiter extends BasePlanet {
    public name: string = "Jupiter";

    public mass: number = 1.898e27;   public radius: number = 69911;   public diameter: number = 139822;   public density: number = 1326;   public gravity: number = 24.79;   public escapeVelocity: number = 59.5; 
    public rotationPeriod: number = 0.41354;   public lengthOfDay: number = 9.925;   public obliquityToOrbit: number = 3.13; 
    public distanceFromSun: number = 778547200;   public perihelion: number = 740573600;   public aphelion: number = 816520800;   public semiMajorAxis: number = 778547200;   public semiMinorAxis: number = 777500000;   public eccentricity: number = 0.0489;   public orbitalPeriod: number = 4332.59;   public orbitalVelocity: number = 13.07;   public orbitalInclination: number = 1.305;   public orbitalEccentricity: number = 0.0489; 
    public longitudeOfAscendingNode: number = 100.56;   public argumentOfPerihelion: number = 273.88; 
    public meanTemperature: number = 165;   public surfaceTemperature: number = 165;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 79;
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

        this.texture = textureLoader.load("/assets/images/jupiter.jpeg");

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

export default Jupiter;
