// src/app/components/Physics/SpaceTrajectoryCalculator.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";

// Physics constants
const G = 6.6743e-11; // Universal gravitational constant (m^3 kg^-1 s^-2)

/**
 * Calculates space trajectories for autopilot navigation
 * with realistic gravitational influences
 */
export default class SpaceTrajectoryCalculator {
  // Simulation steps
  private readonly SIMULATION_STEPS = 1000;
  private readonly SIMULATION_TIME_STEP = 60; // Seconds per step
  private readonly MAX_TRAJECTORY_POINTS = 500; // Limit for performance

  // Physics parameters
  private readonly MAX_BURN_TIME = 600; // Maximum burn time in seconds
  private readonly FUEL_EFFICIENCY = 0.8; // Modifier for fuel efficiency (0-1)
  private readonly MAX_ACCELERATION = 50; // Max ship acceleration in m/s²

  /**
   * Calculate a trajectory path between two points in space
   * considering gravitational influence of planets
   */
  public calculateTrajectory(
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
    // Deep copy all vectors to prevent modifications
    const start = startPosition.clone();
    const target = targetPosition.clone();
    const velocity = startVelocity.clone();

    // Calculate direct vector to target
    const directVector = new THREE.Vector3()
      .subVectors(target, start)
      .normalize();

    // Initial simulation parameters
    const path: THREE.Vector3[] = [start.clone()];
    let currentPosition = start.clone();
    let currentVelocity = velocity.clone();
    let totalTime = 0;
    let fuelConsumed = 0;
    let success = false;
    let burnTimeRemaining = this.MAX_BURN_TIME;

    // Simulate trajectory with gravitational influences
    for (let step = 0; step < this.SIMULATION_STEPS; step++) {
      // Check if we've reached the target
      const distanceToTarget = currentPosition.distanceTo(target);
      if (distanceToTarget < 10000) {
        // 10km arrival threshold
        success = true;
        break;
      }

      // Calculate gravitational forces
      const acceleration = this.calculateGravitationalAcceleration(
        currentPosition,
        shipMass,
        planets
      );

      // Calculate thrust direction (toward target with some lead)
      const thrustDirection = this.calculateOptimalThrustDirection(
        currentPosition,
        currentVelocity,
        target,
        planets
      );

      // Apply thrust if burn time remaining
      if (burnTimeRemaining > 0) {
        // Calculate ideal thrust based on remaining distance
        const distanceFactor = Math.min(1, distanceToTarget / 1000000);
        const thrustMagnitude = this.MAX_ACCELERATION * distanceFactor;

        // Apply thrust acceleration
        const thrustAcceleration =
          thrustDirection.multiplyScalar(thrustMagnitude);
        acceleration.add(thrustAcceleration);

        // Track fuel consumption (simplified)
        const fuelRate =
          thrustMagnitude * shipMass * 0.0001 * this.FUEL_EFFICIENCY;
        fuelConsumed += fuelRate * this.SIMULATION_TIME_STEP;

        // Decrease remaining burn time
        burnTimeRemaining -= this.SIMULATION_TIME_STEP;
      }

      // Update velocity with acceleration
      currentVelocity.add(
        acceleration.multiplyScalar(this.SIMULATION_TIME_STEP)
      );

      // Update position with velocity
      const positionDelta = currentVelocity
        .clone()
        .multiplyScalar(this.SIMULATION_TIME_STEP);
      currentPosition.add(positionDelta);

      // Add point to path (downsample for performance)
      if (
        step % Math.ceil(this.SIMULATION_STEPS / this.MAX_TRAJECTORY_POINTS) ===
        0
      ) {
        path.push(currentPosition.clone());
      }

      // Update total time
      totalTime += this.SIMULATION_TIME_STEP;

      // Break if taking too long
      if (totalTime > 100000) {
        // ~28 hours max simulation time
        break;
      }
    }

    return {
      path,
      estimatedTime: totalTime,
      fuelRequired: fuelConsumed,
      success,
    };
  }

  /**
   * Calculate the net gravitational acceleration at a given position
   */
  private calculateGravitationalAcceleration(
    position: THREE.Vector3,
    shipMass: number,
    planets: Planet[]
  ): THREE.Vector3 {
    const acceleration = new THREE.Vector3(0, 0, 0);

    // Sum forces from all planets
    for (const planet of planets) {
      // Calculate distance vector and magnitude
      const distanceVector = new THREE.Vector3().subVectors(
        planet.position,
        position
      );
      const distance = distanceVector.length();

      // Skip if too far for meaningful gravity or too close (inside planet)
      if (distance > 1e9 || distance < planet.radius) {
        continue;
      }

      // Calculate force magnitude: F = G * (m1 * m2) / r²
      const forceMagnitude =
        (G * (shipMass * planet.mass)) / (distance * distance);

      // Direction toward planet
      const direction = distanceVector.normalize();

      // Calculate acceleration: a = F / m
      const planetAcceleration = direction.multiplyScalar(
        forceMagnitude / shipMass
      );

      // Add to total acceleration
      acceleration.add(planetAcceleration);
    }

    return acceleration;
  }

  /**
   * Calculate the optimal thrust direction considering future positions
   */
  private calculateOptimalThrustDirection(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    target: THREE.Vector3,
    planets: Planet[]
  ): THREE.Vector3 {
    // Simple implementation: direct course to target with slight lead
    const directVector = new THREE.Vector3()
      .subVectors(target, position)
      .normalize();

    // Find dominant gravitational influence
    let strongestGravitySource: Planet | null = null;
    let maxGravityAccel = 0;

    for (const planet of planets) {
      const distance = position.distanceTo(planet.position);
      if (distance < planet.radius * 10) {
        // Close to a planet
        const gravitationalAccel = (G * planet.mass) / (distance * distance);
        if (gravitationalAccel > maxGravityAccel) {
          maxGravityAccel = gravitationalAccel;
          strongestGravitySource = planet;
        }
      }
    }

    // If near a major gravity source, adjust course to compensate
    if (strongestGravitySource) {
      // Simplified gravity assist calculation
      const gravityVector = new THREE.Vector3()
        .subVectors(strongestGravitySource.position, position)
        .normalize();

      // Angle between direct path and gravity source
      const angle = directVector.angleTo(gravityVector);

      // If gravity is pulling us off course, compensate
      if (angle > Math.PI / 6) {
        // Create a compensating vector (perpendicular to gravity)
        const compensationVector = new THREE.Vector3()
          .crossVectors(directVector, gravityVector)
          .normalize();

        // Blend direct vector with compensation
        directVector.lerp(compensationVector, 0.3);
        directVector.normalize();
      }
    }

    // Account for current velocity
    if (velocity.length() > 1000) {
      const velocityDir = velocity.clone().normalize();
      // Blend current direction with target direction
      directVector.lerp(velocityDir, 0.2);
      directVector.normalize();
    }

    return directVector;
  }

  /**
   * Estimate fuel requirements for a journey
   */
  public estimateFuelRequirements(distance: number, shipMass: number): number {
    // Simplified fuel calculation
    return Math.min(
      shipMass * 0.2, // Max 20% of ship mass as fuel
      distance * shipMass * 0.00000001 * (1 / this.FUEL_EFFICIENCY)
    );
  }

  /**
   * Estimate time required for a journey
   */
  public estimateTravelTime(distance: number, initialSpeed: number): number {
    // Average speed assuming acceleration and deceleration phases
    const avgSpeed = Math.max(
      initialSpeed,
      Math.min(100000, distance / 1000) // Cap max speed at 100km/s
    );

    // Simple time estimate
    return distance / avgSpeed;
  }
}
