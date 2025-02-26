import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'
import { textureLoader } from "../../Utils/TextureLoader";


class Venus implements Planet{
    public name: string;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public mass: number;
    public diameter: number;
    public density: number;
    public gravity: number;
    public escapeVelocity: number;
    public rotationPeriod: number;
    public lengthOfDay: number;
    public distanceFromSun: number;
    public perihelion: number;
    public aphelion: number;
    public orbitalPeriod: number;
    public orbitalVelocity: number;
    public orbitalInclination: number;
    public orbitalEccentricity: number;
    public obliquityToOrbit: number;
    public meanTemperature: number;
    public surfacePressure: number;
    public numberOfMoons: number;
    public hasRingSystem: boolean;
    public hasGlobalMagneticField: boolean;
    public texture: THREE.Texture;
    public atmosphereTexture: THREE.Texture;
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public surfaceTemperature: number;
    public venusParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    radius!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.name = "Venus";
        this.position = new THREE.Vector3(108208930, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 4.867e24; // kg
        this.diameter = 12104; // km
        this.radius = this.diameter / 2;
        this.density = 5243; // kg/m^3
        this.gravity = 8.87; // m/s^2
        this.escapeVelocity = 10.36; // km/s
        this.rotationPeriod = 243; // days
        this.lengthOfDay = 5832.5; // hours
        this.distanceFromSun = 108208930; // km
        this.perihelion = 107477000; // km
        this.aphelion = 108939000; // km
        this.orbitalPeriod = 224.701; // days
        this.orbitalVelocity = 35.02; // km/s
        this.orbitalInclination = 3.39; // degrees
        this.orbitalEccentricity = 0.0067; // unitless
        this.obliquityToOrbit = 177.36; // degrees
        this.meanTemperature = 737; // K
        this.surfacePressure = 92e3; // Pa
        this.numberOfMoons = 0; // unitless
        this.hasRingSystem = false; // boolean
        this.hasGlobalMagneticField = false; // boolean
        this.texture = textureLoader.load('/assets/images/venus.jpeg');
        this.atmosphereTexture = textureLoader.load('/assets/images/venusAtmosphere.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.surfaceTemperature = 737; // K
        this.rotationPeriod = 243; // days
        this.lengthOfDay = 5832.5; // hours

        this.venusParent = new THREE.Object3D();

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2, 64, 64),
            new THREE.MeshPhongMaterial({
                map: this.atmosphereTexture
            })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.venusParent.add(this.mesh);

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);
        this.lastUpdateTime = Date.now();
        
        // Note: Don't add to scene here - MainScene.tsx will handle that
        console.log(`Created ${this.name} planet at:`, this.position);
    }


    solveKepler(M: number, e: number): number {
        let E = M;
        let delta = 1;
        while (delta > 1e-6) {
            delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            E -= delta;
        }
        return E;
    }

    calculateOrbit() {
        const elapsedTime = (Date.now() - this.lastUpdateTime) / 1000; // Time in seconds
        this.lastUpdateTime = Date.now();

        const meanMotion = 2 * Math.PI / this.orbitalPeriod; // Mean motion (radians per day)
        this.meanAnomaly += meanMotion * (elapsedTime / 86400); // Update mean anomaly

        const E = this.solveKepler(this.meanAnomaly, this.eccentricity);
        const x = this.semiMajorAxis * (Math.cos(E) - this.eccentricity);
        const y = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity ** 2) * Math.sin(E);
        const z = 0; // Assuming orbit in the xy-plane

        this.mesh.position.set(x, y, z);
        this.position = this.mesh.position.clone(); // Update position property
        this.venusParent.position.set(x, y, z);
    }

    update(dt: number) {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Venus;