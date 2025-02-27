"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

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

import AdvancedSpaceCamera, { CameraMode } from "./Camera/AdvancedSpaceCamera";
import CameraControlsUI from "./UI/CameraControlsUI";
import GameHUD from "./UI/GameHud";
import { Planet } from "./Interface/PlanetInterface";
import TrajectoryVisualization from "./Camera/TrajectoryVisualization";

import SolarSystemManager from "./Physics/SolarSystemManager";

const MainScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MainSceneWithAdvancedCamera | null>(null);
  const isInitializedRef = useRef<boolean>(false);
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
  const [currentDate, setCurrentDate] = useState<string>("");
  const [relativisticEffects, setRelativisticEffects] = useState(true);
  const [showOrbits, setShowOrbits] = useState(false);

  useEffect(() => {
    if (containerRef.current && !isInitializedRef.current) {
      try {
        console.log("Initializing MainSceneWithAdvancedCamera");

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
            onDateUpdate: setCurrentDate,
          }
        );

        console.log("MainSceneWithAdvancedCamera initialized successfully");
      } catch (error) {
        console.error("Error initializing scene:", error);
        isInitializedRef.current = false;
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
  }, []);

  const handleSetTimeScale = (scale: number) => {
    setTimeScale(scale);
    if (sceneRef.current) {
      sceneRef.current.setTimeScale(scale);
    }
  };

  const handleSetCameraMode = (mode: CameraMode) => {
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(mode);
    }
  };

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

  const handleSetRelativisticEffects = (enabled: boolean) => {
    setRelativisticEffects(enabled);
    if (sceneRef.current) {
      sceneRef.current.setRelativisticEffects(enabled);
    }
  };

  const handleSetShowOrbits = (show: boolean) => {
    setShowOrbits(show);
    if (sceneRef.current) {
      sceneRef.current.setShowOrbits(show);
    }
  };

  const handleSetDate = (date: Date) => {
    if (sceneRef.current) {
      sceneRef.current.setDate(date);
    }
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
        autopilotProgress={autopilotProgress}
        warpProgress={warpProgress}
        onStartAutopilot={handleStartAutopilot}
        onCancelAutopilot={handleCancelAutopilot}
        currentDate={currentDate}
        relativisticEffects={relativisticEffects}
        onToggleRelativisticEffects={handleSetRelativisticEffects}
        showOrbits={showOrbits}
        onToggleShowOrbits={handleSetShowOrbits}
        onSetDate={handleSetDate}
      />
    </div>
  );
};

export default MainScene;

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
  private animationFrameId: number | null = null;
  private debug: boolean = false;

    private solarSystemManager: SolarSystemManager | null = null;

    private useKeplerianOrbits: boolean = true;
  private useNBodyPhysics: boolean = false;
  private useRelativisticEffects: boolean = true;
  private showOrbits: boolean = false;

  private callbacks: {
    onPlanetSelect: (planet: Planet | null) => void;
    onPositionUpdate: (position: { x: number; y: number; z: number }) => void;
    onSpeedUpdate: (speed: number) => void;
    onPlanetsLoaded: (planets: Planet[]) => void;
    onModeChange: (mode: CameraMode) => void;
    onAutopilotProgressUpdate: (progress: number) => void;
    onWarpProgressUpdate: (progress: number) => void;
    onDateUpdate: (date: string) => void;
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
      onDateUpdate: (date: string) => void;
    }
  ) {
    this.container = container;
    this.callbacks = callbacks;

    if (this.debug)
      console.log("MainSceneWithAdvancedCamera constructor called");

    this.init();
  }

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

      this.callbacks.onPlanetsLoaded(this.planets.map((p) => p.object));

      this.lastFrameTime = performance.now();

      this.renderer.render(this.scene, this.camera);

      if (this.debug) console.log("First render completed");

      this.isInitialized = true;

      this.animate();

      window.addEventListener("resize", this.onWindowResize);

      if (this.debug) console.log("Scene initialization complete");
    } catch (error) {
      console.error("Error in scene initialization:", error);
      this.isInitialized = false;
    }
  }

  private setupScene() {
    if (this.debug) console.log("Setting up scene");
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

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
      console.log("Renderer initialized:", this.renderer);
      console.log(
        "Container dimensions:",
        this.container.clientWidth,
        this.container.clientHeight
      );
    }
  }

  private setupCamera() {
    if (this.debug) console.log("Setting up camera");

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      10,
      1e14
    );

    const initialPosition = new THREE.Vector3(1000000, 5000, 10000);
    this.camera.position.copy(initialPosition);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    if (this.debug) {
      console.log("Camera initialized:", this.camera.position);
    }

    this.updateCameraPlanets();

    this.advancedCamera = new AdvancedSpaceCamera(
      this.camera,
      this.planets.map((p) => p.object),
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

    if (this.debug) {
      console.log(
        "Advanced camera initialized with planets:",
        this.planets.length
      );
    }
  }

  private setupLights() {
    if (this.debug) console.log("Setting up enhanced lighting system");

    const sunLight = new THREE.PointLight(0xffffff, 1.5);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    const cameraLight = new THREE.DirectionalLight(0xffffff, 0.3);
    cameraLight.position.set(0, 1, 0);
    cameraLight.castShadow = false;
    this.camera.add(cameraLight);
    this.scene.add(this.camera);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
    this.scene.add(hemisphereLight);

    if (this.debug) console.log("Enhanced lighting system set up successfully");
  }

  private setupStars() {
    if (this.debug) console.log("Setting up stars");
    try {
      this.stars = new Stars(this.scene, this.renderer, this.camera);
      if (this.debug) console.log("Stars set up successfully");
    } catch (error) {
      console.error("Error setting up stars:", error);
    }
  }

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
            this.solarSystemManager = new SolarSystemManager(this.scene);

            this.solarSystemManager.setPhysicsModel(this.useNBodyPhysics);
      this.solarSystemManager.setRelativisticEffects(
        this.useRelativisticEffects
      );
      this.solarSystemManager.setShowOrbits(this.showOrbits);

            this.planets = planetClasses.map((PlanetClass) => {
        if (this.debug) console.log(`Creating planet: ${PlanetClass.name}`);

        const planet = new PlanetClass(this.renderer, this.scene, this.camera);

        if (typeof (planet as any).init === "function") {
          (planet as any).init();
        }

        if (PlanetClass === Sun) {
          planet.mesh.renderOrder = 1;
        } else {
          planet.mesh.renderOrder = 0;
        }

                this.solarSystemManager?.addPlanet(planet);

        if (this.debug)
          console.log(`Planet ${planet.name} created at`, planet.position);

        return {
          object: planet,
          update: planet.update.bind(planet),
          mesh: planet.mesh,
        };
      });

            this.updateDateDisplay();

      if (this.debug) console.log("Planets setup complete");
    } catch (error) {
      console.error("Error setting up planets:", error);
    }
  }

  private updateDateDisplay() {
        if (this.solarSystemManager) {
      const dateStr = this.solarSystemManager.getFormattedDate();
      this.callbacks.onDateUpdate(dateStr);

            setTimeout(() => this.updateDateDisplay(), 1000);
    }
  }

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

  private setupPostProcessing() {
    if (this.debug) console.log("Setting up post-processing");

    try {
      this.renderer.autoClear = true;

      this.normalComposer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.normalComposer.addPass(renderPass);

      this.bloomComposer = new EffectComposer(this.renderer);
      const bloomRenderPass = new RenderPass(this.scene, this.camera);
      this.bloomComposer.addPass(bloomRenderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.7,
        0.3,
        0.9
      );
      this.bloomComposer.addPass(bloomPass);

      this.camera.layers.enableAll();

      if (this.debug) console.log("Post-processing set up successfully");
    } catch (error) {
      console.error("Error setting up post-processing:", error);
      if (this.debug) console.log("Falling back to basic rendering");
    }
  }

  private animate = () => {
    if (!this.isInitialized) {
      if (this.debug) console.log("Animation loop aborted: not initialized");
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);

    try {
      const currentTime = performance.now();
      const deltaTime = Math.min(
        (currentTime - this.lastFrameTime) / 1000,
        0.1
      );
      this.lastFrameTime = currentTime;

      if (this.timeScale !== 0) {
                if (this.solarSystemManager) {
                    this.solarSystemManager.setTimeScale(this.timeScale);

                    this.solarSystemManager.update(currentTime);
        } else {
                    const scaledDelta = deltaTime * this.timeScale;
          this.planets.forEach((planet) => planet.update(scaledDelta));
        }
      }

      if (this.advancedCamera) {
        this.advancedCamera.update(deltaTime);
      }

      if (this.advancedCamera && this.advancedCamera.isAutopilotActive()) {
        this.callbacks.onAutopilotProgressUpdate(
          this.advancedCamera.getAutopilotProgress()
        );

        if (this.trajectoryVisualization) {
          this.trajectoryVisualization.updateProgress(
            this.advancedCamera.getAutopilotProgress()
          );
        }
      } else {
        this.callbacks.onAutopilotProgressUpdate(0);
      }

      if (this.advancedCamera && this.advancedCamera.isWarpActive()) {
        this.callbacks.onWarpProgressUpdate(
          this.advancedCamera.getWarpProgress()
        );
      } else {
        this.callbacks.onWarpProgressUpdate(0);
      }

      TWEEN.update();

      this.render();
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
        if (this.debug) {
      const earth = this.planets.find((p) => p.object.name === "Earth");
      if (earth) {
        console.log(
          `Earth position: ${earth.object.position.x}, ${earth.object.position.y}, ${earth.object.position.z}`
        );
        console.log(
          `Earth mesh position: ${earth.mesh.position.x}, ${earth.mesh.position.y}, ${earth.mesh.position.z}`
        );
                console.log(
          `Earth parent position: ${earth.mesh.parent?.position.x}, ${earth.mesh.parent?.position.y}, ${earth.mesh.parent?.position.z}`
        );
      }
    }
  };

  private render() {
    try {
      this.renderer.clear();

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

  public setTimeScale(scale: number) {
    this.timeScale = scale;

    if (this.solarSystemManager) {
      this.solarSystemManager.setTimeScale(scale);
    }
  }

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

  public warpToPlanet(planetName: string) {
    if (!this.advancedCamera) {
      console.warn("Cannot warp: Advanced camera not initialized");
      return;
    }

    try {
      console.log(`Attempting to warp to planet: ${planetName}`);

      const planet = this.planets.find(
        (p) => p.object.name.toLowerCase() === planetName.toLowerCase()
      );

      if (!planet) {
        console.warn(`Planet "${planetName}" not found`);
        return;
      }

      const planetPosition = planet.object.position;

      if (
        isNaN(planetPosition.x) ||
        isNaN(planetPosition.y) ||
        isNaN(planetPosition.z)
      ) {
        console.error(
          `Planet "${planetName}" has invalid coordinates. Attempting to fix...`
        );

        switch (planetName.toLowerCase()) {
          case "sun":
            planet.object.position.set(0, 0, 0);
            break;
          case "mercury":
            planet.object.position.set(57909050, 0, 0);
            break;
          case "venus":
            planet.object.position.set(108208930, 0, 0);
            break;
          case "earth":
            planet.object.position.set(149597890, 0, 0);
            break;
          case "mars":
            planet.object.position.set(227936640, 0, 0);
            break;
          case "jupiter":
            planet.object.position.set(778547200, 0, 0);
            break;
          case "saturn":
            planet.object.position.set(1433449370, 0, 0);
            break;
          case "uranus":
            planet.object.position.set(2870658186, 0, 0);
            break;
          case "neptune":
            planet.object.position.set(4498396441, 0, 0);
            break;
          case "pluto":
            planet.object.position.set(5906380624, 0, 0);
            break;
          default:
            console.error(
              `Cannot fix position for unknown planet: ${planetName}`
            );
            return;
        }

        console.log(
          `Restored default position for ${planetName}:`,
          planet.object.position
        );
      }

      this.advancedCamera.setTarget(planet.object);
      this.advancedCamera.startWarp();
    } catch (error) {
      console.error(`Error warping to planet ${planetName}:`, error);
    }
  }

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

  public startAutopilot() {
    if (!this.advancedCamera) {
      console.warn("Cannot start autopilot: Advanced camera not initialized");
      return;
    }

    const targetPlanet = this.advancedCamera.getTarget();
    if (!targetPlanet) {
      console.warn("Cannot start autopilot: No target planet selected");
      return;
    }

    try {
      console.log(
        `Starting autopilot to ${targetPlanet.name} at position:`,
        targetPlanet.position.x,
        targetPlanet.position.y,
        targetPlanet.position.z
      );

      if (this.trajectoryVisualization) {
        const startPosition = this.advancedCamera.position.clone();
        const startVelocity = this.advancedCamera.getVelocity();

        console.log(
          "Calculating trajectory path from",
          startPosition.x,
          startPosition.y,
          startPosition.z,
          "to",
          targetPlanet.position.x,
          targetPlanet.position.y,
          targetPlanet.position.z
        );

        if (
          isNaN(startPosition.x) ||
          isNaN(startPosition.y) ||
          isNaN(startPosition.z) ||
          isNaN(targetPlanet.position.x) ||
          isNaN(targetPlanet.position.y) ||
          isNaN(targetPlanet.position.z)
        ) {
          console.error(
            "Invalid coordinates detected for trajectory calculation"
          );

          if (
            isNaN(startPosition.x) ||
            isNaN(startPosition.y) ||
            isNaN(startPosition.z)
          ) {
            startPosition.set(0, 0, 1000000);
          }
        }

        this.trajectoryVisualization.showTrajectory(
          startPosition,
          targetPlanet.position.clone(),
          startVelocity,
          1000,
          this.planets.map((p) => p.object)
        );
      }

      this.advancedCamera.startAutopilot();
      console.log("Autopilot started successfully");
    } catch (error) {
      console.error("Error starting autopilot:", error);
    }
  }

  public cancelAutopilot() {
    if (!this.advancedCamera) return;

    this.advancedCamera.cancelAutopilot();
    this.callbacks.onAutopilotProgressUpdate(0);

    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.clearTrajectory();
    }
  }

  public updateCameraPlanets() {
    if (this.advancedCamera && this.planets) {
      this.advancedCamera.setPlanets(this.planets.map((p) => p.object));
    }
  }

    public setPhysicsModel(useNBodyPhysics: boolean): void {
    this.useNBodyPhysics = useNBodyPhysics;
    this.useKeplerianOrbits = !useNBodyPhysics;

    if (this.solarSystemManager) {
      this.solarSystemManager.setPhysicsModel(useNBodyPhysics);
    }
  }

  public setRelativisticEffects(enabled: boolean): void {
    this.useRelativisticEffects = enabled;

    if (this.solarSystemManager) {
      this.solarSystemManager.setRelativisticEffects(enabled);
    }
  }

  public setShowOrbits(show: boolean): void {
    this.showOrbits = show;

    if (this.solarSystemManager) {
      this.solarSystemManager.setShowOrbits(show);
    }
  }

    public setDate(date: Date): void {
    if (this.solarSystemManager) {
      this.solarSystemManager.setDate(date);
    }
  }

  public getCurrentDate(): string {
    if (this.solarSystemManager) {
      return this.solarSystemManager.getFormattedDate();
    }
    return new Date().toLocaleString();
  }

  public dispose() {
    if (this.debug) console.log("Disposing scene resources");

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener("resize", this.onWindowResize);

    if (this.advancedCamera) {
      this.advancedCamera.dispose();
    }

    if (this.trajectoryVisualization) {
      this.trajectoryVisualization.dispose();
    }

        if (this.solarSystemManager) {
      this.solarSystemManager.dispose();
      this.solarSystemManager = null;
    }

        if (this.stars && typeof (this.stars as any).dispose === "function") {
      (this.stars as any).dispose();
    }

        if (this.normalComposer) {
      if (this.normalComposer.renderTarget1)
        this.normalComposer.renderTarget1.dispose();
      if (this.normalComposer.renderTarget2)
        this.normalComposer.renderTarget2.dispose();
    }
    if (this.bloomComposer) {
      if (this.bloomComposer.renderTarget1)
        this.bloomComposer.renderTarget1.dispose();
      if (this.bloomComposer.renderTarget2)
        this.bloomComposer.renderTarget2.dispose();
    }

        this.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

        if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

        TWEEN.removeAll();

    this.isInitialized = false;
  }
}
