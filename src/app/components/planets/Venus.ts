import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";

class Venus extends BasePlanet {
    public name: string = "Venus";

    public mass: number = 4.867e24;   public radius: number = 6052;   public diameter: number = 12104;   public density: number = 5243;   public gravity: number = 8.87;   public escapeVelocity: number = 10.36; 
    public rotationPeriod: number = 243;   public lengthOfDay: number = 5832.5;   public obliquityToOrbit: number = 177.36; 
    public distanceFromSun: number = 108208930;   public perihelion: number = 107477000;   public aphelion: number = 108939000;   public semiMajorAxis: number = 108208930;   public semiMinorAxis: number = 108207740;   public eccentricity: number = 0.0067;   public orbitalPeriod: number = 224.701;   public orbitalVelocity: number = 35.02;   public orbitalInclination: number = 3.39;   public orbitalEccentricity: number = 0.0067; 
    public longitudeOfAscendingNode: number = 76.68;   public argumentOfPerihelion: number = 54.85; 
    public meanTemperature: number = 737;   public surfaceTemperature: number = 737;   public surfacePressure: number = 92e3; 
    public numberOfMoons: number = 0;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = false;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;
  private atmosphereTexture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/venus.jpeg");
    this.atmosphereTexture = textureLoader.load(
      "/assets/images/venusAtmosphere.jpeg"
    );

        const material = new THREE.MeshPhongMaterial({
      map: this.atmosphereTexture,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });

        this.initialize();

        if (this.mesh instanceof THREE.Mesh && this.mesh.material) {
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh.material = material;
    }

        this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with advanced physics at:`,
      this.position
    );
  }

  
  protected updateRotation(dt: number): void {
        const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationSpeed * dt);
  }
}

export default Venus;
