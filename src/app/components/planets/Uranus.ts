import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'
import { textureLoader } from "../../Utils/TextureLoader";

class Uranus implements Planet{
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
    public hasRingSystem: boolean;
    public hasGlobalMagneticField: boolean;
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public composition: Record<string, number>;
    public atmosphere: { layers: { name: string; temperature: number; pressure: number }[] };
    public albedo: number;
    public atmosphereScale: number;
    public lightDirection: THREE.Vector3;
    public uranusParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    public texture: THREE.Texture;
    surfaceTemperature: number;
    diameter!: number;
    magneticField: { polar: number; equatorial: number; };

    constructor() {
        this.name = 'Uranus';
        this.position = new THREE.Vector3(2870658186, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.radius = 25559;
        this.mass = 8.681e25;
        this.density = 1271;
        this.gravity = 8.87;
        this.escapeVelocity = 21.3;
        this.rotationPeriod = 17.24;
        this.lengthOfDay = 17.24;
        this.distanceFromSun = 2870658186;
        this.perihelion = 2743000000;
        this.aphelion = 2998400000;
        this.orbitalPeriod = 30589.75;
        this.orbitalVelocity = 6.81;
        this.orbitalInclination = 0.772;
        this.orbitalEccentricity = 0.046381;
        this.obliquityToOrbit = 97.77;
        this.meanTemperature = -195;
        this.surfacePressure = 0;
        this.numberOfMoons = 27;
        this.hasRingSystem = true;
        this.hasGlobalMagneticField = true;
        this.texture = textureLoader.load('/assets/images/uranus.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.surfaceTemperature = 77; // K
        this.magneticField = {
            polar: 0.0001,
            equatorial: 0.0002
        };
        this.composition = {
            hydrogen: 0.76,
            helium: 0.24,
            methane: 0.01,
            water: 0.01,
            ammonia: 0.01,
            other: 0.01
        };
        this.atmosphere = {
            layers: [
                { name: "troposphere", temperature: 77, pressure: 0 },
                { name: "stratosphere", temperature: 77, pressure: 0 },
                { name: "mesosphere", temperature: 77, pressure: 0 },
                { name: "thermosphere", temperature: 77, pressure: 0 }
            ]
        };
        this.albedo = 0.5;
        this.atmosphereScale = 0.1;
        this.lightDirection = new THREE.Vector3(1, 1, 1);

        this.uranusParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 96, 96),
            new THREE.MeshPhongMaterial({
                map: this.texture
            })
        );

        this.mesh.name = this.name;
        this.uranusParent.add(this.mesh);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
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
        this.uranusParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Uranus;