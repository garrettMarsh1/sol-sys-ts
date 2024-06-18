import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'

class Pluto implements Planet{
    public name: string;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public radius: number;
    public mass: number;
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
    public moons: any[];
    public hasRingSystem: boolean;
    public hasGlobalMagneticField: boolean;
    public texture: THREE.Texture;
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public composition: Record<string, number>;
    public plutoParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    diameter!: number;
    surfaceTemperature!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;

    constructor() {
        this.name = 'Pluto';
        this.position = new THREE.Vector3(5906380624, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.radius = 1188;
        this.mass = 1.303e22;
        this.density = 2095;
        this.gravity = 0.62;
        this.escapeVelocity = 1.3;
        this.rotationPeriod = 6.3872;
        this.lengthOfDay = 153.3;
        this.distanceFromSun = 5906380624;
        this.perihelion = 4436000000;
        this.aphelion = 7375000000;
        this.orbitalPeriod = 248.54;
        this.orbitalVelocity = 4.74;
        this.orbitalInclination = 17.15;
        this.orbitalEccentricity = 0.2488;
        this.obliquityToOrbit = 122.53;
        this.meanTemperature = -229;
        this.surfacePressure = 0;
        this.numberOfMoons = 5;
        this.moons = [];
        this.hasRingSystem = false;
        this.hasGlobalMagneticField = false;
        this.texture = new THREE.TextureLoader().load('/assets/images/pluto.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.composition = {
            'Nitrogen': 2.7,
            'Methane': 0.2,
            'Carbon Monoxide': 0.2,
            'Carbon Dioxide': 0.1,
            'Water': 0.1,
            'Ammonia': 0.1,
            'Sodium': 0.1,
            'Magnesium': 0.1,
            'Silicon': 0.1,
            'Iron': 0.1
        };
        this.plutoParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 96, 96),
            new THREE.MeshPhongMaterial({
                map: this.texture
            })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.plutoParent.add(this.mesh);

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
        this.plutoParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Pluto;
