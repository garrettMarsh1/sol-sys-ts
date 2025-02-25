// src/app/components/Camera/TrajectoryVisualization.ts
import * as THREE from "three";
import SpaceTrajectoryCalculator from "../Physics/SpaceTrajectoryCalculator";
import { Planet } from "../Interface/PlanetInterface";

/**
 * Visualizes autopilot trajectories in 3D space
 */
export default class TrajectoryVisualization {
  private scene: THREE.Scene;
  private trajectoryCalculator: SpaceTrajectoryCalculator;
  private trajectoryLine: THREE.Line | null = null;
  private waypointMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trajectoryCalculator = new SpaceTrajectoryCalculator();
  }

  /**
   * Calculate and display a trajectory from start to target
   */
  public showTrajectory(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    startVelocity: THREE.Vector3,
    shipMass: number,
    planets: Planet[]
  ): {
    path: THREE.Vector3[];
    estimatedTime: number;
    fuelRequired: number;
    success: boolean;
  } {
    // Clean up previous trajectory visualization
    this.clearTrajectory();

    // Calculate trajectory path
    const trajectory = this.trajectoryCalculator.calculateTrajectory(
      startPosition,
      targetPosition,
      startVelocity,
      shipMass,
      planets
    );

    // Create line geometry for trajectory path
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      trajectory.path
    );

    // Different colors based on success status
    const color = trajectory.success ? 0x00ffff : 0xff7700;

    // Create line material with glowing effect
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 1,
      transparent: true,
      opacity: 0.7,
    });

    // Create line mesh
    this.trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.trajectoryLine);

    // Add waypoint markers along the path
    const waypointCount = Math.min(10, trajectory.path.length);
    const waypointIndices = this.getEvenlySpacedIndices(
      trajectory.path.length,
      waypointCount
    );

    for (const index of waypointIndices) {
      const point = trajectory.path[index];
      const waypointMesh = this.createWaypointMarker(point, color);
      this.waypointMeshes.push(waypointMesh);
      this.scene.add(waypointMesh);
    }

    return trajectory;
  }

  /**
   * Create a waypoint marker mesh at the given position
   */
  private createWaypointMarker(
    position: THREE.Vector3,
    color: number
  ): THREE.Mesh {
    // Create a small sphere for the waypoint
    const geometry = new THREE.SphereGeometry(1000, 8, 8); // 1000km size for visibility
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    return mesh;
  }

  /**
   * Get evenly spaced indices from an array
   */
  private getEvenlySpacedIndices(length: number, count: number): number[] {
    const indices: number[] = [];

    if (count >= length) {
      // If requesting more points than available, return all indices
      for (let i = 0; i < length; i++) {
        indices.push(i);
      }
    } else {
      // Calculate step size for even spacing
      const step = (length - 1) / (count - 1);

      for (let i = 0; i < count; i++) {
        const index = Math.round(i * step);
        indices.push(index);
      }
    }

    return indices;
  }

  /**
   * Update the trajectory visualization with the ship's progress
   */
  public updateProgress(progress: number): void {
    if (!this.trajectoryLine || this.waypointMeshes.length === 0) {
      return;
    }

    // Update opacity of completed segments
    const material = this.trajectoryLine.material as THREE.LineBasicMaterial;

    // Fade out completed parts of the trajectory
    for (let i = 0; i < this.waypointMeshes.length; i++) {
      const waypointProgress = i / (this.waypointMeshes.length - 1);

      if (waypointProgress < progress) {
        // Make passed waypoints fade out
        this.waypointMeshes[i].visible = false;
      } else {
        // Make upcoming waypoints visible
        this.waypointMeshes[i].visible = true;

        // Closest upcoming waypoint pulses
        if (
          waypointProgress >= progress &&
          (i === 0 ||
            (i > 0 && (i - 1) / (this.waypointMeshes.length - 1) < progress))
        ) {
          const pulseIntensity = (Math.sin(Date.now() * 0.005) + 1) / 2; // 0-1 pulse
          const mesh = this.waypointMeshes[i];
          const waypointMaterial = mesh.material as THREE.MeshBasicMaterial;
          waypointMaterial.opacity = 0.5 + 0.5 * pulseIntensity;

          // Scale up the next waypoint slightly for visibility
          const pulseScale = 1 + 0.2 * pulseIntensity;
          mesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
      }
    }
  }

  /**
   * Clear the current trajectory visualization
   */
  public clearTrajectory(): void {
    // Remove trajectory line
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      (this.trajectoryLine.material as THREE.Material).dispose();
      this.trajectoryLine = null;
    }

    // Remove waypoint meshes
    for (const mesh of this.waypointMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }

    this.waypointMeshes = [];
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.clearTrajectory();
  }
}
