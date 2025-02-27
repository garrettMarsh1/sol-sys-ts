import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";


class Saturn extends BasePlanet {
    public name: string = "Saturn";

    public mass: number = 5.683e26;   public radius: number = 58232;   public diameter: number = 116464;   public density: number = 687;   public gravity: number = 10.44;   public escapeVelocity: number = 35.5; 
    public rotationPeriod: number = 0.444;   public lengthOfDay: number = 10.66;   public obliquityToOrbit: number = 26.73; 
    public distanceFromSun: number = 1433449370;   public perihelion: number = 1352550000;   public aphelion: number = 1514348740;   public semiMajorAxis: number = 1433449370;   public semiMinorAxis: number = 1427000000;   public eccentricity: number = 0.0565;   public orbitalPeriod: number = 10759.22;   public orbitalVelocity: number = 9.69;   public orbitalInclination: number = 2.485;   public orbitalEccentricity: number = 0.0565; 
    public longitudeOfAscendingNode: number = 113.72;   public argumentOfPerihelion: number = 339.39; 
    public meanTemperature: number = 134;   public surfaceTemperature: number = 134;   public surfacePressure: number = 0; 
    public numberOfMoons: number = 82;
  public hasRingSystem: boolean = true;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public texture: THREE.Texture;

    private modelPath: string = "/assets/models/Saturn_1_120536.glb";
  private gltfModel: THREE.Group | null = null;
  private ringsMesh: THREE.Mesh | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/saturn.jpeg");

        this.initializeSaturnWithModel();

    console.log(
      `Created ${this.name} planet with ring model at:`,
      this.position
    );
  }

  
  private initializeSaturnWithModel(): void {
        this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: this.texture,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = this.name;
    this.planetGroup.add(this.mesh);

        this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.planetGroup.position.copy(this.position);

        this.calculateInitialVelocity();

        this.initializeOrbitalElements();

        this.applyAxialTilt();

        this.loadGLTFModel();

        this.scene.add(this.planetGroup);
  }

  
  private loadGLTFModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      this.modelPath,
      (gltf) => {
        console.log("Loaded Saturn GLTF model successfully");

                const placeholderMesh = this.planetGroup.children.find(
          (child) => child.name === this.name
        );
        if (placeholderMesh) {
          this.planetGroup.remove(placeholderMesh);
        }

                gltf.scene.scale.set(1000, 1000, 1000); 
                this.gltfModel = gltf.scene;

                this.planetGroup.add(gltf.scene);

                gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
            if (mesh.name.includes("Saturn")) {
              this.mesh = mesh;
            }

                        if (mesh.name.includes("Ring")) {
              this.ringsMesh = mesh;
            }
          }
        });

                this.applyAxialTilt();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error loading Saturn model:", error);
        console.log("Using fallback sphere mesh for Saturn");
      }
    );
  }

  
  public calculateInitialVelocity(): void {
        this.meanAnomaly = 0;

        const E = this.solveKepler(this.meanAnomaly, this.eccentricity);

        this.velocity = new THREE.Vector3(0, this.orbitalVelocity, 0);
  }

  
  private initializeOrbitalElements(): void {
        if (!this.semiMinorAxis) {
      this.semiMinorAxis =
        this.semiMajorAxis *
        Math.sqrt(1 - this.eccentricity * this.eccentricity);
    }

        if (this.longitudeOfAscendingNode === undefined) {
      this.longitudeOfAscendingNode = 0;
    }

    if (this.argumentOfPerihelion === undefined) {
      this.argumentOfPerihelion = 0;
    }

        this.orbitalInclinationRad = this.orbitalInclination * (Math.PI / 180);
  }

  
  public update(dt: number): void {
        this.calculateOrbit(dt);

        this.updateRotation(dt);
  }

  
  protected updateRotation(dt: number): void {
        const rotationPeriodSeconds = this.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        if (this.gltfModel) {
      this.gltfModel.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        rotationSpeed * dt
      );
    } else {
            this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);
    }
  }
}

export default Saturn;
