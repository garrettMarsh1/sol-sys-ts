// src/app/components/MainScene.tsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import FirstPersonCamera from "./Camera/FirstPersonCamera";
import Sun from "./planets/Sun";
import Mercury from "./planets/Mercury";
import Venus from "./planets/Venus";
import Earth from "./planets/Earth";
import Mars from "./planets/Mars";
import Jupiter from "./planets/Jupiter";
import Saturn from "./planets/Saturn";
import Uranus from "./planets/Uranus";
import Neptune from "./planets/Neptune";
import Pluto from "./planets/Pluto";
import Stars from "./stars/stars";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useEffect, useRef, useState } from "react";
import { Planet } from "./Interface/PlanetInterface";

// Import UI components
import GameHUD from "./UI/GameHUD";

const BLOOM_LAYER = 1;

const MainScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainInstance = useRef<Main | null>(null);

  // State for UI components
  const [currentPlanet, setCurrentPlanet] = useState<Planet | null>(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [cameraVelocity, setCameraVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [timeScale, setTimeScale] = useState(1);
  const [cameraMode, setCameraMode] = useState<"fps" | "follow" | "orbit">(
    "fps"
  );
  const [planets, setPlanets] = useState<Planet[]>([]);

  // Setup main game instance
  useEffect(() => {
    if (containerRef.current) {
      mainInstance.current = new Main(
        containerRef.current,
        setCurrentPlanet,
        setCameraPosition,
        setCameraVelocity,
        setPlanets
      );
    }

    return () => {
      mainInstance.current?.dispose();
    };
  }, []);

  // Handle time scale changes
  const handleSetTimeScale = (scale: number) => {
    setTimeScale(scale);
    mainInstance.current?.setTimeScale(scale);
  };

  // Handle camera mode changes
  const handleToggleCameraMode = (mode: "fps" | "follow" | "orbit") => {
    setCameraMode(mode);
    mainInstance.current?.setCameraMode(mode);
  };

  // Handle warp to planet
  const handleWarpToPlanet = (planetName: string) => {
    mainInstance.current?.warpToPlanet(planetName);
  };

  // Handle follow planet
  const handleFollowPlanet = (planetName: string) => {
    mainInstance.current?.followPlanet(planetName);
    setCameraMode("follow");
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0" />

      <GameHUD
        currentPlanet={currentPlanet}
        cameraPosition={cameraPosition}
        cameraVelocity={cameraVelocity}
        timeScale={timeScale}
        onSetTimeScale={handleSetTimeScale}
        onToggleCameraMode={handleToggleCameraMode}
        onWarpToPlanet={handleWarpToPlanet}
        onFollowPlanet={handleFollowPlanet}
        planets={planets}
        cameraMode={cameraMode}
      />
    </div>
  );
};

export default MainScene;

class Main {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private fpsCamera!: FirstPersonCamera;
  private scene!: THREE.Scene;
  private stars!: Stars;
  private planets: {
    object: Planet;
    update: (dt: number) => void;
    mesh: THREE.Mesh | THREE.Group;
  }[] = [];
  private normalComposer!: EffectComposer;
  private bloomComposer!: EffectComposer;
  private objects_: THREE.Object3D[] = [];
  private container: HTMLDivElement;
  private followPlanet: boolean = false;
  private targetPlanet?: Planet;
  private followOffset!: THREE.Vector3;
  private timeScale: number = 1;
  private cameraMode: "fps" | "follow" | "orbit" = "fps";
  private lastFrameTime: number = 0;

  // State update callbacks
  private setCurrentPlanet: (planet: Planet | null) => void;
  private setCameraPosition: (position: {
    x: number;
    y: number;
    z: number;
  }) => void;
  private setCameraVelocity: (velocity: {
    x: number;
    y: number;
    z: number;
  }) => void;
  private setPlanets: (planets: Planet[]) => void;

  constructor(
    container: HTMLDivElement,
    setCurrentPlanet: (planet: Planet | null) => void,
    setCameraPosition: (position: { x: number; y: number; z: number }) => void,
    setCameraVelocity: (velocity: { x: number; y: number; z: number }) => void,
    setPlanets: (planets: Planet[]) => void
  ) {
    this.container = container;
    this.setCurrentPlanet = setCurrentPlanet;
    this.setCameraPosition = setCameraPosition;
    this.setCameraVelocity = setCameraVelocity;
    this.setPlanets = setPlanets;
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

    // Send initial planets data to React state
    this.setPlanets(this.planets.map((p) => p.object));

    // Start animation loop
    this.lastFrameTime = performance.now();
    this.animate();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener("click", (event) => {
      this.onMouseClick(event);
    });

    window.addEventListener("resize", () => {
      this.fpsCamera.camera.aspect = window.innerWidth / window.innerHeight;
      this.fpsCamera.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add keyboard listener for ESC to exit follow/target mode
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.followPlanet = false;
        this.fpsCamera.setFollowing(false);
        this.targetPlanet = undefined;
        this.setCurrentPlanet(null);
      }
    });
  }

  onMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.fpsCamera.camera);
    const intersects = raycaster.intersectObjects(
      this.planets.map((p) => p.mesh)
    );

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const planet = this.planets.find(
        (p) =>
          p.mesh === intersectedObject ||
          (p.mesh instanceof THREE.Group &&
            p.mesh.children.includes(intersectedObject))
      );

      if (planet) {
        this.followPlanet = false;
        this.fpsCamera.setFollowing(false);
        this.targetPlanet = planet.object;
        this.followOffset = new THREE.Vector3(
          0,
          planet.object.diameter * 5,
          planet.object.diameter * 5
        );

        // Update UI state
        this.setCurrentPlanet(planet.object);
      }
    }
  }

  warpToPlanet(planetName: string) {
    console.log(`Attempting to warp to: ${planetName}`);
    const planet = this.planets.find((p) => p.object.name === planetName);
    if (planet) {
      console.log(`Found planet: ${planet.object.name}`);

      // Set as current target
      this.targetPlanet = planet.object;
      this.setCurrentPlanet(planet.object);

      // Calculate positions (using diameter or radius, whichever is available)
      const planetDiameter =
        planet.object.diameter ||
        (planet.object.radius ? planet.object.radius * 2 : 10000);
      const planetPosition = planet.mesh.position.clone();
      const offset = new THREE.Vector3(
        0,
        planetDiameter * 0.5,
        planetDiameter * 3
      );
      const targetPosition = planetPosition.clone().add(offset);

      console.log(
        `Planet position: ${planetPosition.x}, ${planetPosition.y}, ${planetPosition.z}`
      );
      console.log(
        `Target position: ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`
      );

      // Stop following during warp
      this.followPlanet = false;
      this.fpsCamera.setFollowing(false);

      // Tween to new position with a dramatic curve
      new TWEEN.Tween(this.fpsCamera.translation_)
        .to(
          { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z },
          2000
        )
        .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(() => {
          // Keep camera looking at planet during tween
          this.fpsCamera.camera.lookAt(planetPosition);
        })
        .onComplete(() => {
          console.log(`Warp complete to: ${planet.object.name}`);

          // Only start following if in follow mode
          if (this.cameraMode === "follow") {
            this.followPlanet = true;
            this.fpsCamera.setFollowing(true);
            this.fpsCamera.setTarget(planet.mesh);
          }
        })
        .start();
    } else {
      console.warn(`Planet not found: ${planetName}`);
    }
  }

  followPlanet(planetName: string) {
    console.log(`Attempting to follow: ${planetName}`);
    const planet = this.planets.find((p) => p.object.name === planetName);
    if (planet) {
      console.log(`Setting up follow mode for: ${planet.object.name}`);

      // Set planet as target
      this.targetPlanet = planet.object;

      // Enable following
      this.followPlanet = true;
      this.fpsCamera.setFollowing(true);
      this.fpsCamera.setTarget(planet.mesh);

      // Make sure we're in follow mode
      this.cameraMode = "follow";

      // Calculate a good following distance based on planet size
      const planetDiameter =
        planet.object.diameter ||
        (planet.object.radius ? planet.object.radius * 2 : 10000);
      this.followOffset = new THREE.Vector3(
        0,
        planetDiameter * 0.3,
        planetDiameter * 2
      );

      // Update UI state
      this.setCurrentPlanet(planet.object);

      console.log(`Now following: ${planet.object.name}`);
    } else {
      console.warn(`Planet not found for follow: ${planetName}`);
    }
  }

  setTimeScale(scale: number) {
    this.timeScale = scale;
  }

  setCameraMode(mode: "fps" | "follow" | "orbit") {
    this.cameraMode = mode;

    if (mode === "follow" && this.targetPlanet) {
      const planet = this.planets.find(
        (p) => p.object.name === this.targetPlanet!.name
      );
      if (planet) {
        this.followPlanet = true;
        this.fpsCamera.setFollowing(true);
        this.fpsCamera.setTarget(planet.mesh);
      }
    } else {
      this.followPlanet = false;
      this.fpsCamera.setFollowing(false);
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      precision: "highp",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      105,
      window.innerWidth / window.innerHeight,
      1,
      1e10
    );
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

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0,
      0.4,
      0.85
    );
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
    const planetClasses = [
      Sun,
      Mercury,
      Venus,
      Earth,
      Mars,
      Jupiter,
      Saturn,
      Uranus,
      Neptune,
      Pluto,
    ];
    this.planets = planetClasses.map((PlanetClass) => {
      const planet = new PlanetClass(
        this.renderer,
        this.scene,
        this.fpsCamera.camera
      );
      if (PlanetClass === Sun) {
        planet.mesh.renderOrder = 1; // Render the Sun on top of other meshes
      } else {
        planet.mesh.renderOrder = 0; // Default render order for other planets
      }
      this.scene.add(planet.mesh);
      return {
        object: planet,
        update: planet.update.bind(planet),
        mesh: planet.mesh,
      };
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Calculate delta time
    const currentTime = performance.now();
    const dt = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Apply time scale
    const scaledDt = dt * this.timeScale;

    // Skip updates if paused
    if (this.timeScale !== 0) {
      // Update planets
      this.planets.forEach((planet) => planet.update(scaledDt));
    }

    // Camera updates don't depend on time scale
    this.fpsCamera.update(dt);

    // Handle planet following
    if (this.followPlanet && this.targetPlanet) {
      const planet = this.planets.find(
        (p) => p.object.name === this.targetPlanet!.name
      );
      if (planet) {
        const planetPosition = planet.mesh.position.clone();
        if (this.cameraMode === "follow") {
          // Follow mode already handled by FirstPersonCamera
        } else if (this.cameraMode === "orbit") {
          // Orbit mode - circle around the planet
          const orbitRadius = planet.object.diameter * 5;
          const orbitSpeed = 0.1;
          const angle = currentTime * 0.0005;

          const x = planetPosition.x + Math.cos(angle) * orbitRadius;
          const z = planetPosition.z + Math.sin(angle) * orbitRadius;
          const y = planetPosition.y + orbitRadius * 0.5;

          this.fpsCamera.translation_.set(x, y, z);
          this.fpsCamera.camera.lookAt(planetPosition);
        }
      }
    }

    // Update UI state with camera data
    this.setCameraPosition({
      x: this.fpsCamera.translation_.x,
      y: this.fpsCamera.translation_.y,
      z: this.fpsCamera.translation_.z,
    });

    // Use a simplified velocity for UI
    this.setCameraVelocity({
      x: Math.random() * 0.1, // Replace with actual velocity when available
      y: Math.random() * 0.1,
      z: Math.random() * 0.1,
    });

    TWEEN.update();
    this.renderer.clear();
    this.normalComposer.render();
    this.bloomComposer.render();
  }

  dispose() {
    // Cleanup if needed
    window.removeEventListener("resize", () => {});
    this.renderer.domElement.removeEventListener("click", () => {});
    document.removeEventListener("keydown", () => {});
  }
}
