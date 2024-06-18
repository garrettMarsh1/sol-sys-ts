import * as THREE from 'three';
import { Planet } from '../Interface/PlanetInterface';
import Sun from './Sun';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


class Saturn implements Planet {
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
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public mesh: THREE.Mesh;
    public lastUpdateTime: number;
    public modelPath: string;
    private ringMesh: THREE.Mesh;
    diameter!: number;
    texture!: THREE.Texture;
    surfaceTemperature!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;

    constructor() {
        this.name = 'Saturn';
        this.position = new THREE.Vector3(1433449370, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 5.683e26; // kg
        this.radius = 58232; // km
        this.density = 0.687; // g/cm^3
        this.gravity = 10.44; // m/s^2
        this.escapeVelocity = 35.5; // km/s
        this.rotationPeriod = 0.444; // days
        this.lengthOfDay = 10.66; // hours
        this.distanceFromSun = 1433449370; // km
        this.perihelion = 1352550000; // km
        this.aphelion = 1514348740; // km
        this.orbitalPeriod = 10759.22; // days
        this.orbitalVelocity = 9.69; // km/s
        this.orbitalInclination = 2.485; // degrees
        this.orbitalEccentricity = 0.0565; // unitless
        this.obliquityToOrbit = 26.73; // degrees
        this.meanTemperature = 134; // K
        this.surfacePressure = 0; // Pa
        this.numberOfMoons = 82; // unitless
        this.hasRingSystem = true; // boolean
        this.hasGlobalMagneticField = true; // boolean
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.modelPath = 'assets/models/Saturn_1_120536.glb'; // Path to the GLB model

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius / 2, 64, 64),
            new THREE.MeshPhongMaterial({ color: 0xffff00 })
        );
        this.mesh.name = this.name;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        this.ringMesh = new THREE.Mesh(); // Placeholder for the rings

        this.loadModel();

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);
        this.lastUpdateTime = Date.now();
    }


    private loadModel() {
        const loader = new GLTFLoader();
        loader.load(this.modelPath, (gltf: { scene: any; }) => {
            const model = gltf.scene;
            model.traverse((child: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (mesh.name.includes("Ring")) {
                        this.ringMesh = mesh;
                        this.mesh.add(this.ringMesh);
                    } else {
                        this.mesh = mesh;
                    }
                }
            });
        });
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

    update(dt: number) {
        const elapsedTime = (Date.now() - this.lastUpdateTime) / 1000; // Time in seconds
        this.lastUpdateTime = Date.now();

        const meanMotion = 2 * Math.PI / this.orbitalPeriod; // Mean motion (radians per day)
        this.meanAnomaly += meanMotion * (elapsedTime / 86400); // Update mean anomaly

        const E = this.solveKepler(this.meanAnomaly, this.eccentricity);
        const x = this.semiMajorAxis * (Math.cos(E) - this.eccentricity);
        const y = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity ** 2) * Math.sin(E);
        const z = 0; // Assuming orbit in the xy-plane

        this.mesh.position.set(x, y, z);
    }
}

export default Saturn;
