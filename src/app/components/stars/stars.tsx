import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

class Stars {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private stars: THREE.Points[] = [];
    private composer!: EffectComposer;
    private radius: number = 696342e3 / 1000;

    constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.init();
    }

    init() {
        this.createStars();
        this.setupBloom();
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            sizeAttenuation: true
        });

        const positions = [];
        const spread = 100000000000000;
        for (let i = 0; i < 1000; i++) {
            positions.push(THREE.MathUtils.randFloatSpread(spread)); // x
            positions.push(THREE.MathUtils.randFloatSpread(spread)); // y
            positions.push(THREE.MathUtils.randFloatSpread(spread)); // z
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    setupBloom() {
        const renderPass = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.0;
        bloomPass.strength = 1.0; 
        bloomPass.radius = 5;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);
    }
}

export default Stars;
