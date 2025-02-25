// src/app/components/MainScene.tsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Import planet classes
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

// Import camera and UI components
import AdvancedSpaceCamera, { CameraMode } from "./Camera/AdvancedSpaceCamera";
import CameraControlsUI from "./UI/CameraControlsUI";
import GameHUD from "./UI/GameHud";
import { Planet } from "./Interface/PlanetInterface";

const MainScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainInstanceRef = useRef<MainWithAdvancedCamera | null>(null);

  // State for UI components
  const [currentPlanet, setCurrentPlanet] = useState<Planet | null>(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [cameraSpeed, setCameraSpeed] = useState(0);
  const [timeScale, setTimeScale] = useState(1);
  const [cameraMode, setCameraMode] = useState<CameraMode>(
    CameraMode.FREE_FLIGHT
  );
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [autopilotProgress, setAutopilotProgress] = useState(0);
  const [warpProgress, setWarpProgress] = useState(0);

  // Setup main game instance
  useEffect(() => {
    if (containerRef.current) {
      mainInstanceRef.current = new MainWithAdvancedCamera(
        containerRef.current,
        {
          onPlanetSelect: setCurrentPlanet,
          onPositionUpdate: setCameraPosition,
          onSpeedUpdate: setCameraSpeed,
          onPlanetsLoaded: setPlanets,
          onModeChange: setCameraMode,
          onAutopilotProgressUpdate: setAutopilotProgress,
          onWarpProgressUpdate: setWarpProgress,
        }
      );
    }

    return () => {
      mainInstanceRef.current?.dispose();
    };
  }, []);

  // Handle time scale changes
  const handleSetTimeScale = (scale: number) => {
    setTimeScale(scale);
    mainInstanceRef.current?.setTimeScale(scale);
  };

  // Handle camera mode changes
  const handleSetCameraMode = (mode: CameraMode) => {
    mainInstanceRef.current?.setCameraMode(mode);
  };

  // Handle warp to planet
  const handleWarpToPlanet = (planetName: string) => {
    mainInstanceRef.current?.warpToPlanet(planetName);
  };

  // Handle follow planet
  const handleFollowPlanet = (planetName: string) => {
    mainInstanceRef.current?.followPlanet(planetName);
  };

  // Handle start autopilot
  const handleStartAutopilot = () => {
    mainInstanceRef.current?.startAutopilot();
  };

  // Handle cancel autopilot
  const handleCancelAutopilot = () => {
    mainInstanceRef.current?.cancelAutopilot();
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0" />

      <GameHUD
        currentPlanet={currentPlanet}
        cameraPosition={cameraPosition}
        cameraVelocity={{ x: 0, y: 0, z: cameraSpeed }}
        timeScale={timeScale}
        onSetTimeScale={handleSetTimeScale}
        onToggleCameraMode={handleSetCameraMode}
        onWarpToPlanet={handleWarpToPlanet}
        onFollowPlanet={handleFollowPlanet}
        planets={planets}
        cameraMode={
          cameraMode === CameraMode.ORBIT
            ? "orbit"
            : cameraMode === CameraMode.FOLLOW
            ? "follow"
            : "fps"
        }
      />

      <CameraControlsUI
        cameraMode={cameraMode}
        currentTarget={currentPlanet}
        position={cameraPosition}
        speed={cameraSpeed}
        autopilotProgress={autopilotProgress}
        warpProgress={warpProgress}
        onSetCameraMode={handleSetCameraMode}
        onWarpToPlanet={handleWarpToPlanet}
        onFollowPlanet={handleFollowPlanet}
        onStartAutopilot={handleStartAutopilot}
        onCancelAutopilot={handleCancelAutopilot}
        planets={planets}
      />
    </div>
  );
};

export default MainScene;

class MainWithAdvancedCamera {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private advancedCamera!: AdvancedSpaceCamera;
  private scene!: THREE.Scene;
  private stars!: Stars;
  private planets: {
    object: Planet;
    update: (dt: number) => void;
    mesh: THREE.Mesh | THREE.Group;
  }[] = [];
  private normalComposer!: EffectComposer;
  private bloomComposer!: EffectComposer;
  private container: HTMLDivElement;
  private timeScale: number = 1;
  private lastFrameTime: number = 0;

  // Callbacks for UI updates
  private callbacks: {
    onPlanetSelect: (planet: Planet | null) => void;
    onPositionUpdate: (position: { x: number; y: number; z: number }) => void;
    onSpeedUpdate: (speed: number) => void;
    onPlanetsLoaded: (planets: Planet[]) => void;
    onModeChange: (mode: CameraMode) => void;
    onAutopilotProgressUpdate: (progress: number) => void;
    onWarpProgressUpdate: (progress: number) => void;
  };

  constructor(
    container: HTMLDivElement,
    callbacks: {
      onPlanetSelect: (planet: Planet | null) => void;
      onPositionUpdate: (position: { x: number; y: number; z: number }) => void;
      onSpeedUpdate: (speed: number) => void;
      onPlanetsLoaded: (planets: Planet[]) => void;
      onModeChange: (mode: CameraMode) => void;
      onAutopilotProgressUpdate: (progress: number) => void;
      onWarpProgressUpdate: (progress: number) => void;
    }
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  /**
   * Initialize the scene, camera, planets, and rendering pipeline
   */
  init() {
    this.setupScene();
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupPlanets();
    this.setupStars();
    this.setupPostProcessing();

    // Send initial planets data to React state
    this.callbacks.onPlanetsLoaded(this.planets.map((p) => p.object));

    // Start animation loop
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Set up the three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Set up the WebGL renderer
   */
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

  /**
   * Set up the camera and advanced camera controller
   */
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1e12
    );

    // Initialize the advanced camera system
    this.advancedCamera = new AdvancedSpaceCamera(
      this.camera,
      [], // Will be populated after planets are created
      new THREE.Vector3(1.5e8, 5e7, 5e7), // Starting position
      {
        onModeChange: (mode) => this.callbacks.onModeChange(mode),
        onTargetChange: (target) => this.callbacks.onPlanetSelect(target),
        onPositionChange: (position) =>
          this.callbacks.onPositionUpdate({
            x: position.x,
            y: position.y,
            z: position.z,
          }),
        onSpeedChange: (speed) => this.callbacks.onSpeedUpdate(speed),
      }
    );
  }

  /**
   * Set up scene lighting
   */
  setupLights() {
    const directionalLight = new THREE.PointLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 0);
    this.scene.add(directionalLight);

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
  }

  /**
   * Create star background
   */
  setupStars() {
    this.stars = new Stars(this.scene, this.renderer, this.camera);
  }

  /**
   * Set up planets and moons
   */
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
      const planet = new PlanetClass(this.renderer, this.scene, this.camera);

      // Set render order (Sun on top of other planets)
      if (PlanetClass === Sun) {
        planet.mesh.renderOrder = 1;
      } else {
        planet.mesh.renderOrder = 0;
      }

      // Add to scene
      this.scene.add(planet.mesh);

      // Return planet data
      return {
        object: planet,
        update: planet.update.bind(planet),
        mesh: planet.mesh,
      };
    });

    // Update the advanced camera with the created planets
    this.advancedCamera.setPlanets(this.planets.map((p) => p.object));
  }

  /**
   * Set up post-processing effects
   */
  setupPostProcessing() {
    // Normal render pass
    this.normalComposer = new EffectComposer(this.renderer);
    const normalRenderPass = new RenderPass(this.scene, this.camera);
    normalRenderPass.clear = true;
    this.normalComposer.addPass(normalRenderPass);

    // Bloom pass for sun and bright objects
    this.bloomComposer = new EffectComposer(this.renderer);
    const bloomRenderPass = new RenderPass(this.scene, this.camera);
    bloomRenderPass.clear = true;
    this.bloomComposer.addPass(bloomRenderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0, // Bloom strength
      0.4, // Bloom radius
      0.85 // Bloom threshold
    );
    this.bloomComposer.addPass(bloomPass);

    // Enable all layers for camera
    this.camera.layers.enableAll();
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // Cap to 100ms
    this.lastFrameTime = currentTime;

    // Skip updates if paused
    if (this.timeScale !== 0) {
      // Calculate scaled delta for planet movements
      const scaledDelta = deltaTime * this.timeScale;

      // Update planets
      this.planets.forEach((planet) => planet.update(scaledDelta));
    }

    // Update camera (always uses real delta time, not scaled)
    this.advancedCamera.update(deltaTime);

    // Update autopilot and warp progress for UI
    if (this.advancedCamera.isAutopilotActive()) {
      this.callbacks.onAutopilotProgressUpdate(
        this.advancedCamera.getAutopilotProgress()
      );
    }

    if (this.advancedCamera.isWarpActive()) {
      this.callbacks.onWarpProgressUpdate(
        this.advancedCamera.getWarpProgress()
      );
    }

    // Update TWEEN animations
    TWEEN.update();

    // Render scene
    this.renderer.clear();
    this.normalComposer.render();
    this.bloomComposer.render();
  }

  /**
   * Set the simulation time scale
   */
  setTimeScale(scale: number) {
    this.timeScale = scale;
  }

  /**
   * Set camera mode
   */
  setCameraMode(mode: CameraMode) {
    switch (mode) {
      case CameraMode.FREE_FLIGHT:
        this.advancedCamera.cancelAllAutomatedMovement();
        break;
      case CameraMode.ORBIT:
        this.advancedCamera.startOrbit();
        break;
      case CameraMode.FOLLOW:
        this.advancedCamera.startFollow();
        break;
    }
  }

  /**
   * Warp to a planet by name
   */
  warpToPlanet(planetName: string) {
    this.advancedCamera.warpToPlanet(planetName);
  }

  /**
   * Follow a planet by name
   */
  followPlanet(planetName: string) {
    const planet = this.planets.find((p) => p.object.name === planetName);
    if (planet) {
      this.advancedCamera.setTarget(planet.object);
      this.advancedCamera.startFollow();
    }
  }

  /**
   * Start autopilot to current target
   */
  startAutopilot() {
    this.advancedCamera.startAutopilot();
  }

  /**
   * Cancel autopilot
   */
  cancelAutopilot() {
    this.advancedCamera.cancelAutopilot();
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (this.normalComposer && this.bloomComposer) {
      this.normalComposer.setSize(window.innerWidth, window.innerHeight);
      this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    // Clean up advanced camera
    this.advancedCamera.dispose();

    // Clean up renderer
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
