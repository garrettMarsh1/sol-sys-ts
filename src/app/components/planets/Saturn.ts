import * as THREE from 'three';
import { Planet } from '../Interface/PlanetInterface';
import Sun from './Sun';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { textureLoader } from "../../Utils/TextureLoader";

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
    public saturnGroup: THREE.Group;
    public lastUpdateTime: number;
    public modelPath: string;
    public texture: THREE.Texture;
    diameter!: number;
    surfaceTemperature!: number;
    magneticField?: { polar: number; equatorial: number; } | undefined;
    atmosphere?: { layers: { name: string; temperature: number; pressure: number; }[]; } | undefined;
    composition?: Record<string, number> | undefined;
    albedo?: number | undefined;
    atmosphereScale?: number | undefined;
    lightDirection?: THREE.Vector3 | undefined;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.name = 'Saturn';
        this.position = new THREE.Vector3(1433449370, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 5.683e26; // kg
        this.radius = 58232; // km
        this.diameter = this.radius * 2;
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
        
        // Load texture with the enhanced loader
        this.texture = textureLoader.load('/assets/images/saturn.jpeg');
        
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.modelPath = '/assets/models/Saturn_1_120536.glb'; // Updated path to the GLB model
        this.surfaceTemperature = 134; // K

        // Create a group to hold Saturn and its rings
        this.saturnGroup = new THREE.Group();
        this.saturnGroup.name = "Saturn Group";
        
        // Create a basic Saturn planet as a fallback
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 64, 64),
            new THREE.MeshPhongMaterial({ 
                map: this.texture 
            })
        );
        this.mesh.name = this.name;
        this.saturnGroup.add(this.mesh);

        // Set the initial position
        this.saturnGroup.position.set(this.position.x, this.position.y, this.position.z);
        
        // Try to load the GLTF model
        this.loadModel();

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);
        this.lastUpdateTime = Date.now();
        
        // Important: Make the mesh property point to the group
        // This ensures MainScene can add the entire group to the scene
        this.mesh = this.saturnGroup as any;
        
        console.log(`Created ${this.name} planet at:`, this.position);
    }

    private loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            this.modelPath, 
            (gltf) => {
                console.log("Loaded Saturn GLTF model successfully");
                
                // Remove placeholder mesh from the group
                const placeholderMesh = this.saturnGroup.children.find(child => child.name === this.name);
                if (placeholderMesh) {
                    this.saturnGroup.remove(placeholderMesh);
                }
                
                // Scale and position the model
                gltf.scene.scale.set(1000, 1000, 1000); // Adjust scale as needed
                
                // Add the loaded model to our Saturn group
                this.saturnGroup.add(gltf.scene);
                
                // Traverse to find mesh objects and update materials if needed
                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        // Update materials or properties if needed
                        const mesh = child as THREE.Mesh;
                        if (mesh.name.includes("Saturn")) {
                            // Keep a reference to the main Saturn mesh for potential use
                            // But don't change this.mesh as it needs to remain pointing to the group
                        }
                    }
                });
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading Saturn model:', error);
                console.log("Using fallback sphere mesh for Saturn");
                // Keep using the fallback mesh created in the constructor
            }
        );
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

        // Update the whole group position
        this.saturnGroup.position.set(x, y, z);
        
        // Update reference position for other calculations
        this.position = this.saturnGroup.position.clone();
    }

    update(dt: number) {
        this.calculateOrbit();
        
        // Apply rotation for Saturn's day
        const rotationSpeed = (2 * Math.PI) / (this.rotationPeriod * 86400); // Convert days to seconds
        this.saturnGroup.rotation.y += rotationSpeed * dt;
    }
}

export default Saturn;