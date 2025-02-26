"use client"; // This marks the component as client-side only

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
import TrajectoryVisualization from "./Camera/TrajectoryVisualization";

const MainScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MainSceneWithAdvancedCamera | null>(null);

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

  // Setup main scene with advanced camera
  useEffect(() => {
    if (containerRef.current) {
      try {
        // Add debugging console log
        console.log("Initializing MainSceneWithAdvancedCamera");

        sceneRef.current = new MainSceneWithAdvancedCamera(
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

        console.log("MainSceneWithAdvancedCamera initialized successfully");
      } catch (error) {
        console.error("Error initializing scene:", error);
      }
    }

    return () => {
      if (sceneRef.current) {
        console.log("Disposing scene");
        sceneRef.current.dispose();
      }
    };
  }, []);

  // Handle time scale changes
  const handleSetTimeScale = (scale: number) => {
    setTimeScale(scale);
    sceneRef.current?.setTimeScale(scale);
  };

  // Camera mode handling
  const handleSetCameraMode = (mode: CameraMode) => {
    sceneRef.current?.setCameraMode(mode);
  };

  // Planet interaction methods
  const handleWarpToPlanet = (planetName: string) => {
    sceneRef.current?.warpToPlanet(planetName);
  };

  const handleFollowPlanet = (planetName: string) => {
    sceneRef.current?.followPlanet(planetName);
  };

  // Autopilot control
  const handleStartAutopilot = () => {
    sceneRef.current?.startAutopilot();
  };

  const handleCancelAutopilot = () => {
    sceneRef.current?.cancelAutopilot();
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Game HUD */}
      <GameHUD
        currentPlanet={currentPlanet}
        cameraPosition={cameraPosition}
        cameraVelocity={{ x: 0, y: 0, z: cameraSpeed }}
        timeScale={timeScale}
        onSetTimeScale={handleSetTimeScale}
        onToggleCameraMode={(mode) => {
          handleSetCameraMode(
            mode === "orbit"
              ? CameraMode.ORBIT
              : mode === "follow"
              ? CameraMode.FOLLOW
              : CameraMode.FREE_FLIGHT
          );
        }}
        onWarpToPlanet={handleWarpToPlanet}
        onFollowPlanet={handleFollowPlanet}
        planets={planets}
        rawPlanets={planets}
        cameraMode={
          cameraMode === CameraMode.ORBIT
            ? "orbit"
            : cameraMode === CameraMode.FOLLOW
            ? "follow"
            : "fps"
        }
      />

      {/* Camera Controls UI */}
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

/**
 * Main scene controller with AdvancedSpaceCamera integration
 */
class MainSceneWithAdvancedCamera {
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
  private isInitialized: boolean = false;
  private trajectoryVisualization: TrajectoryVisualization | null = null;
  // Debug flag
  private debug: boolean = true;

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

    // Debug log
    if (this.debug)
      console.log("MainSceneWithAdvancedCamera constructor called");

    this.init();
  }

  /**
   * Initialize the scene, camera, planets, and rendering pipeline
   */
  private init() {
    try {
      if (this.debug) console.log("Starting scene initialization");

      this.setupScene();
      this.setupRenderer();
      this.setupCamera();
      this.setupLights();
      this.setupPlanets();
      this.setupStars();
      this.setupPostProcessing();
      this.setupTrajectoryVisualization();

      // Send initial planets data to React state
      this.callbacks.onPlanetsLoaded(this.planets.map((p) => p.object));

      // Start animation loop
      this.lastFrameTime = performance.now();

      // Add a simple test render to ensure renderer is working
      this.renderer.render(this.scene, this.camera);

      if (this.debug) console.log("First render completed");

      // Start animation loop
      this.animate();
      this.isInitialized = true;

      // Handle window resize
      window.addEventListener("resize", this.onWindowResize);

      if (this.debug) console.log("Scene initialization complete");
    } catch (error) {
      console.error("Error in scene initialization:", error);
    }
  }

  /**
   * Set up the three.js scene
   */
  private setupScene() {
    if (this.debug) console.log("Setting up scene");
    this.scene = new THREE.Scene();
    // Add background color to help with debugging
    this.scene.background = new THREE.Color(0x020924);
  }

  /**
   * Set up the WebGL renderer
   */
  private setupRenderer() {
    if (this.debug) console.log("Setting up renderer");
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      precision: "highp",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    if (this.debug) {
      // Check if renderer is correctly created
      console.log("Renderer initialized:", this.renderer);
      console.log(
        "Container dimensions:",
        this.container.clientWidth,
        this.container.clientHeight
      );
    }
  }

  /**
   * Set up the camera and advanced camera controller
   */
  private setupCamera() {
    if (this.debug) console.log("Setting up camera");
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1e12
    );

    // Set initial camera position
    this.camera.position.set(147099221.74991804 + 10000, 0, 0);

    // Add an axis helper to visualize orientation (for debugging)
    if (this.debug) {
      const axisHelper = new THREE.AxesHelper(1000000);
      this.scene.add(axisHelper);
      console.log("Camera initialized:", this.camera.position);
    }

    // Initialize the advanced camera system with initial position
    this.advancedCamera = new AdvancedSpaceCamera(
      this.camera,
      [], // Will be populated after planets are created
      new THREE.Vector3(147099221.74991804 + 10000, 0, 0), // Starting position
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

    if (this.debug) console.log("Advanced camera initialized");
  }

  /**
   * Set up scene lighting
   */
  private setupLights() {
    if (this.debug) console.log("Setting up lights");

    // Sun light at origin
    const directionalLight = new THREE.PointLight(0xffffff, 1.0);
    directionalLight.position.set(0, 0, 0);
    this.scene.add(directionalLight);

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Increased brightness for debugging
    this.scene.add(ambientLight);

    if (this.debug) console.log("Lights set up successfully");
  }

  /**
   * Create star background
   */
  private setupStars() {
    if (this.debug) console.log("Setting up stars");
    try {
      this.stars = new Stars(this.scene, this.renderer, this.camera);
      if (this.debug) console.log("Stars set up successfully");
    } catch (error) {
      console.error("Error setting up stars:", error);
    }
  }

  /**
   * Set up planets and moons
   */
  private setupPlanets() {
    if (this.debug) console.log("Setting up planets");

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

    try {
      this.planets = planetClasses.map((PlanetClass, index) => {
        if (this.debug) console.log(`Creating planet: ${PlanetClass.name}`);

        const planet = new PlanetClass(this.renderer, this.scene, this.camera);

        // Initialize planet if it has an init method
        if (typeof (planet as any).init === "function") {
          (planet as any).init();
        }

        // Set render order (Sun on top of other planets)
        if (PlanetClass === Sun) {
          planet.mesh.renderOrder = 1;
        } else {
          planet.mesh.renderOrder = 0;
        }

        // Add to scene
        this.scene.add(planet.mesh);

        if (this.debug)
          console.log(`Planet ${planet.name} created at`, planet.position);

        return {
          object: planet,
          update: planet.update.bind(planet),
          mesh: planet.mesh,
        };
      });

      // Update the advanced camera with the created planets
      this.advancedCamera.setPlanets(this.planets.map((p) => p.object));

      if (this.debug) console.log("Planets setup complete");
    } catch (error) {
      console.error("Error setting up planets:", error);
    }
  }

  /**
   * Set up trajectory visualization
   */
  private setupTrajectoryVisualization() {
    if (this.debug) console.log("Setting up trajectory visualization");

    try {
      this.trajectoryVisualization = new TrajectoryVisualization(this.scene);
      if (this.debug)
        console.log("Trajectory visualization set up successfully");
    } catch (error) {
      console.error("Error setting up trajectory visualization:", error);
    }
  }

  /**
   * Set up post-processing effects
   */
  private setupPostProcessing() {
    if (this.debug) console.log("Setting up post-processing");

    try {
      // Basic render pass (fallback if composers fail)
      this.renderer.autoClear = true;

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

      if (this.debug) console.log("Post-processing set up successfully");
    } catch (error) {
      console.error("Error setting up post-processing:", error);
    }
  }

  /**
   * Main animation loop
   */
  private animate = () => {
    if (!this.isInitialized) {
      if (this.debug) console.log("Animation loop aborted: not initialized");
      return;
    }

    requestAnimationFrame(this.animate);

    try {
      // Calculate delta time
      const currentTime = performance.now();
      const deltaTime = Math.min(
        (currentTime - this.lastFrameTime) / 1000,
        0.1
      ); // Cap to 100ms
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

        // Update trajectory visualization if available
        if (this.trajectoryVisualization) {
          this.trajectoryVisualization.updateProgress(
            this.advancedCamera.getAutopilotProgress()
          );
        }
      }

      if (this.advancedCamera.isWarpActive()) {
        this.callbacks.onWarpProgressUpdate(
          this.advancedCamera.getWarpProgress()
        );
      }

      // Update TWEEN animations
      TWEEN.update();

      // Try a simple direct render first (fallback)
      this.renderer.render(this.scene, this.camera);

      // Then try the composer render
      try {
        this.renderer.clear();
        this.normalComposer.render();
        this.bloomComposer.render();
      } catch (error) {
        console.error(
          "Error in composer render, falling back to basic render:",
          error
        );
        // Already did the basic render above
      }
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
  };

  /**
   * Handle window resize
   */
  private onWindowResize = () => {
    if (this.debug) console.log("Window resize detected");

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
  };

  /**
   * Set the simulation time scale
   */
  public setTimeScale(scale: number) {
    this.timeScale = scale;
  }

  /**
   * Set camera mode
   */
  public setCameraMode(mode: CameraMode) {
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
  public warpToPlanet(planetName: string) {
    this.advancedCamera.warpToPlanet(planetName);
  }

  /**
   * Follow a planet by name
   */
  public followPlanet(planetName: string) {
    const planet = this.planets.find(
      (p) => p.object.name.toLowerCase() === planetName.toLowerCase()
    );
    if (planet) {
      this.advancedCamera.setTarget(planet.object);
      this.advancedCamera.startFollow();
    }
  }

  /**
   * Start autopilot to current target
   */
  public startAutopilot() {
    // Show trajectory visualization before starting autopilot
    if (this.trajectoryVisualization && this.advancedCamera.getTarget()) {
      const targetPlanet = this.advancedCamera.getTarget()!;
      const startPosition = this.advancedCamera.position.clone();
      const startVelocity = this.advancedCamera.getVelocity();

      this.trajectoryVisualization.showTrajectory(
        startPosition,
        targetPlanet.position.clone(),
        startVelocity,
        1000, // Ship mass
        this.planets.map((p) => p.object)
      );
    }

    this.advancedCamera.startAutopilot();
  }

  /**
   * Cancel autopilot
   */
  public cancelAutopilot() {
    this.advancedCamera.cancelAutopilot();

    // Clear trajectory visualization
    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.clearTrajectory();
    }
  }

  /**
   * Clean up resources
   */
  public dispose() {
    if (this.debug) console.log("Disposing scene resources");

    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize);

    // Clean up advanced camera
    this.advancedCamera.dispose();

    // Clean up trajectory visualization
    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.dispose();
    }

    // Clean up renderer
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
