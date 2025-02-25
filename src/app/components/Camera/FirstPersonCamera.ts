import InputController, {
  KEYS,
} from "../../../../public/Utils/InputController";
import * as THREE from "three";

export function clamp(x: number, a: number, b: number): number {
  return Math.min(Math.max(x, a), b);
}

export default class FirstPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private input_: InputController;
  private rotation_: THREE.Quaternion;
  public translation_: THREE.Vector3;
  private velocity_: THREE.Vector3;
  private phi_: number;
  private theta_: number;
  private objects_: THREE.Object3D[];
  private target: THREE.Object3D | null;
  private followDistance: number;
  private movementSpeed_: number;
  private maxSpeed_: number;
  private rollSpeed_: number;
  private enableMouseLook_: boolean;
  private mouseLookSensitivity_: number;
  private dampingFactor_: number;
  private following: boolean;
  private cameraMode: "fps" | "follow" | "orbit";
  private inertia_: boolean;
  private orbitSpeed_: number;
  private orbitAngle_: number;
  private minDistance_: number;
  private maxDistance_: number;
  private currentZoomDistance_: number;
  private useBoost_: boolean;
  private boostMultiplier_: number;

  constructor(camera: THREE.PerspectiveCamera, objects: THREE.Object3D[]) {
    this.camera = camera;
    this.input_ = new InputController();
    this.rotation_ = new THREE.Quaternion();
    this.translation_ = new THREE.Vector3(147099221.74991804 + 10000, 0, 0);
    this.velocity_ = new THREE.Vector3();
    this.phi_ = 0;
    this.theta_ = 0;
    this.objects_ = objects;
    this.target = null;
    this.followDistance = 10000;
    this.movementSpeed_ = 100;
    this.maxSpeed_ = 1000000;
    this.rollSpeed_ = 2;
    this.enableMouseLook_ = false;
    this.mouseLookSensitivity_ = 0.001;
    this.dampingFactor_ = 0.95;
    this.following = false;
    this.cameraMode = "fps";
    this.inertia_ = true;
    this.orbitSpeed_ = 0.1;
    this.orbitAngle_ = 0;
    this.minDistance_ = 1000;
    this.maxDistance_ = 100000;
    this.currentZoomDistance_ = 10000;
    this.useBoost_ = false;
    this.boostMultiplier_ = 5;
    this.addEventListeners_();
  }

  setTarget(newTarget: THREE.Object3D) {
    this.target = newTarget;
    console.log("Target set to:", newTarget.name);
  }

  setFollowing(following: boolean) {
    this.following = following;
  }

  setCameraMode(mode: "fps" | "follow" | "orbit") {
    this.cameraMode = mode;

    if (mode === "fps") {
      this.following = false;
    }
  }

  setMovementSpeed(speed: number) {
    this.movementSpeed_ = speed;
  }

  setZoomDistance(distance: number) {
    this.currentZoomDistance_ = clamp(
      distance,
      this.minDistance_,
      this.maxDistance_
    );
  }

  adjustZoomDistance(delta: number) {
    this.currentZoomDistance_ = clamp(
      this.currentZoomDistance_ + delta,
      this.minDistance_,
      this.maxDistance_
    );
  }

  update(timeElapsedS: number) {
    this.updateInput_();
    this.updateTranslation_(timeElapsedS);
    this.input_.update(timeElapsedS);

    if (this.following && this.target) {
      if (this.cameraMode === "follow") {
        this.updateFollowMode_(timeElapsedS);
      } else if (this.cameraMode === "orbit") {
        this.updateOrbitMode_(timeElapsedS);
      }
    }

    this.camera.quaternion.copy(this.rotation_);
    this.camera.position.copy(this.translation_);
  }

  private updateInput_() {
    // Check for boost
    this.useBoost_ = this.input_.key(KEYS.shift);

    // Update zoom with mouse wheel
    // Note: This would require extending the InputController to track wheel events
  }

  private updateFollowMode_(timeElapsedS: number) {
    if (!this.target) return;

    const targetPosition = this.target.position.clone();
    const offset = new THREE.Vector3(0, 0, -this.currentZoomDistance_);
    offset.applyQuaternion(this.rotation_);
    targetPosition.add(offset);
    this.translation_.lerp(targetPosition, 0.1);
    this.camera.lookAt(this.target.position);
  }

  private updateOrbitMode_(timeElapsedS: number) {
    if (!this.target) return;

    const targetPosition = this.target.position.clone();

    // Update orbit angle
    this.orbitAngle_ += this.orbitSpeed_ * timeElapsedS;

    // Calculate position on orbit circle
    const x =
      targetPosition.x + Math.cos(this.orbitAngle_) * this.currentZoomDistance_;
    const z =
      targetPosition.z + Math.sin(this.orbitAngle_) * this.currentZoomDistance_;
    const y = targetPosition.y + this.currentZoomDistance_ * 0.3; // Slightly above orbit plane

    // Set position and look at target
    this.translation_.set(x, y, z);
    this.camera.lookAt(targetPosition);
  }

  private updateTranslation_(timeElapsedS: number) {
    if (
      this.following &&
      (this.cameraMode === "follow" || this.cameraMode === "orbit")
    )
      return;

    const forwardVelocity =
      (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
    const strafeVelocity =
      (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);
    const upVelocity =
      (this.input_.key(KEYS.q) ? 1 : 0) + (this.input_.key(KEYS.e) ? -1 : 0);
    const rollVelocity =
      (this.input_.key(KEYS.z) ? 1 : 0) + (this.input_.key(KEYS.c) ? -1 : 0);

    // Apply boost if shift is held
    let speedMultiplier = this.useBoost_ ? this.boostMultiplier_ : 1;

    // Calculate speed based on distance from origin to simulate a sense of scale
    const distanceFromOrigin = this.translation_.length();
    const adaptiveSpeed =
      this.movementSpeed_ * Math.max(1, distanceFromOrigin / 1000000);
    const clampedSpeed = Math.min(adaptiveSpeed, this.maxSpeed_);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation_);
    forward.multiplyScalar(
      forwardVelocity * clampedSpeed * speedMultiplier * timeElapsedS
    );

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(this.rotation_);
    left.multiplyScalar(strafeVelocity * clampedSpeed * timeElapsedS);

    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(this.rotation_);
    up.multiplyScalar(upVelocity * clampedSpeed * timeElapsedS);

    const roll = new THREE.Quaternion();
    roll.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      rollVelocity * this.rollSpeed_ * timeElapsedS
    );
    this.rotation_.multiply(roll);

    // Add all movements to velocity
    this.velocity_.add(forward).add(left).add(up);

    // Apply inertia/damping
    if (this.inertia_) {
      this.velocity_.multiplyScalar(this.dampingFactor_);
    } else if (
      forwardVelocity === 0 &&
      strafeVelocity === 0 &&
      upVelocity === 0
    ) {
      // If no input and no inertia, stop immediately
      this.velocity_.set(0, 0, 0);
    }

    // Apply velocity to position
    this.translation_.add(this.velocity_);
  }

  private addEventListeners_() {
    document.addEventListener("mousemove", this.onMouseMove_.bind(this));
    document.addEventListener("mousedown", this.onMouseDown_.bind(this));
    document.addEventListener("mouseup", this.onMouseUp_.bind(this));
    document.addEventListener("wheel", this.onMouseWheel_.bind(this));
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private onMouseMove_(event: MouseEvent) {
    if (this.enableMouseLook_) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.phi_ -= movementX * this.mouseLookSensitivity_;
      this.theta_ = clamp(
        this.theta_ - movementY * this.mouseLookSensitivity_,
        -Math.PI / 2,
        Math.PI / 2
      );

      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
      const qz = new THREE.Quaternion();
      qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

      const q = new THREE.Quaternion();
      q.multiply(qx);
      q.multiply(qz);

      this.rotation_.copy(q);
    }
  }

  private onMouseDown_(event: MouseEvent) {
    if (event.button === 0) {
      // Left mouse button
      this.enableMouseLook_ = true;
    }
  }

  private onMouseUp_(event: MouseEvent) {
    if (event.button === 0) {
      // Left mouse button
      this.enableMouseLook_ = false;
    }
  }

  private onMouseWheel_(event: WheelEvent) {
    // Zoom in/out when in follow or orbit mode
    if (
      this.following &&
      (this.cameraMode === "follow" || this.cameraMode === "orbit")
    ) {
      // Delta is positive when scrolling up/away, negative when scrolling down/toward
      const zoomDelta = event.deltaY * 0.1;
      this.adjustZoomDistance(zoomDelta);
    }
  }

  // Get current velocity magnitude (useful for UI)
  getVelocityMagnitude(): number {
    return this.velocity_.length();
  }
}
