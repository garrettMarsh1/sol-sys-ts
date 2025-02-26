// src/app/components/Physics/SpaceTrajectoryCalculator.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import OrbitalMechanics from "./OrbitalMechanics";

// Physics constants
const G = 6.6743e-11; // Universal gravitational constant (m^3 kg^-1 s^-2)
const C = 299792458; // Speed of light (m/s)

/**
 * Calculates space trajectories for autopilot navigation
 * with realistic gravitational influences including relativistic effects
 */
export default class SpaceTrajectoryCalculator {
  // Simulation steps
  private readonly SIMULATION_STEPS = 2000;
  private readonly SIMULATION_TIME_STEP = 60; // Seconds per step
  private readonly MAX_TRAJECTORY_POINTS = 500; // Limit for performance

  // Physics parameters
  private readonly MAX_BURN_TIME = 600; // Maximum burn time in seconds
  private readonly FUEL_EFFICIENCY = 0.8; // Modifier for fuel efficiency (0-1)
  private readonly MAX_ACCELERATION = 50; // Max ship acceleration in m/s²

  // Relativistic flag - when true, includes relativistic corrections
  private readonly RELATIVISTIC_EFFECTS = true;

  /**
   * Calculate a trajectory path between two points in space
   * considering gravitational influence of planets with relativistic corrections
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

    // Store gravitational potential for relativistic calculations
    let gravitationalPotential = 0;

    // Find the Sun for relativistic calculations
    const sun = planets.find((p) => p.name === "Sun");
    const centralMass = sun ? sun.mass : 1.989e30; // Default to Sun's mass if not found

    // Simulate trajectory with gravitational influences
    for (let step = 0; step < this.SIMULATION_STEPS; step++) {
      // Check if we've reached the target
      const distanceToTarget = currentPosition.distanceTo(target);
      if (distanceToTarget < 10000) {
        // 10km arrival threshold
        success = true;
        break;
      }

      // Calculate gravitational forces with relativistic corrections if enabled
      const { acceleration, potential } =
        this.calculateGravitationalAcceleration(
          currentPosition,
          currentVelocity,
          shipMass,
          planets
        );

      gravitationalPotential = potential;

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
        const thrustAcceleration = thrustDirection
          .clone()
          .multiplyScalar(thrustMagnitude);
        acceleration.add(thrustAcceleration);

        // Track fuel consumption (simplified)
        const fuelRate =
          thrustMagnitude * shipMass * 0.0001 * this.FUEL_EFFICIENCY;
        fuelConsumed += fuelRate * this.SIMULATION_TIME_STEP;

        // Decrease remaining burn time
        burnTimeRemaining -= this.SIMULATION_TIME_STEP;
      }

      // Apply relativistic corrections to velocity if enabled
      if (this.RELATIVISTIC_EFFECTS) {
        this.applyRelativisticCorrections(
          currentPosition,
          currentVelocity,
          acceleration,
          gravitationalPotential,
          this.SIMULATION_TIME_STEP
        );
      }

      // Update velocity with acceleration
      currentVelocity.add(
        acceleration.clone().multiplyScalar(this.SIMULATION_TIME_STEP)
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
   * with option for relativistic corrections
   */
  private calculateGravitationalAcceleration(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    shipMass: number,
    planets: Planet[]
  ): { acceleration: THREE.Vector3; potential: number } {
    const acceleration = new THREE.Vector3(0, 0, 0);
    let totalPotential = 0;

    // Sum forces from all planets
    for (const planet of planets) {
      // Calculate distance vector and magnitude
      const distanceVector = new THREE.Vector3().subVectors(
        planet.position,
        position
      );
      const distance = distanceVector.length();

      // Skip if too far for meaningful gravity or too close (inside planet)
      if (distance > 1e12 || distance < planet.radius) {
        continue;
      }

      // Convert distance to meters for physics calculations
      const distanceMeters = distance * 1000;

      // Calculate Newtonian force magnitude: F = G * (m1 * m2) / r²
      const forceMagnitude =
        (G * (shipMass * planet.mass)) / (distanceMeters * distanceMeters);

      // Direction toward planet
      const direction = distanceVector.normalize();

      // Calculate acceleration: a = F / m
      const planetAcceleration = direction
        .clone()
        .multiplyScalar(forceMagnitude / shipMass);

      // Add to total acceleration
      acceleration.add(planetAcceleration);

      // Calculate gravitational potential for relativistic corrections
      totalPotential += (G * planet.mass) / distanceMeters;
    }

    return { acceleration, potential: totalPotential };
  }

  /**
   * Apply relativistic corrections to motion
   */
  private applyRelativisticCorrections(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    acceleration: THREE.Vector3,
    gravitationalPotential: number,
    timeStep: number
  ): void {
    // 1. Time dilation due to velocity (special relativity)
    const velocityMagnitude = velocity.length() * 1000; // km/s to m/s

    // Skip corrections for very small velocities to avoid numerical issues
    if (velocityMagnitude < 1000) return;

    // Lorentz factor: γ = 1/sqrt(1-v²/c²)
    const gammaFactor =
      1 / Math.sqrt(1 - (velocityMagnitude * velocityMagnitude) / (C * C));

    // 2. Gravitational time dilation (general relativity)
    // Time passes slower in stronger gravitational fields
    const gravitationalDilation = 1 - (2 * gravitationalPotential) / (C * C);

    // 3. Combined time dilation factor
    const totalDilation = gammaFactor * gravitationalDilation;

    // 4. Apply relativistic mass increase (affects acceleration)
    // F = ma becomes F = γ³ma for motion perpendicular to force
    const perpFactor = 1 / Math.pow(gammaFactor, 3);

    // Scale acceleration by relativistic factor
    // This is a simplified model - full GR would require tensor calculus
    if (gammaFactor > 1.01) {
      // Only apply for significant relativistic effects
      // Create a local coordinate system
      const velocityDir = velocity.clone().normalize();

      // Decompose acceleration into parallel and perpendicular components
      const accParallel = velocityDir
        .clone()
        .multiplyScalar(acceleration.dot(velocityDir));
      const accPerp = new THREE.Vector3().subVectors(acceleration, accParallel);

      // Apply relativistic correction only to perpendicular component
      accPerp.multiplyScalar(perpFactor);

      // Recombine
      acceleration.copy(accParallel).add(accPerp);
    }
  }

  /**
   * Calculate the optimal thrust direction considering future positions
   * and gravitational assists
   */
  private calculateOptimalThrustDirection(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    target: THREE.Vector3,
    planets: Planet[]
  ): THREE.Vector3 {
    // Base vector points directly to target
    const directVector = new THREE.Vector3()
      .subVectors(target, position)
      .normalize();

    // Find dominant gravitational influence
    let strongestGravitySource: Planet | null = null;
    let maxGravityAccel = 0;

    for (const planet of planets) {
      const distance = position.distanceTo(planet.position);
      if (distance < planet.radius * 20) {
        // Expanded sphere of influence
        // Close to a planet
        const gravitationalAccel =
          (G * planet.mass) / (distance * distance * 1e6); // km to m conversion
        if (gravitationalAccel > maxGravityAccel) {
          maxGravityAccel = gravitationalAccel;
          strongestGravitySource = planet;
        }
      }
    }

    // If near a major gravity source, adjust course for gravity assist
    if (strongestGravitySource) {
      // Get gravity vector
      const gravityVector = new THREE.Vector3()
        .subVectors(strongestGravitySource.position, position)
        .normalize();

      // Angle between direct path and gravity source
      const angle = directVector.angleTo(gravityVector);

      // Calculate orbital speed around the gravity source
      const orbitSpeed = Math.sqrt(
        (G * strongestGravitySource.mass) /
          (position.distanceTo(strongestGravitySource.position) * 1000)
      );

      // If we're approaching the planet (not leaving it)
      if (angle < Math.PI / 2) {
        // Create vector perpendicular to gravity and direct path for swing-by
        const swingbyVector = new THREE.Vector3()
          .crossVectors(directVector, gravityVector)
          .normalize();

        // Scale effect by gravity strength and angle
        const gravityAssistFactor = Math.min(0.6, maxGravityAccel * 1e10);

        // Calculate a blended direction that uses gravity assist
        // Higher velocity = more tendency to use gravity assist
        const velocityMag = velocity.length();
        const velocityFactor = Math.min(0.8, velocityMag / 50000);

        // Blend the direct path with the swing-by path
        directVector.lerp(swingbyVector, gravityAssistFactor * velocityFactor);
        directVector.normalize();
      }
    }

    // Account for current velocity - higher velocity means less steering authority
    const velocityMagnitude = velocity.length();
    if (velocityMagnitude > 5000) {
      const velocityDir = velocity.clone().normalize();
      // Blend current direction with target direction
      // The higher the velocity, the less we can deviate from current direction
      const inertiaFactor = Math.min(0.9, velocityMagnitude / 100000);
      directVector.lerp(velocityDir, inertiaFactor);
      directVector.normalize();
    }

    return directVector;
  }

  /**
   * Estimate fuel requirements for a journey with relativistic corrections
   */
  public estimateFuelRequirements(
    distance: number,
    shipMass: number,
    targetSpeed: number = 0
  ): number {
    // Base fuel calculation
    let baseFuel = Math.min(
      shipMass * 0.2, // Max 20% of ship mass as fuel
      distance * shipMass * 0.00000001 * (1 / this.FUEL_EFFICIENCY)
    );

    // If high speeds are involved, apply relativistic corrections
    if (targetSpeed > 10000) {
      // km/s
      // Converting to m/s for calculations
      const speedInMeters = targetSpeed * 1000;

      // Relativistic mass increase factor
      const gammaFactor =
        1 / Math.sqrt(1 - (speedInMeters * speedInMeters) / (C * C));

      // Additional fuel needed due to relativistic mass increase
      baseFuel *= gammaFactor;
    }

    return baseFuel;
  }

  /**
   * Estimate time required for a journey with relativistic effects
   */
  public estimateTravelTime(
    distance: number,
    initialSpeed: number,
    finalSpeed: number = 0
  ): number {
    // Average speed calculation (assuming acceleration and deceleration)
    const avgSpeed = Math.max(
      initialSpeed,
      Math.min(100000, distance / 1000) // Cap max speed at 100km/s
    );

    // Simple time estimate for non-relativistic speeds
    let travelTime = distance / avgSpeed;

    // Add relativistic time dilation for high speeds
    if (avgSpeed > 10000) {
      // km/s
      // Convert to m/s for calculations
      const speedInMeters = avgSpeed * 1000;

      // Lorentz factor: γ = 1/sqrt(1-v²/c²)
      const gammaFactor =
        1 / Math.sqrt(1 - (speedInMeters * speedInMeters) / (C * C));

      // Proper time (experienced by traveler) = coordinate time / gamma
      travelTime /= gammaFactor;
    }

    return travelTime;
  }
}
