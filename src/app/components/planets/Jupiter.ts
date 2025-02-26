import * as THREE from 'three';
import Sun from './Sun';
import { Planet } from '../Interface/PlanetInterface'
import { textureLoader } from "../../Utils/TextureLoader";


class Jupiter implements Planet{
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
    public jupiterParent: THREE.Object3D;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    diameter!: number;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;



    constructor() {
        this.name = 'Jupiter';
        this.position = new THREE.Vector3(778547200, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        this.mass = 1.898e27; // kg
        this.radius = 69911; // km
        this.density = 1.326; // g/cm^3
        this.gravity = 24.79; // m/s^2
        this.escapeVelocity = 59.5; // km/s
        this.rotationPeriod = 9.925 * 3600; // seconds
        this.lengthOfDay = 9.925; // hours
        this.distanceFromSun = 778547200; // km
        this.perihelion = 740573600; // km
        this.aphelion = 816520800; // km
        this.orbitalPeriod = 4332.59 * 86400; // seconds
        this.orbitalVelocity = 13.07; // km/s
        this.orbitalInclination = 1.305; // degrees
        this.orbitalEccentricity = 0.0489; // unitless
        this.obliquityToOrbit = 3.13; // degrees
        this.meanTemperature = 165; // K
        this.surfacePressure = 0; // Pa
        this.numberOfMoons = 79; // unitless
        this.hasRingSystem = true; // boolean
        this.hasGlobalMagneticField = true; // boolean
        this.texture = textureLoader.load('/assets/images/jupiter.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.surfaceTemperature = 165; // K
        this.rotationPeriod = 0.41354; // days
        this.magneticField = {
            polar: 0.0001,
            equatorial: 0.0002
        };
        this.atmosphere = {
            layers: [
                {
                    name: "troposphere",
                    temperature: 165,
                    pressure: 0
                },
                {
                    name: "stratosphere",
                    temperature: 165,
                    pressure: 0
                },
                {
                    name: "mesosphere",
                    temperature: 165,
                    pressure: 0
                },
                {
                    name: "thermosphere",
                    temperature: 165,
                    pressure: 0
                }
            ]
        };

        this.jupiterParent = new THREE.Object3D();
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 96, 96),
            new THREE.MeshLambertMaterial({
                map: this.texture
            })
        );

        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        this.jupiterParent.add(this.mesh);
        
        // Rotate the Jupiter mesh to match the orbital inclination
        this.mesh.rotation.x = this.orbitalInclination * (-Math.PI / 180);

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);

        this.lastUpdateTime = Date.now();
    }
    solveKepler(M: number, e: number): number {
        // Solve Kepler's equation for the eccentric anomaly (E) given the mean anomaly (M) and eccentricity (e)
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
        this.jupiterParent.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.mesh.rotation.y += rotationSpeed; // Accurate rotation speed
    }
}

export default Jupiter;