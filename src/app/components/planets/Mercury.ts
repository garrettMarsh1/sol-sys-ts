import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'

class Mercury implements Planet {
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
    public semiMajorAxis: number;
    public semiMinorAxis!: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public mercuryParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    radius!: number;
    surfaceTemperature!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;
    
    constructor() {
        this.name = "Mercury";
        this.position = new THREE.Vector3(57909050, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 3.285 * Math.pow(10, 23);
        this.diameter = 4879;
        this.density = 5427;
        this.gravity = 3.7;
        this.escapeVelocity = 4.3;
        this.rotationPeriod = 58.65;
        this.lengthOfDay = 4222.6;
        this.distanceFromSun = 57909050;
        this.perihelion = 46001200;
        this.aphelion = 69816700;
        this.orbitalPeriod = 87.969;
        this.orbitalVelocity = 47.87;
        this.orbitalInclination = 7;
        this.orbitalEccentricity = 0.2056;
        this.obliquityToOrbit = 0.034;
        this.meanTemperature = 167;
        this.surfacePressure = 0;
        this.numberOfMoons = 0;
        this.hasRingSystem = false;
        this.hasGlobalMagneticField = false;
        this.texture = new THREE.TextureLoader().load('/assets/images/mercury.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.eccentricity = (this.aphelion - this.perihelion) / (this.aphelion + this.perihelion); // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0 at t = 0
        this.centralBody = Sun.position;
        this.lastUpdateTime = Date.now();

        

        this.mercuryParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2, 64, 64),
            new THREE.MeshPhongMaterial({
                map: this.texture
            })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mercuryParent.add(this.mesh);

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);
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
        this.mercuryParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Mercury;
