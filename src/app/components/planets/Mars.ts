import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'
import { textureLoader } from "../../Utils/TextureLoader";

function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

class Mars implements Planet{
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
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public surfaceTemperature: number;
    public magneticField: { polar: number; equatorial: number };
    public atmosphere: { layers: { name: string; temperature: number; pressure: number }[] };
    public marsParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    radius!: number;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;

    constructor() {
        this.name = "Mars";
        this.position = new THREE.Vector3(227936640, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.lastUpdateTime = Date.now();
        this.mass = 6.39e23; // kg
        this.diameter = 6792; // km
        this.density = 3933; // kg/m^3
        this.gravity = 3.711; // m/s^2
        this.escapeVelocity = 5.03; // km/s
        this.rotationPeriod = 1.025; // days
        this.lengthOfDay = 24.7; // hours
        this.distanceFromSun = 227936640; // km
        this.perihelion = 206700000; // km
        this.aphelion = 249200000; // km
        this.orbitalPeriod = 686.98; // days
        this.orbitalVelocity = 24.13; // km/s
        this.orbitalInclination = 1.85; // degrees
        this.orbitalEccentricity = 0.0934; // unitless
        this.obliquityToOrbit = 25.19; // degrees
        this.meanTemperature = 210; // K
        this.surfacePressure = 0.006; // Pa
        this.numberOfMoons = 2; // unitless
        this.hasRingSystem = false; // boolean
        this.hasGlobalMagneticField = true; // boolean
        this.texture = textureLoader.load('/assets/images/mars.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.surfaceTemperature = 210; // K
        this.rotationPeriod = 1.03; // days
        this.magneticField = {
            polar: 2e-5,
            equatorial: 4e-5
        };
        this.atmosphere = {
            layers: [
                {
                    name: "troposphere",
                    temperature: 210,
                    pressure: 0.006
                },
                {
                    name: "stratosphere",
                    temperature: 216,
                    pressure: 22632
                },
                {
                    name: "mesosphere",
                    temperature: 186,
                    pressure: 5474
                },
                {
                    name: "thermosphere",
                    temperature: 186,
                    pressure: 5474
                }
            ]
        };

        this.marsParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2, 64, 64),
            new THREE.MeshPhongMaterial({
                map: this.texture
            })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.marsParent.add(this.mesh);

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);

        // Apply axial tilt
        this.mesh.rotation.x = degToRad(this.obliquityToOrbit);
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
        this.marsParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Mars;