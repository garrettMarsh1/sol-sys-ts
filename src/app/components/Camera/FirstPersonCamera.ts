import InputController, { KEYS } from "../../../../public/Utils/InputController";
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
  private rollSpeed_: number;
  private enableMouseLook_: boolean;
  private mouseLookSensitivity_: number;
  private dampingFactor_: number;
  private following: boolean; // Add this flag

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
    this.rollSpeed_ = 2;
    this.enableMouseLook_ = false;
    this.mouseLookSensitivity_ = 0.001;
    this.dampingFactor_ = 0.95; // Damping factor for inertia
    this.following = false; // Initialize the flag
    this.addEventListeners_();
  }

  setTarget(newTarget: THREE.Object3D) {
    this.target = newTarget;
    console.log("Target set to:", newTarget.name);
  }

  setFollowing(following: boolean) {
    this.following = following;
  }

  update(timeElapsedS: number) {
    this.updateTranslation_(timeElapsedS);
    this.input_.update(timeElapsedS);

    if (this.following && this.target) {
      const targetPosition = this.target.position.clone();
      const offset = new THREE.Vector3(0, 0, -this.followDistance);
      offset.applyQuaternion(this.rotation_);
      targetPosition.add(offset);
      this.translation_.lerp(targetPosition, 0.1);
      this.camera.lookAt(this.target.position);
    }
    this.camera.quaternion.copy(this.rotation_);
    this.camera.position.copy(this.translation_);
  }

  private updateTranslation_(timeElapsedS: number) {
    if (this.following) return; // Skip updating translation when following

    const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
    const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);
    const upVelocity = (this.input_.key(KEYS.q) ? 1 : 0) + (this.input_.key(KEYS.e) ? -1 : 0);
    const rollVelocity = (this.input_.key(KEYS.z) ? 1 : 0) + (this.input_.key(KEYS.c) ? -1 : 0);

    let speedMultiplier = 1;
    if (this.input_.key(KEYS.w) && this.input_.key(KEYS.shift)) {
      speedMultiplier = 5;
    }

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation_);
    forward.multiplyScalar(forwardVelocity * this.movementSpeed_ * speedMultiplier * timeElapsedS);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(this.rotation_);
    left.multiplyScalar(strafeVelocity * this.movementSpeed_ * timeElapsedS);

    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(this.rotation_);
    up.multiplyScalar(upVelocity * this.movementSpeed_ * timeElapsedS);

    const roll = new THREE.Quaternion();
    roll.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollVelocity * this.rollSpeed_ * timeElapsedS);
    this.rotation_.multiply(roll);

    this.velocity_.add(forward).add(left).add(up);
    this.velocity_.multiplyScalar(this.dampingFactor_); // Apply damping

    this.translation_.add(this.velocity_);
  }

  private addEventListeners_() {
    document.addEventListener('mousemove', this.onMouseMove_.bind(this));
    document.addEventListener('mousedown', this.onMouseDown_.bind(this));
    document.addEventListener('mouseup', this.onMouseUp_.bind(this));
  }

  private onMouseMove_(event: MouseEvent) {
    if (this.enableMouseLook_) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.phi_ -= movementX * this.mouseLookSensitivity_;
      this.theta_ = clamp(this.theta_ - movementY * this.mouseLookSensitivity_, -Math.PI / 2, Math.PI / 2);

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

  private onMouseDown_() {
    this.enableMouseLook_ = true;
  }

  private onMouseUp_() {
    this.enableMouseLook_ = false;
  }
}
