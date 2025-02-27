import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import OrbitalMechanics from "./OrbitalMechanics";

const G = 6.6743e-11; const C = 299792458; 

export default class SpaceTrajectoryCalculator {
    private readonly SIMULATION_STEPS = 2000;
  private readonly SIMULATION_TIME_STEP = 60;   private readonly MAX_TRAJECTORY_POINTS = 500; 
    private readonly MAX_BURN_TIME = 600;   private readonly FUEL_EFFICIENCY = 0.8;   private readonly MAX_ACCELERATION = 50; 
    private readonly RELATIVISTIC_EFFECTS = true;

  
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
        const start = startPosition.clone();
    const target = targetPosition.clone();
    const velocity = startVelocity.clone();

        const directVector = new THREE.Vector3()
      .subVectors(target, start)
      .normalize();

        const path: THREE.Vector3[] = [start.clone()];
    let currentPosition = start.clone();
    let currentVelocity = velocity.clone();
    let totalTime = 0;
    let fuelConsumed = 0;
    let success = false;
    let burnTimeRemaining = this.MAX_BURN_TIME;

        let gravitationalPotential = 0;

        const sun = planets.find((p) => p.name === "Sun");
    const centralMass = sun ? sun.mass : 1.989e30; 
        for (let step = 0; step < this.SIMULATION_STEPS; step++) {
            const distanceToTarget = currentPosition.distanceTo(target);
      if (distanceToTarget < 10000) {
                success = true;
        break;
      }

            const { acceleration, potential } =
        this.calculateGravitationalAcceleration(
          currentPosition,
          currentVelocity,
          shipMass,
          planets
        );

      gravitationalPotential = potential;

            const thrustDirection = this.calculateOptimalThrustDirection(
        currentPosition,
        currentVelocity,
        target,
        planets
      );

            if (burnTimeRemaining > 0) {
                const distanceFactor = Math.min(1, distanceToTarget / 1000000);
        const thrustMagnitude = this.MAX_ACCELERATION * distanceFactor;

                const thrustAcceleration = thrustDirection
          .clone()
          .multiplyScalar(thrustMagnitude);
        acceleration.add(thrustAcceleration);

                const fuelRate =
          thrustMagnitude * shipMass * 0.0001 * this.FUEL_EFFICIENCY;
        fuelConsumed += fuelRate * this.SIMULATION_TIME_STEP;

                burnTimeRemaining -= this.SIMULATION_TIME_STEP;
      }

            if (this.RELATIVISTIC_EFFECTS) {
        this.applyRelativisticCorrections(
          currentPosition,
          currentVelocity,
          acceleration,
          gravitationalPotential,
          this.SIMULATION_TIME_STEP
        );
      }

            currentVelocity.add(
        acceleration.clone().multiplyScalar(this.SIMULATION_TIME_STEP)
      );

            const positionDelta = currentVelocity
        .clone()
        .multiplyScalar(this.SIMULATION_TIME_STEP);
      currentPosition.add(positionDelta);

            if (
        step % Math.ceil(this.SIMULATION_STEPS / this.MAX_TRAJECTORY_POINTS) ===
        0
      ) {
        path.push(currentPosition.clone());
      }

            totalTime += this.SIMULATION_TIME_STEP;

            if (totalTime > 100000) {
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

  
  private calculateGravitationalAcceleration(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    shipMass: number,
    planets: Planet[]
  ): { acceleration: THREE.Vector3; potential: number } {
    const acceleration = new THREE.Vector3(0, 0, 0);
    let totalPotential = 0;

        for (const planet of planets) {
            const distanceVector = new THREE.Vector3().subVectors(
        planet.position,
        position
      );
      const distance = distanceVector.length();

            if (distance > 1e12 || distance < planet.radius) {
        continue;
      }

            const distanceMeters = distance * 1000;

            const forceMagnitude =
        (G * (shipMass * planet.mass)) / (distanceMeters * distanceMeters);

            const direction = distanceVector.normalize();

            const planetAcceleration = direction
        .clone()
        .multiplyScalar(forceMagnitude / shipMass);

            acceleration.add(planetAcceleration);

            totalPotential += (G * planet.mass) / distanceMeters;
    }

    return { acceleration, potential: totalPotential };
  }

  
  private applyRelativisticCorrections(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    acceleration: THREE.Vector3,
    gravitationalPotential: number,
    timeStep: number
  ): void {
        const velocityMagnitude = velocity.length() * 1000; 
        if (velocityMagnitude < 1000) return;

        const gammaFactor =
      1 / Math.sqrt(1 - (velocityMagnitude * velocityMagnitude) / (C * C));

            const gravitationalDilation = 1 - (2 * gravitationalPotential) / (C * C);

        const totalDilation = gammaFactor * gravitationalDilation;

            const perpFactor = 1 / Math.pow(gammaFactor, 3);

            if (gammaFactor > 1.01) {
                  const velocityDir = velocity.clone().normalize();

            const accParallel = velocityDir
        .clone()
        .multiplyScalar(acceleration.dot(velocityDir));
      const accPerp = new THREE.Vector3().subVectors(acceleration, accParallel);

            accPerp.multiplyScalar(perpFactor);

            acceleration.copy(accParallel).add(accPerp);
    }
  }

  
  private calculateOptimalThrustDirection(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    target: THREE.Vector3,
    planets: Planet[]
  ): THREE.Vector3 {
        const directVector = new THREE.Vector3()
      .subVectors(target, position)
      .normalize();

        let strongestGravitySource: Planet | null = null;
    let maxGravityAccel = 0;

    for (const planet of planets) {
      const distance = position.distanceTo(planet.position);
      if (distance < planet.radius * 20) {
                        const gravitationalAccel =
          (G * planet.mass) / (distance * distance * 1e6);         if (gravitationalAccel > maxGravityAccel) {
          maxGravityAccel = gravitationalAccel;
          strongestGravitySource = planet;
        }
      }
    }

        if (strongestGravitySource) {
            const gravityVector = new THREE.Vector3()
        .subVectors(strongestGravitySource.position, position)
        .normalize();

            const angle = directVector.angleTo(gravityVector);

            const orbitSpeed = Math.sqrt(
        (G * strongestGravitySource.mass) /
          (position.distanceTo(strongestGravitySource.position) * 1000)
      );

            if (angle < Math.PI / 2) {
                const swingbyVector = new THREE.Vector3()
          .crossVectors(directVector, gravityVector)
          .normalize();

                const gravityAssistFactor = Math.min(0.6, maxGravityAccel * 1e10);

                        const velocityMag = velocity.length();
        const velocityFactor = Math.min(0.8, velocityMag / 50000);

                directVector.lerp(swingbyVector, gravityAssistFactor * velocityFactor);
        directVector.normalize();
      }
    }

        const velocityMagnitude = velocity.length();
    if (velocityMagnitude > 5000) {
      const velocityDir = velocity.clone().normalize();
                  const inertiaFactor = Math.min(0.9, velocityMagnitude / 100000);
      directVector.lerp(velocityDir, inertiaFactor);
      directVector.normalize();
    }

    return directVector;
  }

  
  public estimateFuelRequirements(
    distance: number,
    shipMass: number,
    targetSpeed: number = 0
  ): number {
        let baseFuel = Math.min(
      shipMass * 0.2,       distance * shipMass * 0.00000001 * (1 / this.FUEL_EFFICIENCY)
    );

        if (targetSpeed > 10000) {
                  const speedInMeters = targetSpeed * 1000;

            const gammaFactor =
        1 / Math.sqrt(1 - (speedInMeters * speedInMeters) / (C * C));

            baseFuel *= gammaFactor;
    }

    return baseFuel;
  }

  
  public estimateTravelTime(
    distance: number,
    initialSpeed: number,
    finalSpeed: number = 0
  ): number {
        const avgSpeed = Math.max(
      initialSpeed,
      Math.min(100000, distance / 1000)     );

        let travelTime = distance / avgSpeed;

        if (avgSpeed > 10000) {
                  const speedInMeters = avgSpeed * 1000;

            const gammaFactor =
        1 / Math.sqrt(1 - (speedInMeters * speedInMeters) / (C * C));

            travelTime /= gammaFactor;
    }

    return travelTime;
  }
}
