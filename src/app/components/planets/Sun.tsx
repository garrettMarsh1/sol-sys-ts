import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

const sunTexture = new THREE.TextureLoader().load('images/sun.jpeg');
const lensFlareTexture = new THREE.TextureLoader().load('images/lens_flare.png');

class Sun {
    public name: string;
    public mass: number;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public radius: number;
    public surfaceTemperature: number;
    public luminosity: number;
    public age: number;
    public composition: Record<string, number>;
    public rotationPeriod: number;
    public magneticField: { polar: number; equatorial: number };
    public atmosphere: { layers: { name: string; temperature: number; pressure: number }[] };
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private mesh!: THREE.Mesh;
    private bloomComposer!: EffectComposer;
    private lensflareElement: LensflareElement | null = null;
    static mass: number;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.name = "Sun";
        this.mass = 1.989e30; // kg
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.radius = 696342e3 / 1000; // meters
        this.surfaceTemperature = 5778; // K
        this.luminosity = 1; // arbitrary unit
        this.age = 4.6e9; // years
        this.composition = {
            Hydrogen: 74.9,
            Helium: 24.1,
            Oxygen: 0.06,
            Carbon: 0.03,
            Neon: 0.01,
            Nitrogen: 0.01
        };
        this.rotationPeriod = 25.05; // days
        this.magneticField = {
            polar: 2e-5,
            equatorial: 4e-5
        };
        this.atmosphere = {
            layers: [
                { name: "photosphere", temperature: 5778, pressure: 0 },
                { name: "chromosphere", temperature: 10000, pressure: 0 },
                { name: "corona", temperature: 1e6, pressure: 0 }
            ]
        };

        this.setupSun();
        this.setupBloom();
        this.setupLensFlare();
    }

    private setupSun() {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 64, 64),
            new THREE.MeshBasicMaterial({ map: sunTexture })
        );
        this.mesh.position.set(0, 0, 0);
        this.scene.add(this.mesh);
    }

    private setupBloom() {
        this.bloomComposer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.0;  // Minimum brightness to trigger bloom
        bloomPass.strength = 1.0;   // Intensity of bloom
        bloomPass.radius = 1.0;     // Radius of bloom glow

        this.bloomComposer.addPass(renderPass);
        this.bloomComposer.addPass(bloomPass);
    }

    private setupLensFlare() {
        const sunMaterial = new THREE.SpriteMaterial({
            map: sunTexture,
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const sunSprite = new THREE.Sprite(sunMaterial);
        sunSprite.scale.set(100, 100, 100);

        this.lensflareElement = new LensflareElement(lensFlareTexture, 700, 0.5, new THREE.Color(0xffffff));

        const sun = new THREE.Object3D();
        sun.add(sunSprite);
 

        this.scene.add(sun);
    }

    public update() {
        const distance = this.camera.position.distanceTo(this.mesh.position)
        this.mesh.rotation.y += 0.0005;
        this.bloomComposer.render();
    }
}

export default Sun;
