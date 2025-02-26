// src/app/components/Camera/AdvancedSpaceCamera.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import * as TWEEN from "@tweenjs/tween.js";

// Physics constants
const G = 6.6743e-11; // Universal gravitational constant (m^3 kg^-1 s^-2)
const TIME_SCALE_FACTOR = 1000; // Default time acceleration for realistic travel

export enum CameraMode {
  FREE_FLIGHT = "free_flight",
  AUTOPILOT = "autopilot",
  ORBIT = "orbit",
  FOLLOW = "follow",
  WARPING = "warping",
}

// Keys configuration for controls
export const KEYS = {
  FORWARD: "w",
  BACKWARD: "s",
  LEFT: "a",
  RIGHT: "d",
  UP: "q",
  DOWN: "e",
  ROLL_LEFT: "z",
  ROLL_RIGHT: "c",
  BOOST: "shift",
  BRAKE: "space",
  AUTOPILOT: "f",
  WARP: "r",
  ESC: "escape",
};

interface AutopilotData {
  target: Planet | null;
  active: boolean;
  arrivalDistance: number;
  initialDistance: number;
  startTime: number;
  flightPath: THREE.Vector3[];
  currentPathIndex: number;
  targetVelocity: THREE.Vector3;
  completed: boolean;
}

interface CameraSettings {
  movementSpeed: number;
  rotationSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  dampingFactor: number;
  boostMultiplier: number;
  zoomSensitivity: number;
  minDistance: number;
  maxDistance: number;
  inertia: boolean;
}

/**
 * Advanced space camera system with physics-based movement, autopilot, and warp capabilities
 */
export default class AdvancedSpaceCamera {
  // Core components
  public camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private planets: Planet[];

  // Position and movement
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private acceleration: THREE.Vector3;
  private rotation: THREE.Euler;
  private quaternion: THREE.Quaternion;

  // Flight dynamics
  private speed: number;
  private targetSpeed: number;
  private direction: THREE.Vector3;
  private settings: CameraSettings;
  private mass: number;

  // Control state
  private mode: CameraMode;
  private previousMode: CameraMode | null;
  private keys: { [key: string]: boolean };
  private mouseDown: boolean;
  private lastMouseX: number;
  private lastMouseY: number;
  private enableMouseLook: boolean;

  // Target and autopilot
  private currentTarget: Planet | null;
  private autopilot: AutopilotData;
  private warpActive: boolean;
  private warpProgress: number;
  private warpTween: TWEEN.Tween<any> | null;

  // UI callbacks
  private onModeChange: (mode: CameraMode) => void;
  private onTargetChange: (target: Planet | null) => void;
  private onPositionChange: (position: THREE.Vector3) => void;
  private onSpeedChange: (speed: number) => void;

  setPlanets(planets: Planet[]) {
    this.planets = planets;
    console.log(`Updated camera with ${planets.length} planets`);
  }
  

  /**
   * Initialize the advanced space camera
   */
  constructor(
    camera: THREE.PerspectiveCamera,
    planets: Planet[],
    initialPosition?: THREE.Vector3,
    callbacks?: {
      onModeChange?: (mode: CameraMode) => void;
      onTargetChange?: (target: Planet | null) => void;
      onPositionChange?: (position: THREE.Vector3) => void;
      onSpeedChange?: (speed: number) => void;
    }
  ) {
    // Set up camera
    this.camera = camera;
    this.planets = planets || [];
    
    // Make sure the position is applied to both the position property and the camera position
    this.position = initialPosition || new THREE.Vector3(149597890 + 10000, 0, 0);
    this.camera.position.copy(this.position);
    
    // Synchronize camera quaternion to initial direction
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.quaternion = new THREE.Quaternion();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.quaternion.setFromEuler(this.rotation);
    this.camera.quaternion.copy(this.quaternion);

    // Setup raycaster for planet selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Initialize movement vectors
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.quaternion = new THREE.Quaternion();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.speed = 0;
    this.targetSpeed = 0;
    this.mass = 1000; // kg - ship mass

    // Camera settings with reasonable defaults
    this.settings = {
      movementSpeed: 1000, // Base speed (km/s)
      rotationSpeed: 0.002, // Rotation sensitivity
      maxSpeed: 100000, // Maximum speed (km/s)
      minSpeed: 0, // Minimum speed (km/s)
      dampingFactor: 0.95, // Inertia factor
      boostMultiplier: 5, // Speed boost multiplier
      zoomSensitivity: 0.1, // Scroll zoom sensitivity
      minDistance: 1000, // Minimum orbit distance
      maxDistance: 100000, // Maximum orbit distance
      inertia: true, // Enable physics-based movement
    };

    // Initialize control state
    this.mode = CameraMode.FREE_FLIGHT;
    this.previousMode = null;
    this.keys = {};
    this.mouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.enableMouseLook = false;

    // Initialize target and autopilot
    this.currentTarget = null;
    this.autopilot = {
      target: null,
      active: false,
      arrivalDistance: 10000, // Default distance to stop autopilot (km)
      initialDistance: 0,
      startTime: 0,
      flightPath: [],
      currentPathIndex: 0,
      targetVelocity: new THREE.Vector3(),
      completed: false,
    };
    this.warpActive = false;
    this.warpProgress = 0;
    this.warpTween = null;

    // UI callbacks
    this.onModeChange = callbacks?.onModeChange || (() => {});
    this.onTargetChange = callbacks?.onTargetChange || (() => {});
    this.onPositionChange = callbacks?.onPositionChange || (() => {});
    this.onSpeedChange = callbacks?.onSpeedChange || (() => {});

    // Initialize controls
    this.setupEventListeners();

    // Set initial camera direction
    this.updateCameraDirection();
  }

  /**
   * Set up event listeners for user input
   */
  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    // Mouse events
    document.addEventListener("mousedown", this.onMouseDown.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));
    document.addEventListener("mousemove", this.onMouseMove.bind(this));
    document.addEventListener("wheel", this.onMouseWheel.bind(this));

    // Prevent right-click menu
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  /**
   * Handle keyboard key press
   */
  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = true;

    // Toggle autopilot with F key
    if (key === KEYS.AUTOPILOT && this.currentTarget && !this.warpActive) {
      if (this.mode !== CameraMode.AUTOPILOT) {
        this.startAutopilot();
      } else {
        this.cancelAutopilot();
      }
    }

    // Activate warp drive with R key
    if (key === KEYS.WARP && this.currentTarget && !this.autopilot.active) {
      this.startWarp();
    }

    // Cancel all automated movement with ESC
    if (key === KEYS.ESC) {
      this.cancelAllAutomatedMovement();
    }
  }

  /**
   * Handle keyboard key release
   */
  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = false;
  }

  /**
   * Handle mouse button press
   */
  private onMouseDown(event: MouseEvent): void {
    this.mouseDown = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    // Enable mouse look with left button
    if (event.button === 0) {
      this.enableMouseLook = true;
    }

    // Handle planet selection with right click
    if (event.button === 2) {
      this.selectPlanetAtMouse(event);
    }
  }

  /**
   * Handle mouse button release
   */
  private onMouseUp(event: MouseEvent): void {
    this.mouseDown = false;

    // Disable mouse look
    if (event.button === 0) {
      this.enableMouseLook = false;
    }
  }

  /**
   * Handle mouse movement for camera rotation
   */
  private onMouseMove(event: MouseEvent): void {
    // Update mouse position for raycasting
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Handle camera rotation when mouse look is enabled
    if (this.enableMouseLook && this.mode === CameraMode.FREE_FLIGHT) {
      const movementX = event.clientX - this.lastMouseX;
      const movementY = event.clientY - this.lastMouseY;

      // Rotate camera based on mouse movement
      this.rotation.y -= movementX * this.settings.rotationSpeed;
      this.rotation.x -= movementY * this.settings.rotationSpeed;

      // Limit vertical rotation to avoid gimbal lock
      this.rotation.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, this.rotation.x)
      );

      // Update camera direction
      this.updateCameraDirection();

      // Store current mouse position
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  /**
   * Handle mouse wheel for zoom/speed control
   */
  private onMouseWheel(event: WheelEvent): void {
    if (this.mode === CameraMode.FREE_FLIGHT) {
      // Adjust target speed with the scroll wheel
      const speedDelta = event.deltaY * this.settings.zoomSensitivity;
      this.targetSpeed = Math.max(
        this.settings.minSpeed,
        Math.min(this.settings.maxSpeed, this.targetSpeed + speedDelta)
      );
      this.onSpeedChange(this.targetSpeed);
    } else if (this.mode === CameraMode.ORBIT && this.currentTarget) {
      // Adjust orbit distance when in orbit mode
      const orbitDelta = event.deltaY * this.settings.zoomSensitivity * 100;
      const currentDistance = this.position.distanceTo(
        this.currentTarget.position
      );
      const newDistance = Math.max(
        this.settings.minDistance,
        Math.min(this.settings.maxDistance, currentDistance + orbitDelta)
      );

      // Maintain angle but change distance
      const direction = new THREE.Vector3()
        .subVectors(this.position, this.currentTarget.position)
        .normalize();
      this.position.copy(
        direction.multiplyScalar(newDistance).add(this.currentTarget.position)
      );
    }
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Select a planet at the current mouse position
   */
  private selectPlanetAtMouse(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all planet meshes for intersection test
    const planetMeshes = this.planets.map((planet) => planet.mesh);
    const intersects = this.raycaster.intersectObjects(planetMeshes, true);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

      // Find which planet this mesh belongs to
      const targetPlanet = this.planets.find((planet) => {
        return (
          planet.mesh === intersectedObject ||
          (planet.mesh instanceof THREE.Group &&
            planet.mesh.children.includes(intersectedObject as THREE.Object3D))
        );
      });

      if (targetPlanet) {
        this.setTarget(targetPlanet);
      }
    }
  }

  /**
   * Set a planet as the current target
   */
  public setTarget(planet: Planet): void {
    // First validate the planet position
    if (!planet.position || 
        isNaN(planet.position.x) || 
        isNaN(planet.position.y) || 
        isNaN(planet.position.z)) {
      console.error(`Cannot set target: Planet ${planet.name} has invalid position:`, planet.position);
      return;
    }
    
    // Create a clean copy to avoid reference issues
    const validatedPlanet = {
      ...planet,
      position: new THREE.Vector3(
        planet.position.x,
        planet.position.y,
        planet.position.z
      ),
      // Copy other essential properties
      name: planet.name,
      radius: planet.radius || planet.diameter / 2 || 10000,
      mass: planet.mass || 1.0e24,
      mesh: planet.mesh
    };
    
    // Set the validated target
    this.currentTarget = validatedPlanet;
    this.onTargetChange(validatedPlanet);
  
    console.log(`Target set to ${validatedPlanet.name} at position:`, validatedPlanet.position);
  }
  /**
   * Clear the current target
   */
  public clearTarget(): void {
    this.currentTarget = null;
    this.onTargetChange(null);
  }

  /**
   * Start autopilot navigation to the current target
   */
  public startAutopilot(): void {
    if (!this.currentTarget) {
      console.warn("Cannot start autopilot: No target selected");
      return;
    }

    // Store previous mode to return to after autopilot completes
    this.previousMode = this.mode;
    this.setMode(CameraMode.AUTOPILOT);

    const targetPosition = this.currentTarget.position.clone();
    const currentPosition = this.position.clone();
    const distance = currentPosition.distanceTo(targetPosition);

    // Initialize autopilot data
    this.autopilot = {
      target: this.currentTarget,
      active: true,
      arrivalDistance: this.currentTarget.radius * 5, // Stop at 5x the planet's radius
      initialDistance: distance,
      startTime: Date.now(),
      flightPath: this.calculateFlightPath(currentPosition, targetPosition),
      currentPathIndex: 0,
      targetVelocity: new THREE.Vector3(),
      completed: false,
    };

    console.log(`Autopilot engaged: Navigating to ${this.currentTarget.name}`);
  }

  /**
   * Cancel autopilot and return to previous mode
   */
  public cancelAutopilot(): void {
    if (this.autopilot.active) {
      this.autopilot.active = false;
      this.setMode(this.previousMode || CameraMode.FREE_FLIGHT);
      console.log("Autopilot disengaged");
    }
  }

// Improved startWarp method for AdvancedSpaceCamera.ts
public startWarp(): void {
  if (!this.currentTarget) {
    console.warn("Cannot initiate warp: No target selected");
    return;
  }

  // Store previous mode to return to after warp completes
  this.previousMode = this.mode;
  this.setMode(CameraMode.WARPING);

  // Deep clone the positions to prevent reference issues
  const targetPosition = new THREE.Vector3(
    this.currentTarget.position.x,
    this.currentTarget.position.y,
    this.currentTarget.position.z
  );
  
  const currentPosition = new THREE.Vector3(
    this.position.x,
    this.position.y,
    this.position.z
  );
  
  // Validate positions
  if (isNaN(targetPosition.x) || isNaN(targetPosition.y) || isNaN(targetPosition.z)) {
    console.error("Target has invalid position:", targetPosition);
    this.cancelWarp();
    return;
  }
  
  if (isNaN(currentPosition.x) || isNaN(currentPosition.y) || isNaN(currentPosition.z)) {
    console.error("Current position is invalid:", currentPosition);
    this.cancelWarp();
    return;
  }

  const distance = currentPosition.distanceTo(targetPosition);

  // Set warp parameters
  this.warpActive = true;
  this.warpProgress = 0;

  // Calculate suitable arrival position (offset from planet surface)
  const arrivalDistance = Math.max(10000, this.currentTarget.radius * 5); // Minimum 10,000km
  
  // Create direction vector from target to our position (reversed from usual)
  let arrivalDirection = new THREE.Vector3()
    .subVectors(currentPosition, targetPosition);
    
  // Fix for when positions are too close (prevents NaN from normalization of zero vector)
  if (arrivalDirection.length() < 0.001) {
    console.log("Positions too close, using default direction vector");
    // Use a default direction if positions are too close
    arrivalDirection = new THREE.Vector3(1, 0, 0);
  }
  
  // Now normalize safely
  arrivalDirection.normalize();
      
  // Add this vector to the target position with proper scale
  const arrivalPosition = targetPosition.clone()
    .add(arrivalDirection.multiplyScalar(arrivalDistance));

  console.log("Warp parameters:", {
    from: currentPosition,
    to: arrivalPosition,
    arrivalDistance
  });

  // Final validation of arrival position
  if (isNaN(arrivalPosition.x) || isNaN(arrivalPosition.y) || isNaN(arrivalPosition.z)) {
    console.error("Calculated arrival position is invalid:", arrivalPosition);
    this.cancelWarp();
    return;
  }

  // Create warp animation using TWEEN
  this.warpTween = new TWEEN.Tween({ progress: 0 })
    .to({ progress: 1 }, 3000) // 3 second warp
    .easing(TWEEN.Easing.Quintic.InOut)
    .onUpdate((obj) => {
      this.warpProgress = obj.progress;

      // Calculate intermediate position
      const newPosition = new THREE.Vector3().lerpVectors(
        currentPosition,
        arrivalPosition,
        this.warpProgress
      );

      // Update position
      this.position.copy(newPosition);

      // Look at target during warp
      this.lookAt(this.currentTarget!.position);
    })
    .onComplete(() => {
      // End warp
      this.warpActive = false;
      this.warpTween = null;

      // Go into orbit mode after warp
      this.setMode(CameraMode.ORBIT);

      console.log(`Warp complete: Arrived at ${this.currentTarget!.name}`);
    })
    .start();

  console.log(`Warp drive engaged: Warping to ${this.currentTarget.name}`);
}

  /**
   * Cancel warp and return to previous mode
   */
  public cancelWarp(): void {
    if (this.warpActive && this.warpTween) {
      this.warpTween.stop();
      this.warpActive = false;
      this.warpTween = null;
      this.setMode(this.previousMode || CameraMode.FREE_FLIGHT);
      console.log("Warp drive disengaged");
    }
  }

  /**
   * Set the camera to orbit around the current target
   */
  public startOrbit(): void {
    if (!this.currentTarget) {
      console.warn("Cannot start orbit: No target selected");
      return;
    }

    this.setMode(CameraMode.ORBIT);
    console.log(`Orbit mode engaged: Orbiting ${this.currentTarget.name}`);
  }

  /**
   * Set the camera to follow behind the current target
   */
  public startFollow(): void {
    if (!this.currentTarget) {
      console.warn("Cannot start follow: No target selected");
      return;
    }

    this.setMode(CameraMode.FOLLOW);
    console.log(`Follow mode engaged: Following ${this.currentTarget.name}`);
  }

  /**
   * Cancel all automated movement modes
   */
  public cancelAllAutomatedMovement(): void {
    if (this.autopilot.active) {
      this.cancelAutopilot();
    }

    if (this.warpActive) {
      this.cancelWarp();
    }

    this.setMode(CameraMode.FREE_FLIGHT);
  }

  /**
   * Calculate a flight path to the target
   */
  private calculateFlightPath(
    start: THREE.Vector3,
    end: THREE.Vector3
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const segments = 100;

    // Create a simple path for now - could be enhanced with gravity-based trajectory
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      path.push(point);
    }

    return path;
  }

  /**
   * Update the camera direction based on current rotation
   */
  private updateCameraDirection(): void {
    // Reset direction vector
    this.direction.set(0, 0, -1);

    // Apply camera rotation
    this.quaternion.setFromEuler(this.rotation);
    this.direction.applyQuaternion(this.quaternion);
    this.direction.normalize();

    // Update camera quaternion
    this.camera.quaternion.copy(this.quaternion);
  }

  /**
   * Set the camera mode
   */
  private setMode(mode: CameraMode): void {
    this.mode = mode;
    this.onModeChange(mode);
  }

  /**
   * Look at a specific point in space
   */
  public lookAt(point: THREE.Vector3): void {
    this.camera.lookAt(point);

    // Extract the rotation from the camera's matrix
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(this.position, point, this.camera.up);

    const lookAtQuaternion = new THREE.Quaternion();
    lookAtQuaternion.setFromRotationMatrix(lookAtMatrix);

    // Update camera rotation
    this.quaternion.copy(lookAtQuaternion);
    this.rotation.setFromQuaternion(this.quaternion, "YXZ");

    // Update direction
    this.direction.subVectors(point, this.position).normalize();
  }

  /**
   * Update physics for free flight mode
   */
  private updateFreeFlight(deltaTime: number): void {
    // Process keyboard input
    const forward = this.keys[KEYS.FORWARD] ? 1 : 0;
    const backward = this.keys[KEYS.BACKWARD] ? -1 : 0;
    const left = this.keys[KEYS.LEFT] ? -1 : 0;
    const right = this.keys[KEYS.RIGHT] ? 1 : 0;
    const up = this.keys[KEYS.UP] ? 1 : 0;
    const down = this.keys[KEYS.DOWN] ? -1 : 0;
    const boost = this.keys[KEYS.BOOST] ? this.settings.boostMultiplier : 1;
    const brake = this.keys[KEYS.BRAKE] ? 1 : 0;

    // Calculate target speed
    if (forward || backward) {
      this.targetSpeed =
        this.settings.movementSpeed * boost * (forward + backward);
    } else if (brake) {
      // Braking - gradually reduce speed
      this.targetSpeed *= 0.9;
    }

    // Smoothly adjust current speed toward target speed
    this.speed = this.speed * 0.95 + this.targetSpeed * 0.05;

    // Apply velocity in movement direction
    const moveDir = this.direction.clone();
    this.velocity.copy(moveDir.multiplyScalar(this.speed * deltaTime));

    // Add strafing (left/right)
    if (left || right) {
      const strafeDir = new THREE.Vector3(
        this.direction.z,
        0,
        -this.direction.x
      ).normalize();
      strafeDir.multiplyScalar(
        (left + right) * this.settings.movementSpeed * boost * deltaTime
      );
      this.velocity.add(strafeDir);
    }

    // Add vertical movement (up/down)
    if (up || down) {
      const upDir = new THREE.Vector3(0, 1, 0).multiplyScalar(
        (up + down) * this.settings.movementSpeed * boost * deltaTime
      );
      this.velocity.add(upDir);
    }

    // Apply roll (z-axis rotation) if requested
    if (this.keys[KEYS.ROLL_LEFT]) {
      this.rotation.z += 0.02;
      this.updateCameraDirection();
    }
    if (this.keys[KEYS.ROLL_RIGHT]) {
      this.rotation.z -= 0.02;
      this.updateCameraDirection();
    }

    // Update position
    this.position.add(this.velocity);

    // Apply inertia/damping if enabled
    if (
      this.settings.inertia &&
      !forward &&
      !backward &&
      !left &&
      !right &&
      !up &&
      !down
    ) {
      this.velocity.multiplyScalar(this.settings.dampingFactor);
      if (this.velocity.length() < 0.01) {
        this.velocity.set(0, 0, 0);
      }
    }

    // Update the camera position
    this.camera.position.copy(this.position);

    // Broadcast position update
    this.onPositionChange(this.position);
    this.onSpeedChange(this.speed);
  }

  /**
   * Update physics for autopilot mode
   */
  private updateAutopilot(deltaTime: number): void {
    if (!this.autopilot.active || !this.autopilot.target) {
      return;
    }

    // Get current and target positions
    const targetPosition = this.autopilot.target.position.clone();
    const currentPosition = this.position.clone();
    const distance = currentPosition.distanceTo(targetPosition);

    // Check if we've arrived
    if (distance <= this.autopilot.arrivalDistance) {
      console.log(
        `Autopilot complete: Arrived at ${this.autopilot.target.name}`
      );
      this.autopilot.completed = true;

      // Switch to orbit mode
      this.startOrbit();
      return;
    }

    // Calculate progress and adjust speed
    const progress = 1 - distance / this.autopilot.initialDistance;

    // Start slow, middle fast, end slow (acceleration curve)
    let speedFactor: number;
    if (progress < 0.3) {
      // Accelerating phase
      speedFactor = Math.pow(progress / 0.3, 2) * 0.5 + 0.1;
    } else if (progress > 0.7) {
      // Decelerating phase
      speedFactor = Math.pow((1 - progress) / 0.3, 2) * 0.5 + 0.1;
    } else {
      // Cruising phase
      speedFactor = 0.6;
    }

    // Calculate direction and apply velocity
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, currentPosition)
      .normalize();

    // Calculate speed based on distance (faster for longer distances)
    const baseSpeed = Math.min(
      this.settings.maxSpeed,
      Math.max(this.settings.movementSpeed, distance / 10)
    );

    const speed = baseSpeed * speedFactor;
    this.velocity = direction.multiplyScalar(speed * deltaTime);

    // Update position
    this.position.add(this.velocity);

    // Look at where we're going
    this.lookAt(targetPosition);

    // Update the camera position
    this.camera.position.copy(this.position);

    // Broadcast updates
    this.onPositionChange(this.position);
    this.onSpeedChange(speed);
  }

  /**
   * Update orbit mode around the current target
   */
  private updateOrbit(deltaTime: number): void {
    if (!this.currentTarget) {
      return;
    }

    const targetPosition = this.currentTarget.position.clone();
    const currentPosition = this.position.clone();

    // Get orbit parameters
    const distance = currentPosition.distanceTo(targetPosition);
    const orbitSpeed = 0.2 * deltaTime; // Orbit speed in radians per second

    // Calculate orbital axis (simulate orbital mechanics)
    const orbitAxis = new THREE.Vector3(0, 1, 0); // Default to y-axis

    // Calculate new position by rotating around the orbit axis
    const offset = new THREE.Vector3().subVectors(
      currentPosition,
      targetPosition
    );
    offset.applyAxisAngle(orbitAxis, orbitSpeed);

    this.position.copy(targetPosition).add(offset);

    // Look at the target
    this.lookAt(targetPosition);

    // Update the camera position
    this.camera.position.copy(this.position);

    // Broadcast position update
    this.onPositionChange(this.position);
    this.onSpeedChange(0); // Constant orbital speed
  }

  /**
   * Update follow mode behind the current target
   */
  private updateFollow(deltaTime: number): void {
    if (!this.currentTarget) {
      return;
    }

    const targetPosition = this.currentTarget.position.clone();

    // Calculate offset based on target size
    const followDistance = this.currentTarget.radius * 5;
    const followHeight = this.currentTarget.radius * 2;

    // Calculate follow position (behind and slightly above)
    const followOffset = new THREE.Vector3(
      -followDistance, // Behind
      followHeight, // Above
      0 // No lateral offset
    );

    // Apply rotation based on target's orientation or movement
    // For now, we'll use a simple rotation around the target
    const angle = Date.now() * 0.0001; // Simple rotation based on time
    const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
    followOffset.applyMatrix4(rotationMatrix);

    // Set new position
    const newPosition = targetPosition.clone().add(followOffset);

    // Smoothly move to the new position
    this.position.lerp(newPosition, 0.1);

    // Look at the target
    this.lookAt(targetPosition);

    // Update the camera position
    this.camera.position.copy(this.position);

    // Broadcast position update
    this.onPositionChange(this.position);
    this.onSpeedChange(0); // Following speed
  }

  /**
   * Update warp effect (handled by TWEEN)
   */
  private updateWarp(deltaTime: number): void {
    // TWEEN handles the warp animation
    TWEEN.update();
  }

  /**
   * Apply gravitational forces from nearby planets
   */
  /**
   * Apply gravitational forces from nearby planets
   */
  private applyGravity(deltaTime: number): void {
    if (!this.settings.inertia || this.mode !== CameraMode.FREE_FLIGHT) {
      return;
    }

    this.acceleration.set(0, 0, 0);

    // Calculate gravitational forces from all planets
    for (const planet of this.planets) {
      const distance = this.position.distanceTo(planet.position);

      // Skip if too far away to have meaningful gravitational effect
      // or if too close (to prevent extreme acceleration)
      if (distance > 1e8 || distance < planet.radius * 2) {
        continue;
      }

      // Calculate gravitational force: F = G * (m1 * m2) / r²
      const forceMagnitude =
        (G * (this.mass * planet.mass)) / (distance * distance);

      // Get direction towards the planet
      const direction = new THREE.Vector3()
        .subVectors(planet.position, this.position)
        .normalize();

      // Calculate force vector
      const force = direction.multiplyScalar(forceMagnitude);

      // Convert force to acceleration: a = F / m
      const acceleration = force.divideScalar(this.mass);

      // Add to total acceleration
      this.acceleration.add(acceleration);
    }

    // Scale down acceleration for gameplay purposes
    this.acceleration.multiplyScalar(0.01);

    // Apply acceleration to velocity
    this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
  }

  /**
   * Calculate closest planet for proximity alerts
   */
  private getClosestPlanet(): { planet: Planet; distance: number } | null {
    if (this.planets.length === 0) {
      return null;
    }

    let closestPlanet = this.planets[0];
    let closestDistance = this.position.distanceTo(closestPlanet.position);

    for (let i = 1; i < this.planets.length; i++) {
      const planet = this.planets[i];
      const distance = this.position.distanceTo(planet.position);

      if (distance < closestDistance) {
        closestPlanet = planet;
        closestDistance = distance;
      }
    }

    return {
      planet: closestPlanet,
      distance: closestDistance,
    };
  }

  /**
   * Update camera and physics for the current frame
   */
  public update(deltaTime: number): void {
    // Skip if delta time is too large (e.g., after tab was inactive)
    if (deltaTime > 1) {
      deltaTime = 0.016; // Default to 60fps
    }
  
    // Update based on current mode
    try {
      switch (this.mode) {
        case CameraMode.FREE_FLIGHT:
          this.updateFreeFlight(deltaTime);
          this.applyGravity(deltaTime);
          break;
  
        case CameraMode.AUTOPILOT:
          this.updateAutopilot(deltaTime);
          break;
  
        case CameraMode.ORBIT:
          this.updateOrbit(deltaTime);
          break;
  
        case CameraMode.FOLLOW:
          this.updateFollow(deltaTime);
          break;
  
        case CameraMode.WARPING:
          this.updateWarp(deltaTime);
          break;
      }
  
      // Make sure camera position is synchronized with our internal position
      this.camera.position.copy(this.position);
      
      // Check for nearby planets (could be used for proximity warnings or info displays)
      const closest = this.getClosestPlanet();
      if (closest && closest.distance < closest.planet.radius * 10) {
        // We're close to a planet - could trigger proximity warning or auto-select
        if (!this.currentTarget) {
          this.setTarget(closest.planet);
        }
      }
    } catch (error) {
      console.error("Error in camera update:", error);
    }
  }

  /**
   * Set camera settings
   */
  public setSettings(settings: Partial<CameraSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  /**
   * Get current camera velocity
   */
  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  /**
   * Get current camera speed
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Get current camera mode
   */
  public getMode(): CameraMode {
    return this.mode;
  }

  /**
   * Get current target
   */
  public getTarget(): Planet | null {
    return this.currentTarget;
  }

  /**
   * Check if autopilot is active
   */
  public isAutopilotActive(): boolean {
    return this.autopilot.active;
  }

  /**
   * Check if warp is active
   */
  public isWarpActive(): boolean {
    return this.warpActive;
  }

  /**
   * Get autopilot progress (0-1)
   */
  public getAutopilotProgress(): number {
    if (!this.autopilot.active || !this.autopilot.target) {
      return 0;
    }

    const initialDistance = this.autopilot.initialDistance;
    const currentDistance = this.position.distanceTo(
      this.autopilot.target.position
    );

    return 1 - currentDistance / initialDistance;
  }

  /**
   * Get warp progress (0-1)
   */
  public getWarpProgress(): number {
    return this.warpProgress;
  }

  /**
   * Manually warp to a specific planet by name
   */
  public warpToPlanet(planetName: string): boolean {
    const planet = this.planets.find(
      (p) => p.name.toLowerCase() === planetName.toLowerCase()
    );

    if (planet) {
      this.setTarget(planet);
      this.startWarp();
      return true;
    }

    console.warn(`Planet "${planetName}" not found`);
    return false;
  }

  /**
   * Clean up event listeners
   */
  public dispose(): void {
    // Remove event listeners
    document.removeEventListener("keydown", this.onKeyDown.bind(this));
    document.removeEventListener("keyup", this.onKeyUp.bind(this));
    document.removeEventListener("mousedown", this.onMouseDown.bind(this));
    document.removeEventListener("mouseup", this.onMouseUp.bind(this));
    document.removeEventListener("mousemove", this.onMouseMove.bind(this));
    document.removeEventListener("wheel", this.onMouseWheel.bind(this));
    document.removeEventListener("contextmenu", (e) => e.preventDefault());
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    // Cancel any active animations
    if (this.warpTween) {
      this.warpTween.stop();
      this.warpTween = null;
    }
  }
}
