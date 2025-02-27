import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";


class Mercury extends BasePlanet {
    public name: string = "Mercury";

    public mass: number = 3.285e23;   public radius: number = 2439.7;   public diameter: number = 4879.4;   public density: number = 5427;   public gravity: number = 3.7;   public escapeVelocity: number = 4.3; 
    public rotationPeriod: number = 58.646;   public lengthOfDay: number = 4222.6;   public obliquityToOrbit: number = 0.034; 
    public distanceFromSun: number = 57909050;   public perihelion: number = 46001200;   public aphelion: number = 69816900;   public semiMajorAxis: number = 57909050;   public semiMinorAxis: number = 56671900;   public eccentricity: number = 0.2056;   public orbitalPeriod: number = 87.969;   public orbitalVelocity: number = 47.87;   public orbitalInclination: number = 7.0;   public orbitalEccentricity: number = 0.2056; 
    public longitudeOfAscendingNode: number = 48.331;   public argumentOfPerihelion: number = 29.124; 
    public meanTemperature: number = 440;   public surfaceTemperature: number = 700;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public precessionRate: number = 43.0; 
    public texture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/mercury.jpeg");

        this.hasRelativisticPrecession = true;

        this.precessionRate = 43.0; 
        this.initialize();

    console.log(
      `Created ${this.name} planet with relativistic precession enabled`
    );
    console.log(`Precession rate: ${this.precessionRate} arcsec/century`);
  }

  
  protected updateRotation(dt: number): void {
            const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
  }
}

export default Mercury;
