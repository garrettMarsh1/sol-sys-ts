import * as THREE from "three";
import SpaceTrajectoryCalculator from "../Physics/SpaceTrajectoryCalculator";
import { Planet } from "../Interface/PlanetInterface";


export default class TrajectoryVisualization {
  private scene: THREE.Scene;
  private trajectoryCalculator: SpaceTrajectoryCalculator;
  private trajectoryLine: THREE.Line | null = null;
  private waypointMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trajectoryCalculator = new SpaceTrajectoryCalculator();
  }

  
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
        this.clearTrajectory();

        const trajectory = this.trajectoryCalculator.calculateTrajectory(
      startPosition,
      targetPosition,
      startVelocity,
      shipMass,
      planets
    );

        const validPath = trajectory.path.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
    );

    if (validPath.length < 2) {
      console.warn("Not enough valid points to create trajectory");
      return trajectory;
    }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(validPath);

        const color = trajectory.success ? 0x00ffff : 0xff7700;

        const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 1,
      transparent: true,
      opacity: 0.7,
    });

        this.trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.trajectoryLine);

        if (validPath.length >= 3) {
            const waypointCount = Math.min(10, validPath.length);
      const waypointIndices = this.getEvenlySpacedIndices(
        validPath.length,
        waypointCount
      );

      for (const index of waypointIndices) {
        const point = validPath[index];
        const waypointMesh = this.createWaypointMarker(point, color);
        this.waypointMeshes.push(waypointMesh);
        this.scene.add(waypointMesh);
      }
    }

    return trajectory;
  }

  
  private createWaypointMarker(
    position: THREE.Vector3,
    color: number
  ): THREE.Mesh {
        const geometry = new THREE.SphereGeometry(1000, 8, 8);     const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    return mesh;
  }

  
  private getEvenlySpacedIndices(length: number, count: number): number[] {
    const indices: number[] = [];

    if (count >= length) {
            for (let i = 0; i < length; i++) {
        indices.push(i);
      }
    } else {
            const step = (length - 1) / (count - 1);

      for (let i = 0; i < count; i++) {
        const index = Math.round(i * step);
        indices.push(index);
      }
    }

    return indices;
  }

  
  public updateProgress(progress: number): void {
    if (!this.trajectoryLine || this.waypointMeshes.length === 0) {
      return;
    }

        const material = this.trajectoryLine.material as THREE.LineBasicMaterial;

        for (let i = 0; i < this.waypointMeshes.length; i++) {
      const waypointProgress = i / (this.waypointMeshes.length - 1);

      if (waypointProgress < progress) {
                this.waypointMeshes[i].visible = false;
      } else {
                this.waypointMeshes[i].visible = true;

                if (
          waypointProgress >= progress &&
          (i === 0 ||
            (i > 0 && (i - 1) / (this.waypointMeshes.length - 1) < progress))
        ) {
          const pulseIntensity = (Math.sin(Date.now() * 0.005) + 1) / 2;           const mesh = this.waypointMeshes[i];
          const waypointMaterial = mesh.material as THREE.MeshBasicMaterial;
          waypointMaterial.opacity = 0.5 + 0.5 * pulseIntensity;

                    const pulseScale = 1 + 0.2 * pulseIntensity;
          mesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
      }
    }
  }

  
  public clearTrajectory(): void {
        if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      (this.trajectoryLine.material as THREE.Material).dispose();
      this.trajectoryLine = null;
    }

        for (const mesh of this.waypointMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }

    this.waypointMeshes = [];
  }

  
  public dispose(): void {
    this.clearTrajectory();
  }
}