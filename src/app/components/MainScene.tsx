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
  const isInitializedRef = useRef<boolean>(false); // Use a ref to track initialization

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
    if (containerRef.current && !isInitializedRef.current) {
      try {
        console.log("Initializing MainSceneWithAdvancedCamera");
        
        // Mark as initialized to prevent double initialization
        isInitializedRef.current = true;
        
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
        isInitializedRef.current = false; // Reset if initialization fails
      }
    }

    return () => {
      if (sceneRef.current) {
        console.log("Disposing scene");
        sceneRef.current.dispose();
        sceneRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle time scale changes
  const handleSetTimeScale = (scale: number) => {
    setTimeScale(scale);
    if (sceneRef.current) {
      sceneRef.current.setTimeScale(scale);
    }
  };

  // Camera mode handling
  const handleSetCameraMode = (mode: CameraMode) => {
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(mode);
    }
  };

  // Planet interaction methods
  const handleWarpToPlanet = (planetName: string) => {
    if (sceneRef.current) {
      sceneRef.current.warpToPlanet(planetName);
    }
  };

  const handleFollowPlanet = (planetName: string) => {
    if (sceneRef.current) {
      sceneRef.current.followPlanet(planetName);
    }
  };

  // Autopilot control
  const handleStartAutopilot = () => {
    if (sceneRef.current) {
      sceneRef.current.startAutopilot();
    }
  };

  const handleCancelAutopilot = () => {
    if (sceneRef.current) {
      sceneRef.current.cancelAutopilot();
    }
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
  private animationFrameId: number | null = null; // To track the animation frame
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

    // Initialize immediately
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

      // Mark as initialized before starting animation loop
      this.isInitialized = true;
      
      // Start animation loop
      this.animate();

      // Handle window resize
      window.addEventListener("resize", this.onWindowResize);

      if (this.debug) console.log("Scene initialization complete");
    } catch (error) {
      console.error("Error in scene initialization:", error);
      this.isInitialized = false; // Ensure we don't try to animate if initialization failed
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
    
    // Create a perspective camera with appropriate parameters
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1e12
    );

    // Set initial camera position - Earth position + offset
    const initialPosition = new THREE.Vector3(0 + 1000000, 0, 0);
    this.camera.position.copy(initialPosition);

    if (this.debug) {
      const axisHelper = new THREE.AxesHelper(1000000);
      this.scene.add(axisHelper);
      console.log("Camera initialized:", this.camera.position);
    }

    // Ensure we have planets array populated before creating camera
    const planetObjects = this.planets ? this.planets.map(p => p.object) : [];

    // Initialize the advanced camera with the same position we set above
    this.advancedCamera = new AdvancedSpaceCamera(
      this.camera,
      planetObjects,
      initialPosition,
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
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
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
      this.planets = planetClasses.map((PlanetClass) => {
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
    // Verify initialization flag before proceeding
    if (!this.isInitialized) {
      if (this.debug) console.log("Animation loop aborted: not initialized");
      return;
    }

    // Request the next frame
    this.animationFrameId = requestAnimationFrame(this.animate);

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

      // Update advanced camera (always uses real delta time, not scaled)
      if (this.advancedCamera) {
        this.advancedCamera.update(deltaTime);
      }

      // Update autopilot and warp progress for UI
      if (this.advancedCamera && this.advancedCamera.isAutopilotActive()) {
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

      if (this.advancedCamera && this.advancedCamera.isWarpActive()) {
        this.callbacks.onWarpProgressUpdate(
          this.advancedCamera.getWarpProgress()
        );
      }

      // Update TWEEN animations
      TWEEN.update();

      // Render the scene
      this.render();
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
  };

  /**
   * Render the scene with post-processing
   */
  private render() {
    try {
      // Try using composers first
      this.renderer.clear();
      
      // Try the composer render, with fallback to basic render
      try {
        this.normalComposer.render();
        this.bloomComposer.render();
      } catch (error) {
        console.warn("Composer render failed, using basic render:", error);
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  }

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
    if (!this.advancedCamera) return;
    
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
    if (this.advancedCamera) {
      this.advancedCamera.warpToPlanet(planetName);
    }
  }

  /**
   * Follow a planet by name
   */
  public followPlanet(planetName: string) {
    if (!this.advancedCamera) return;
    
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
    if (!this.advancedCamera) return;
    
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
    if (!this.advancedCamera) return;
    
    this.advancedCamera.cancelAutopilot();

    // Clear trajectory visualization
    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.clearTrajectory();
    }
  }

  /**
   * Update the planets array in the advanced camera
   * Called after planets are loaded
   */
  public updateCameraPlanets() {
    if (this.advancedCamera && this.planets) {
      this.advancedCamera.setPlanets(this.planets.map(p => p.object));
    }
  }

  /**
   * Clean up resources
   */
  public dispose() {
    if (this.debug) console.log("Disposing scene resources");

    // Cancel animation frame if active
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize);

    // Clean up advanced camera
    if (this.advancedCamera) {
      this.advancedCamera.dispose();
    }

    // Clean up trajectory visualization
    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.dispose();
    }

    // Clean up renderer
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Set initialization flag to false
    this.isInitialized = false;
  }
}