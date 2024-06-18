import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import FirstPersonCamera from './Camera/FirstPersonCamera';
import Sun from './planets/Sun';
import Mercury from './planets/Mercury';
import Venus from './planets/Venus';
import Earth from './planets/Earth';
import Mars from './planets/Mars';
import Jupiter from './planets/Jupiter';
import Saturn from './planets/Saturn';
import Uranus from './planets/Uranus';
import Neptune from './planets/Neptune';
import Pluto from './planets/Pluto';
import Stars from './stars/stars';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useEffect, useRef } from 'react';
import { Planet } from './Interface/PlanetInterface';

const BLOOM_LAYER = 1;

const MainScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mainInstance = useRef<Main | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            mainInstance.current = new Main(containerRef.current);
        }

        return () => {
            mainInstance.current?.dispose(); // Clean up on unmount if needed
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default MainScene;

class Main {
    private renderer!: THREE.WebGLRenderer;
    private camera!: THREE.PerspectiveCamera;
    private fpsCamera!: FirstPersonCamera;
    private scene!: THREE.Scene;
    private stars!: Stars;
    private planets: { object: Planet; update: (dt: number) => void; mesh: THREE.Mesh | THREE.Group }[] = [];
    private normalComposer!: EffectComposer;
    private bloomComposer!: EffectComposer;
    private objects_: THREE.Object3D[] = [];
    private container: HTMLDivElement;
    private followPlanet: boolean = false;
    private targetPlanet?: Planet;
    private followOffset!: THREE.Vector3;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.init();
    }

    init() {
        this.setupScene();
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupPlanets();
        this.setupStars();
        this.setupEventListeners();
        this.setupPostProcessing();
        this.animate();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('click', (event) => {
            console.log('Click event registered:', event);
            this.onMouseClick(event);
        });

        window.addEventListener('resize', () => {
            this.fpsCamera.camera.aspect = window.innerWidth / window.innerHeight;
            this.fpsCamera.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    onMouseClick(event: MouseEvent) {
        console.log('Handling mouse click:', event.clientX, event.clientY);

        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        console.log('Normalized mouse coordinates:', mouse.x, mouse.y);

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.fpsCamera.camera);
        console.log('Raycaster:', raycaster);
        const intersects = raycaster.intersectObjects(this.planets.map(p => p.mesh));

        console.log("Intersects:", intersects);
        if (intersects.length > 0) {
            const intersectedPlanet = intersects[0].object;
            const planet = this.planets.find(p => p.mesh === intersectedPlanet);
            if (planet) {
                this.followPlanet = false; // Stop following any planet during the tween
                this.fpsCamera.setFollowing(false); // Disable following during the tween
                this.targetPlanet = planet.object;
                this.followOffset = new THREE.Vector3(0, planet.object.diameter * 5, planet.object.diameter * 5);
                this.warpToPlanet(planet.object.name);
                console.log("Planet clicked:", planet.object.name);
            }
        } else {
            this.followPlanet = false;
            this.fpsCamera.setFollowing(false); // Disable following when no planet is clicked
            this.targetPlanet = undefined;
        }
    }

    warpToPlanet(planetName: string) {
        const planet = this.planets.find(p => p.object.name === planetName);
        if (planet) {
            const planetPosition = planet.mesh.position.clone();
            const targetPosition = planetPosition.clone().add(this.followOffset);

            new TWEEN.Tween(this.fpsCamera.translation_)
                .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 2000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    this.fpsCamera.camera.lookAt(planetPosition);
                    console.log('camera coordinates during tween:', this.fpsCamera.translation_.toArray());
                })
                .onComplete(() => {
                    this.followPlanet = true; // Start following the planet after the tween completes
                    this.fpsCamera.setFollowing(true); // Enable following after the tween completes
                })
                .start();

            console.log(`Warped to planet: ${planetName} at position: ${planetPosition.toArray()}`);
        } else {
            console.log(`Planet not found: ${planetName}`);
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, precision: "highp" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(105, window.innerWidth / window.innerHeight, 1, 1e10);
        this.camera.position.set(1e8, 3e7, 3e7);
        this.fpsCamera = new FirstPersonCamera(this.camera, this.objects_);
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupStars() {
        this.stars = new Stars(this.scene, this.renderer, this.fpsCamera.camera);
    }

    setupPostProcessing() {
        this.normalComposer = new EffectComposer(this.renderer);
        const normalRenderPass = new RenderPass(this.scene, this.fpsCamera.camera);
        normalRenderPass.clear = true;
        this.normalComposer.addPass(normalRenderPass);

        this.bloomComposer = new EffectComposer(this.renderer);
        const bloomRenderPass = new RenderPass(this.scene, this.fpsCamera.camera);
        bloomRenderPass.clear = true;
        this.bloomComposer.addPass(bloomRenderPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
        bloomPass.threshold = 0.0;
        bloomPass.strength = 1;
        bloomPass.radius = 0.5;
        bloomPass.clear = true;
        this.bloomComposer.addPass(bloomPass);

        // Ensure all layers are enabled after setup
        this.fpsCamera.camera.layers.enableAll();
    }

    setupLights() {
        const directionalLight = new THREE.PointLight(0xffffff, 0.4);
        directionalLight.position.set(0, 0, 0);
        this.scene.add(directionalLight);
    }

    setupPlanets() {
        const planetClasses = [Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto];
        this.planets = planetClasses.map(PlanetClass => {
            const planet = new PlanetClass(this.renderer, this.scene, this.fpsCamera.camera);
            if (PlanetClass === Sun) {
                planet.mesh.renderOrder = 1; // Render the Sun on top of other meshes
            } else {
                planet.mesh.renderOrder = 0; // Default render order for other planets
            }
            this.scene.add(planet.mesh);
            return {
                object: planet,
                update: planet.update.bind(planet),
                mesh: planet.mesh
            };
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = 1 / 60;
        this.planets.forEach(planet => planet.update(dt));
        this.fpsCamera.update(dt);

        if (this.followPlanet && this.targetPlanet) {
            const planetPosition = this.targetPlanet.position.clone();
            const targetPosition = planetPosition.clone().add(this.followOffset);
            this.fpsCamera.translation_.lerp(targetPosition, 0.1); // Smoothly interpolate the camera position
            this.fpsCamera.camera.lookAt(planetPosition);
            console.log('camera coordinates during follow:', this.fpsCamera.translation_.toArray());
        }

        TWEEN.update();
        this.renderer.clear();
        this.normalComposer.render();
        this.bloomComposer.render();
    }

    dispose() {
        // Cleanup if needed
    }
}

function main() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new Main(container);
}

main();
