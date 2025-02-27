import * as THREE from "three";
import { textureLoader } from "../../Utils/TextureLoader";
import { BasePlanet } from "./BasePlanet";


const vertexShader = `
precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

uniform float time;

void main() {
    vUv = vec2(uv.x + time, uv.y); 
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    mat3 normalMatrixWorld = mat3(transpose(inverse(modelMatrix)));
    vWorldNormal = normalize(normalMatrixWorld * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}


`;

const fragmentShader = `
precision highp float;

uniform sampler2D earthMap;
uniform sampler2D nightMap;

uniform vec3 lightPos;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
        vec4 dayColor = texture2D(earthMap, vUv);
    vec4 nightColor = texture2D(nightMap, vUv);

        vec3 lightDirection = normalize(lightPos - vWorldPosition);

        float lightIntensity = max(dot(normalize(vWorldNormal), lightDirection), 0.0);

        vec4 finalColor = mix(nightColor, dayColor, lightIntensity);
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}
`;


class Earth extends BasePlanet {
    public name: string = "Earth";

    public mass: number = 5.972e24;   public radius: number = 6371;   public diameter: number = 12742;   public density: number = 5514;   public gravity: number = 9.807;   public escapeVelocity: number = 11.186; 
    public rotationPeriod: number = 0.99726;   public lengthOfDay: number = 24.0;   public obliquityToOrbit: number = 23.439; 
    public distanceFromSun: number = 149597890;   public perihelion: number = 147095000;   public aphelion: number = 152100000;   public semiMajorAxis: number = 149597890;   public semiMinorAxis: number = 149577000;   public eccentricity: number = 0.0167;   public orbitalPeriod: number = 365.256;   public orbitalVelocity: number = 29.78;   public orbitalInclination: number = 0.0;   public orbitalEccentricity: number = 0.0167;

    public longitudeOfAscendingNode: number = 174.873;   public argumentOfPerihelion: number = 288.064; 
    public meanTemperature: number = 288;   public surfaceTemperature: number = 288;   public surfacePressure: number = 101325; 
    public numberOfMoons: number = 1;
  public hasRingSystem: boolean = false;
  public hasGlobalMagneticField: boolean = true;
  public centralBody: number = 1.989e30; 
    public magneticField: { polar: number; equatorial: number } = {
    polar: 2e-5,
    equatorial: 4e-5,
  };
  public atmosphere: {
    layers: { name: string; temperature: number; pressure: number }[];
  } = {
    layers: [
      {
        name: "troposphere",
        temperature: 288,
        pressure: 101325,
      },
      {
        name: "stratosphere",
        temperature: 216,
        pressure: 22632,
      },
      {
        name: "mesosphere",
        temperature: 186,
        pressure: 5474,
      },
      {
        name: "thermosphere",
        temperature: 186,
        pressure: 5474,
      },
    ],
  };

    public texture: THREE.Texture;
  private nightTexture: THREE.Texture;
  private shaderMaterial: THREE.ShaderMaterial;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    super(renderer, scene, camera);

        this.texture = textureLoader.load("/assets/images/earth.jpeg");
    this.nightTexture = textureLoader.load(
      "/assets/images/8k_earth_nightmap.jpeg"
    );

        this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        earthMap: { value: this.texture },
        nightMap: { value: this.nightTexture },
                lightPos: { value: new THREE.Vector3(0, 0, 0) },
      },
    });

        this.initializeWithShader();

        this.hasRelativisticPrecession = true;

    console.log(
      `Created ${this.name} planet with shader effects at:`,
      this.position
    );
  }

  
  private initializeWithShader(): void {
        this.planetGroup = new THREE.Group();
    this.planetGroup.name = `${this.name}-group`;

        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    this.mesh = new THREE.Mesh(geometry, this.shaderMaterial);
    this.mesh.name = this.name;

        this.planetGroup.add(this.mesh);

        this.position = new THREE.Vector3(this.distanceFromSun, 0, 0);
    this.planetGroup.position.copy(this.position);

        this.calculateInitialVelocity();

        this.initializeOrbitalElements();

        this.applyAxialTilt();

        this.scene.add(this.planetGroup);
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
    super.update(dt);

        const rotationPeriodSeconds = this.rotationPeriod * 86400; 
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed * dt);

        if (this.shaderMaterial.uniforms) {
        this.shaderMaterial.uniforms.lightPos.value.set(0, 0, this.distanceFromSun);
    }
}
}

export default Earth;
