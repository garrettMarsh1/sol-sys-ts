import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'
import { textureLoader } from "../../Utils/TextureLoader";

class Neptune implements Planet{
    public name: string;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public mass: number;
    public radius: number;
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
    public numberOfMoons: number;
    public surfacePressure: number;
    public hasRingSystem: boolean;
    public hasGlobalMagneticField: boolean;
    public texture: THREE.Texture;
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public rotationPeriodDays: number;
    public surfaceTemperature: number;
    public composition: Record<string, number>;
    public albedo: number;
    public atmosphereScale: number;
    public lightDirection: THREE.Vector3;
    public neptuneParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    diameter!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;


    constructor() {
        this.name = 'Neptune';
        this.position = new THREE.Vector3(4498396441, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 1.024e26;
        this.radius = 24764;
        this.density = 1638;
        this.gravity = 11.15;
        this.escapeVelocity = 23.5;
        this.rotationPeriod = 0.67125;
        this.lengthOfDay = 16.11;
        this.distanceFromSun = 4498396441;
        this.perihelion = 4444600000;
        this.aphelion = 4552200000;
        this.orbitalPeriod = 60190;
        this.orbitalVelocity = 5.43;
        this.orbitalInclination = 1.77;
        this.orbitalEccentricity = 0.010;
        this.obliquityToOrbit = 28.32;
        this.meanTemperature = -201;
        this.numberOfMoons = 14;
        this.surfacePressure = 0;
        this.hasRingSystem = false;
        this.hasGlobalMagneticField = true;
        this.texture = textureLoader.load('/assets/images/neptune.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.rotationPeriodDays = 0.67125;
        this.surfaceTemperature = -201;
        this.centralBody = Sun.mass;
        this.composition = {
            'Hydrogen': 76.3,
            'Helium': 23.1,
            'Methane': 0.6
        };
        this.albedo = 0.5;
        this.atmosphereScale = 0.1;
        this.lightDirection = new THREE.Vector3(1, 1, 1);

        this.neptuneParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 64, 64),
            new THREE.MeshBasicMaterial({
                map: this.texture
            })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.neptuneParent.add(this.mesh);

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);
        this.lastUpdateTime = Date.now();
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
        this.neptuneParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriodDays * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Neptune;