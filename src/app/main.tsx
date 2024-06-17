import './style.css';
import './input.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import FirstPersonCamera from './FirstPersonCamera';
import Sun from './components/planets/Sun';
import Mercury from './components/planets/Mercury';
import Venus from './components/planets/Venus';
import Earth from './components/planets/Earth';
import Mars from './components/planets/Mars';
import Jupiter from './components/planets/Jupiter';
import Saturn from './components/planets/Saturn';
import Uranus from './components/planets/Uranus';
import Neptune from './components/planets/Neptune';
import Pluto from './components/planets/Pluto';
import Stars from './components/stars/stars';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const BLOOM_LAYER = 1;

export default class Main {
    private renderer!: THREE.WebGLRenderer;
    private cssRenderer!: CSS2DRenderer;
    private camera!: THREE.PerspectiveCamera;
    private fpsCamera!: FirstPersonCamera;
    private scene!: THREE.Scene;
    private world!: CANNON.World;
    private stars!: Stars;
    private planets: { object: any; update: (dt: number) => void; mesh: THREE.Mesh }[] = [];
    private normalComposer!: EffectComposer;
    private bloomComposer!: EffectComposer;
    private objects_: THREE.Object3D[] = [];

    constructor() {
        this.init();
    }

    init() {
        this.setupScene();
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupWorld();
        this.setupPlanets();
        this.setupStars();
        this.setupEventListeners();
        this.setupMenu();
        this.setupPostProcessing();
        this.animate();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('click', (event) => {
            console.log('Click event registered:', event);
            this.onMouseClick(event);
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
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
        raycaster.setFromCamera(mouse, this.camera);
        console.log('Raycaster:', raycaster);
        const intersects = raycaster.intersectObjects(this.planets.map(p => p.mesh));

        console.log("Intersects:", intersects);
        if (intersects.length > 0) {
            const intersectedPlanet = intersects[0].object;
            this.fpsCamera.setTarget(intersectedPlanet);
            console.log("Planet clicked:", intersectedPlanet.name);
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, precision: "highp" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.cssRenderer = new CSS2DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = '0';
        document.body.appendChild(this.cssRenderer.domElement);
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
        this.stars = new Stars(this.scene, this.renderer, this.camera);
    }

    setupPostProcessing() {
        this.normalComposer = new EffectComposer(this.renderer);
        const normalRenderPass = new RenderPass(this.scene, this.camera);
        normalRenderPass.clear = true;
        this.normalComposer.addPass(normalRenderPass);

        this.bloomComposer = new EffectComposer(this.renderer);
        const bloomRenderPass = new RenderPass(this.scene, this.camera);
        bloomRenderPass.clear = true;
        this.bloomComposer.addPass(bloomRenderPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
        bloomPass.threshold = 0.0;
        bloomPass.strength = 1;
        bloomPass.radius = 0.5;
        bloomPass.clear = true;
        this.bloomComposer.addPass(bloomPass);

        // Ensure all layers are enabled after setup
        this.camera.layers.enableAll();
    }

    setupLights() {
        const directionalLight = new THREE.PointLight(0xffffff, 0.4);
        directionalLight.position.set(0, 0, 0);
        this.scene.add(directionalLight);
    }

    setupWorld() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
    }

    setupPlanets() {
        const planetClasses = [Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto];
        this.planets = planetClasses.map(PlanetClass => {
            const planet = new PlanetClass(this.renderer, this.scene, this.camera);
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

    warpToPlanet(planetName: string) {
        const planet = this.planets.find(p => p.object.name === planetName);
        if (planet) {
            const offset = planetName === 'Sun' ? new THREE.Vector3(1000000, 1000000, 1000000) : new THREE.Vector3(10000, 10000, 10000);
            this.fpsCamera.translation_.copy(planet.mesh.position.clone().add(offset));
            this.camera.lookAt(planet.mesh.position);
        }
    }

    setupMenu() {
        const menu = document.createElement('div');
        menu.style.position = 'absolute';
        menu.style.top = '10px';
        menu.style.left = '10px';
        menu.style.color = 'green';
        menu.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        menu.style.padding = '10px';
        menu.style.borderRadius = '8px';
        menu.style.width = 'auto';
        menu.style.zIndex = '1000';
        menu.style.fontFamily = 'Arial, sans-serif';
        menu.style.fontSize = '14px';
        document.body.appendChild(menu);

        const planetsContainer = document.createElement('div');
        planetsContainer.style.display = 'flex';
        planetsContainer.style.flexDirection = 'column';
        menu.appendChild(planetsContainer);

        this.planets.forEach(planet => {
            const planetInfo = document.createElement('div');
            planetInfo.id = `info-${planet.object.name}`;
            planetInfo.innerHTML = `${planet.object.name}: Loading...`;
            planetsContainer.appendChild(planetInfo);

            const warpButton = document.createElement('button');
            warpButton.innerText = `Warp to ${planet.object.name}`;
            warpButton.style.display = 'block';
            warpButton.style.padding = '5px 10px';
            warpButton.style.backgroundColor = '#ff0000';
            warpButton.style.color = 'white';
            warpButton.style.border = 'none';
            warpButton.style.borderRadius = '5px';
            warpButton.style.zIndex = '1001';
            warpButton.onclick = () => this.warpToPlanet(planet.object.name);
            planetsContainer.appendChild(warpButton);
        });
    }

    updateMenu() {
        this.planets.forEach(planet => {
            const planetInfo = document.getElementById(`info-${planet.object.name}`);
            if (planetInfo) {
                planetInfo.innerHTML = `${planet.object.name} - Position: ${planet.mesh.position.x.toFixed(2)}, ${planet.mesh.position.y.toFixed(2)}, ${planet.mesh.position.z.toFixed(2)}`;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = 1 / 60;
        this.world.step(dt);
        this.planets.forEach(planet => planet.update(dt));
        this.updateMenu();
        this.fpsCamera.update(dt);

        this.renderer.clear();
        this.normalComposer.render(); 
        this.bloomComposer.render(); 
    }
}

function main() {
    new Main();
}

main();
