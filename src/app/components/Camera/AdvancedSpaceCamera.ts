import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import * as TWEEN from "@tweenjs/tween.js";

const G = 6.6743e-11; const TIME_SCALE_FACTOR = 1000; 
export enum CameraMode {
  FREE_FLIGHT = "free_flight",
  AUTOPILOT = "autopilot",
  ORBIT = "orbit",
  FOLLOW = "follow",
  WARPING = "warping",
}

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


export default class AdvancedSpaceCamera {
    public camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private planets: Planet[];

    public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private acceleration: THREE.Vector3;
  private rotation: THREE.Euler;
  private quaternion: THREE.Quaternion;

    private speed: number;
  private targetSpeed: number;
  private direction: THREE.Vector3;
  private settings: CameraSettings;
  private mass: number;

    private mode: CameraMode;
  private previousMode: CameraMode | null;
  private keys: { [key: string]: boolean };
  private mouseDown: boolean;
  private lastMouseX: number;
  private lastMouseY: number;
  private enableMouseLook: boolean;

    private currentTarget: Planet | null;
  private autopilot: AutopilotData;
  private warpActive: boolean;
  private warpProgress: number;
  private warpTween: TWEEN.Tween<any> | null;

    private onModeChange: (mode: CameraMode) => void;
  private onTargetChange: (target: Planet | null) => void;
  private onPositionChange: (position: THREE.Vector3) => void;
  private onSpeedChange: (speed: number) => void;

  setPlanets(planets: Planet[]) {
    this.planets = planets;
    console.log(`Updated camera with ${planets.length} planets`);
  }

  
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
        this.camera = camera;
    this.planets = planets || [];

        this.position =
      initialPosition || new THREE.Vector3(149597890 + 10000, 0, 0);
    this.camera.position.copy(this.position);

        this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.quaternion = new THREE.Quaternion();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.quaternion.setFromEuler(this.rotation);
    this.camera.quaternion.copy(this.quaternion);

        this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

        this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.quaternion = new THREE.Quaternion();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.speed = 0;
    this.targetSpeed = 0;
    this.mass = 1000; 
        this.settings = {
      movementSpeed: 1000,       rotationSpeed: 0.002,       maxSpeed: 100000,       minSpeed: 0,       dampingFactor: 0.95,       boostMultiplier: 5,       zoomSensitivity: 0.1,       minDistance: 1000,       maxDistance: 100000,       inertia: true,     };

        this.mode = CameraMode.FREE_FLIGHT;
    this.previousMode = null;
    this.keys = {};
    this.mouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.enableMouseLook = false;

        this.currentTarget = null;
    this.autopilot = {
      target: null,
      active: false,
      arrivalDistance: 10000,       initialDistance: 0,
      startTime: 0,
      flightPath: [],
      currentPathIndex: 0,
      targetVelocity: new THREE.Vector3(),
      completed: false,
    };
    this.warpActive = false;
    this.warpProgress = 0;
    this.warpTween = null;

        this.onModeChange = callbacks?.onModeChange || (() => {});
    this.onTargetChange = callbacks?.onTargetChange || (() => {});
    this.onPositionChange = callbacks?.onPositionChange || (() => {});
    this.onSpeedChange = callbacks?.onSpeedChange || (() => {});

        this.setupEventListeners();

        this.updateCameraDirection();
  }

  
  private setupEventListeners(): void {
        document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

        document.addEventListener("mousedown", this.onMouseDown.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));
    document.addEventListener("mousemove", this.onMouseMove.bind(this));
    document.addEventListener("wheel", this.onMouseWheel.bind(this));

        document.addEventListener("contextmenu", (e) => e.preventDefault());

        window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  
  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = true;

        if (key === KEYS.AUTOPILOT && this.currentTarget && !this.warpActive) {
      if (this.mode !== CameraMode.AUTOPILOT) {
        this.startAutopilot();
      } else {
        this.cancelAutopilot();
      }
    }

        if (key === KEYS.WARP && this.currentTarget && !this.autopilot.active) {
      this.startWarp();
    }

        if (key === KEYS.ESC) {
      this.cancelAllAutomatedMovement();
    }
  }

  
  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = false;
  }

  
  private onMouseDown(event: MouseEvent): void {
    this.mouseDown = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

        if (event.button === 0) {
      this.enableMouseLook = true;
    }

        if (event.button === 2) {
      this.selectPlanetAtMouse(event);
    }
  }

  
  private onMouseUp(event: MouseEvent): void {
    this.mouseDown = false;

        if (event.button === 0) {
      this.enableMouseLook = false;
    }
  }

  
  private onMouseMove(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.enableMouseLook && this.mode === CameraMode.FREE_FLIGHT) {
      const movementX = event.clientX - this.lastMouseX;
      const movementY = event.clientY - this.lastMouseY;

            this.rotation.y -= movementX * this.settings.rotationSpeed;
      this.rotation.x -= movementY * this.settings.rotationSpeed;

            this.rotation.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, this.rotation.x)
      );

            this.updateCameraDirection();

            this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  
  private onMouseWheel(event: WheelEvent): void {
    if (this.mode === CameraMode.FREE_FLIGHT) {
            const speedDelta = event.deltaY * this.settings.zoomSensitivity;
      this.targetSpeed = Math.max(
        this.settings.minSpeed,
        Math.min(this.settings.maxSpeed, this.targetSpeed + speedDelta)
      );
      this.onSpeedChange(this.targetSpeed);
    } else if (this.mode === CameraMode.ORBIT && this.currentTarget) {
            const orbitDelta = event.deltaY * this.settings.zoomSensitivity * 100;
      const currentDistance = this.position.distanceTo(
        this.currentTarget.position
      );
      const newDistance = Math.max(
        this.settings.minDistance,
        Math.min(this.settings.maxDistance, currentDistance + orbitDelta)
      );

            const direction = new THREE.Vector3()
        .subVectors(this.position, this.currentTarget.position)
        .normalize();
      this.position.copy(
        direction.multiplyScalar(newDistance).add(this.currentTarget.position)
      );
    }
  }

  
  private onWindowResize(): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  
  private selectPlanetAtMouse(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

        const planetMeshes = this.planets.map((planet) => planet.mesh);
    const intersects = this.raycaster.intersectObjects(planetMeshes, true);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

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

  
  public setTarget(planet: Planet): void {
        if (
      !planet.position ||
      isNaN(planet.position.x) ||
      isNaN(planet.position.y) ||
      isNaN(planet.position.z)
    ) {
      console.error(
        `Cannot set target: Planet ${planet.name} has invalid position:`,
        planet.position
      );
      return;
    }

        const validatedPlanet = {
      ...planet,
      position: new THREE.Vector3(
        planet.position.x,
        planet.position.y,
        planet.position.z
      ),
            name: planet.name,
      radius: planet.radius || planet.diameter / 2 || 10000,
      mass: planet.mass || 1.0e24,
      mesh: planet.mesh,
    };

        this.currentTarget = validatedPlanet;
    this.onTargetChange(validatedPlanet);

    console.log(
      `Target set to ${validatedPlanet.name} at position:`,
      validatedPlanet.position
    );
  }
  
  public clearTarget(): void {
    this.currentTarget = null;
    this.onTargetChange(null);
  }

  
    public startAutopilot() {
    if (!this.currentTarget) {
      console.warn("Cannot start autopilot: No target selected");
      return;
    }

        this.cancelAllAutomatedMovement();

        this.previousMode = this.mode;
    this.setMode(CameraMode.AUTOPILOT);

        const dynamicTargetPosition = this.currentTarget.mesh.position.clone();

        this.autopilot = {
      target: this.currentTarget,
      active: true,
      arrivalDistance: this.currentTarget.radius * 5,       initialDistance: this.position.distanceTo(dynamicTargetPosition),
      startTime: Date.now(),
      flightPath: this.calculateFlightPath(
        this.position.clone(),
        dynamicTargetPosition
      ),
      currentPathIndex: 0,
      targetVelocity: new THREE.Vector3(),
      completed: false,
    };

    console.log(`Autopilot engaged: Navigating to ${this.currentTarget.name}`);
  }

  
  public cancelAutopilot() {
    if (this.autopilot.active) {
      this.autopilot.active = false;
      this.autopilot.completed = false;

            this.setMode(this.previousMode || CameraMode.FREE_FLIGHT);
      console.log("Autopilot disengaged");
    }
  }

    public startWarp(): void {
    if (!this.currentTarget) {
      console.warn("Cannot initiate warp: No target selected");
      return;
    }

        this.previousMode = this.mode;
    this.setMode(CameraMode.WARPING);

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

        if (
      isNaN(targetPosition.x) ||
      isNaN(targetPosition.y) ||
      isNaN(targetPosition.z)
    ) {
      console.error("Target has invalid position:", targetPosition);
      this.cancelWarp();
      return;
    }

    if (
      isNaN(currentPosition.x) ||
      isNaN(currentPosition.y) ||
      isNaN(currentPosition.z)
    ) {
      console.error("Current position is invalid:", currentPosition);
      this.cancelWarp();
      return;
    }

    const distance = currentPosition.distanceTo(targetPosition);

        this.warpActive = true;
    this.warpProgress = 0;

        const arrivalDistance = Math.max(10000, this.currentTarget.radius * 5); 
        let arrivalDirection = new THREE.Vector3().subVectors(
      currentPosition,
      targetPosition
    );

        if (arrivalDirection.length() < 0.001) {
      console.log("Positions too close, using default direction vector");
            arrivalDirection = new THREE.Vector3(1, 0, 0);
    }

        arrivalDirection.normalize();

        const arrivalPosition = targetPosition
      .clone()
      .add(arrivalDirection.multiplyScalar(arrivalDistance));

    console.log("Warp parameters:", {
      from: currentPosition,
      to: arrivalPosition,
      arrivalDistance,
    });

        if (
      isNaN(arrivalPosition.x) ||
      isNaN(arrivalPosition.y) ||
      isNaN(arrivalPosition.z)
    ) {
      console.error("Calculated arrival position is invalid:", arrivalPosition);
      this.cancelWarp();
      return;
    }

        this.warpTween = new TWEEN.Tween({ progress: 0 })
      .to({ progress: 1 }, 3000)       .easing(TWEEN.Easing.Quintic.InOut)
      .onUpdate((obj) => {
        this.warpProgress = obj.progress;

                const newPosition = new THREE.Vector3().lerpVectors(
          currentPosition,
          arrivalPosition,
          this.warpProgress
        );

                this.position.copy(newPosition);

                this.lookAt(this.currentTarget!.position);
      })
      .onComplete(() => {
                this.warpActive = false;
        this.warpProgress = 0;
        this.warpTween = null;

                this.setMode(CameraMode.ORBIT);

        console.log(`Warp complete: Arrived at ${this.currentTarget!.name}`);
      })
      .start();

    console.log(`Warp drive engaged: Warping to ${this.currentTarget.name}`);
  }
  
  public cancelWarp(): void {
    if (this.warpActive && this.warpTween) {
      this.warpTween.stop();
      this.warpActive = false;
      this.warpProgress = 0;
      this.warpTween = null;
      this.setMode(this.previousMode || CameraMode.FREE_FLIGHT);
      console.log("Warp drive disengaged");
    }
  }

  
  public startOrbit(): void {
    if (!this.currentTarget) {
      console.warn("Cannot start orbit: No target selected");
      return;
    }

    this.setMode(CameraMode.ORBIT);
    console.log(`Orbit mode engaged: Orbiting ${this.currentTarget.name}`);
  }

  
  public startFollow(): void {
    if (!this.currentTarget) {
      console.warn("Cannot start follow: No target selected");
      return;
    }

    this.setMode(CameraMode.FOLLOW);
    console.log(`Follow mode engaged: Following ${this.currentTarget.name}`);
  }

  
  public cancelAllAutomatedMovement(): void {
    if (this.autopilot.active) {
      this.cancelAutopilot();
    }

    if (this.warpActive) {
      this.cancelWarp();
    }

    this.setMode(CameraMode.FREE_FLIGHT);
  }

  
  private calculateFlightPath(
    start: THREE.Vector3,
    end: THREE.Vector3
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const segments = 100;

        for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      path.push(point);
    }

    return path;
  }

  
  private updateCameraDirection(): void {
        this.direction.set(0, 0, -1);

        this.quaternion.setFromEuler(this.rotation);
    this.direction.applyQuaternion(this.quaternion);
    this.direction.normalize();

        this.camera.quaternion.copy(this.quaternion);
  }

  
  private setMode(mode: CameraMode): void {
    this.mode = mode;
    this.onModeChange(mode);
  }

  
  public lookAt(point: THREE.Vector3): void {
    this.camera.lookAt(point);

        const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(this.position, point, this.camera.up);

    const lookAtQuaternion = new THREE.Quaternion();
    lookAtQuaternion.setFromRotationMatrix(lookAtMatrix);

        this.quaternion.copy(lookAtQuaternion);
    this.rotation.setFromQuaternion(this.quaternion, "YXZ");

        this.direction.subVectors(point, this.position).normalize();
  }

  
  private updateFreeFlight(deltaTime: number): void {
        const forward = this.keys[KEYS.FORWARD] ? 1 : 0;
    const backward = this.keys[KEYS.BACKWARD] ? -1 : 0;
    const left = this.keys[KEYS.LEFT] ? -1 : 0;
    const right = this.keys[KEYS.RIGHT] ? 1 : 0;
    const up = this.keys[KEYS.UP] ? 1 : 0;
    const down = this.keys[KEYS.DOWN] ? -1 : 0;
    const boost = this.keys[KEYS.BOOST] ? this.settings.boostMultiplier : 1;
    const brake = this.keys[KEYS.BRAKE] ? 1 : 0;

        if (forward || backward) {
      this.targetSpeed =
        this.settings.movementSpeed * boost * (forward + backward);
    } else if (brake) {
            this.targetSpeed *= 0.9;
    }

        this.speed = this.speed * 0.95 + this.targetSpeed * 0.05;

        const moveDir = this.direction.clone();
    this.velocity.copy(moveDir.multiplyScalar(this.speed * deltaTime));

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

        if (up || down) {
      const upDir = new THREE.Vector3(0, 1, 0).multiplyScalar(
        (up + down) * this.settings.movementSpeed * boost * deltaTime
      );
      this.velocity.add(upDir);
    }

        if (this.keys[KEYS.ROLL_LEFT]) {
      this.rotation.z += 0.02;
      this.updateCameraDirection();
    }
    if (this.keys[KEYS.ROLL_RIGHT]) {
      this.rotation.z -= 0.02;
      this.updateCameraDirection();
    }

        this.position.add(this.velocity);

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

        this.camera.position.copy(this.position);

        this.onPositionChange(this.position);
    this.onSpeedChange(this.speed);
  }

  
    private updateAutopilot(deltaTime: number): void {
    if (!this.autopilot.active || !this.autopilot.target) {
      return;
    }

        const dynamicTargetPosition = this.autopilot.target.mesh.position.clone();
    const currentPosition = this.position.clone();
    const distance = currentPosition.distanceTo(dynamicTargetPosition);

        if (distance <= this.autopilot.arrivalDistance) {
      console.log(
        `Autopilot complete: Arrived at ${this.autopilot.target.name}`
      );
      this.autopilot.completed = true;
      this.autopilot.active = false;
      this.startOrbit();
      return;
    }

        const progress = Math.max(
      0,
      Math.min(1, 1 - distance / this.autopilot.initialDistance)
    );

        let speedFactor: number;
    if (progress < 0.3) {
      speedFactor = Math.pow(progress / 0.3, 2) * 0.5 + 0.1;
    } else if (progress > 0.7) {
      speedFactor = Math.pow((1 - progress) / 0.3, 2) * 0.5 + 0.1;
    } else {
      speedFactor = 0.6;
    }

    const direction = new THREE.Vector3()
      .subVectors(dynamicTargetPosition, currentPosition)
      .normalize();
    const baseSpeed = Math.min(
      this.settings.maxSpeed,
      Math.max(this.settings.movementSpeed, distance / 10)
    );
    const speed = baseSpeed * speedFactor;
    this.velocity = direction.multiplyScalar(speed * deltaTime);

        this.position.add(this.velocity);
    this.lookAt(dynamicTargetPosition);
    this.camera.position.copy(this.position);

    this.onPositionChange(this.position);
    this.onSpeedChange(speed);
  }

  
  private updateOrbit(deltaTime: number): void {
    if (!this.currentTarget) {
      return;
    }

    const targetPosition = this.currentTarget.position.clone();
    const currentPosition = this.position.clone();

        const distance = currentPosition.distanceTo(targetPosition);
    const orbitSpeed = 0.2 * deltaTime; 
        const orbitAxis = new THREE.Vector3(0, 1, 0); 
        const offset = new THREE.Vector3().subVectors(
      currentPosition,
      targetPosition
    );
    offset.applyAxisAngle(orbitAxis, orbitSpeed);

    this.position.copy(targetPosition).add(offset);

        this.lookAt(targetPosition);

        this.camera.position.copy(this.position);

        this.onPositionChange(this.position);
    this.onSpeedChange(0);   }

  
  private updateFollow(deltaTime: number): void {
    if (!this.currentTarget) {
      return;
    }

    const targetPosition = this.currentTarget.position.clone();

        const followDistance = this.currentTarget.radius * 5;
    const followHeight = this.currentTarget.radius * 2;

        const followOffset = new THREE.Vector3(
      -followDistance,       followHeight,       0     );

            const angle = Date.now() * 0.0001;     const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
    followOffset.applyMatrix4(rotationMatrix);

        const newPosition = targetPosition.clone().add(followOffset);

        this.position.lerp(newPosition, 0.1);

        this.lookAt(targetPosition);

        this.camera.position.copy(this.position);

        this.onPositionChange(this.position);
    this.onSpeedChange(0);   }

  
  private updateWarp(deltaTime: number): void {
        TWEEN.update();
  }

  
  
  private applyGravity(deltaTime: number): void {
    if (!this.settings.inertia || this.mode !== CameraMode.FREE_FLIGHT) {
      return;
    }

    this.acceleration.set(0, 0, 0);

        for (const planet of this.planets) {
      const distance = this.position.distanceTo(planet.position);

                  if (distance > 1e8 || distance < planet.radius * 2) {
        continue;
      }

            const forceMagnitude =
        (G * (this.mass * planet.mass)) / (distance * distance);

            const direction = new THREE.Vector3()
        .subVectors(planet.position, this.position)
        .normalize();

            const force = direction.multiplyScalar(forceMagnitude);

            const acceleration = force.divideScalar(this.mass);

            this.acceleration.add(acceleration);
    }

        this.acceleration.multiplyScalar(0.01);

        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
  }

  
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

  
  public update(deltaTime: number): void {
        if (deltaTime > 1) {
      deltaTime = 0.016;     }

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

            this.camera.position.copy(this.position);

            const closest = this.getClosestPlanet();
      if (closest && closest.distance < closest.planet.radius * 10) {
                if (!this.currentTarget) {
          this.setTarget(closest.planet);
        }
      }
    } catch (error) {
      console.error("Error in camera update:", error);
    }
  }

  
  public setSettings(settings: Partial<CameraSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  
  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  
  public getSpeed(): number {
    return this.speed;
  }

  
  public getMode(): CameraMode {
    return this.mode;
  }

  
  public getTarget(): Planet | null {
    return this.currentTarget;
  }

  
  public isAutopilotActive(): boolean {
    return this.autopilot.active;
  }

  
  public isWarpActive(): boolean {
    return this.warpActive;
  }

  
  public getAutopilotProgress(): number {
    if (!this.autopilot.active || !this.autopilot.target) {
      return 0;
    }

    const initialDistance = this.autopilot.initialDistance;
    if (initialDistance <= 0) {
      return 0;
    }

    const currentDistance = this.position.distanceTo(
      this.autopilot.target.position
    );

        return Math.max(0, Math.min(1, 1 - currentDistance / initialDistance));
  }

  
  public getWarpProgress(): number {
    return this.warpProgress;
  }

  
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

  
  public dispose(): void {
        document.removeEventListener("keydown", this.onKeyDown.bind(this));
    document.removeEventListener("keyup", this.onKeyUp.bind(this));
    document.removeEventListener("mousedown", this.onMouseDown.bind(this));
    document.removeEventListener("mouseup", this.onMouseUp.bind(this));
    document.removeEventListener("mousemove", this.onMouseMove.bind(this));
    document.removeEventListener("wheel", this.onMouseWheel.bind(this));
    document.removeEventListener("contextmenu", (e) => e.preventDefault());
    window.removeEventListener("resize", this.onWindowResize.bind(this));

        if (this.warpTween) {
      this.warpTween.stop();
      this.warpTween = null;
    }
  }
}
