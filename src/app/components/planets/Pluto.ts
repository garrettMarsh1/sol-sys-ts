import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Pluto extends BasePlanet {
    public name: string = "Pluto";

    public mass: number = 1.303e22;   public radius: number = 1188;   public diameter: number = 2376;   public density: number = 2095;   public gravity: number = 0.62;   public escapeVelocity: number = 1.3; 
    public rotationPeriod: number = 6.3872;   public lengthOfDay: number = 153.3;   public obliquityToOrbit: number = 122.53; 
    public distanceFromSun: number = 5906380624;   public perihelion: number = 4436000000;   public aphelion: number = 7375000000;   public semiMajorAxis: number = 5906380624;   public semiMinorAxis: number = 5720000000;   public eccentricity: number = 0.2488;   public orbitalPeriod: number = 90560;   public orbitalVelocity: number = 4.74;   public orbitalInclination: number = 17.15;   public orbitalEccentricity: number = 0.2488; 
    public longitudeOfAscendingNode: number = 110.3;   public argumentOfPerihelion: number = 113.83; 
    public meanTemperature: number = 44;   public surfaceTemperature: number = 44;   public surfacePressure: number = 0.00001; 
    public numberOfMoons: number = 5;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = false;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;

    public composition: Record<string, number> = {
    "Nitrogen ice": 70,
    "Methane ice": 20,
    "Carbon monoxide ice": 10,
  };

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/pluto.jpeg");

        this.initialize();

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  
  public applyAxialTilt(): void {
        super.applyAxialTilt();

      }

  
  public calculateOrbit(elapsedTimeSeconds: number): void {
        super.calculateOrbit(elapsedTimeSeconds);
  }
}

export default Pluto;
