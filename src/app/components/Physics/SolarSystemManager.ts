// src/app/components/Physics/SolarSystemManager.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import AstronomicalTime from "./AstronomicalTime";
import OrbitalMechanics from "./OrbitalMechanics";

/**
 * Manages the entire solar system with scientifically accurate physics
 * Coordinates time, updates planetary positions, and applies physical effects
 */
export default class SolarSystemManager {
  // Planets in the solar system
  private planets: Planet[] = [];

  // Astronomical time tracker
  private time: AstronomicalTime;

  // Physics simulation options
  private useKeplerianOrbits: boolean = false;
  private useNBodyPhysics: boolean = true;
  private useRelativisticEffects: boolean = true;

  // Reference to the Sun (for calculations)
  private sun: Planet | null = null;

  // Visualization options
  private showOrbits: boolean = false;
  private orbitLines: THREE.Line[] = [];
  private scene: THREE.Scene;

  /**
   * Create a new solar system manager
   * @param scene THREE.js scene for visualization
   * @param initialDate Optional starting date
   */
  constructor(scene: THREE.Scene, initialDate: Date = new Date()) {
    this.scene = scene;
    this.time = new AstronomicalTime(initialDate);
  }

  /**
   * Add a planet to the solar system
   * @param planet Planet to add
   */
  public addPlanet(planet: Planet): void {
    this.planets.push(planet);

    // If this is the Sun, store a reference for later calculations
    if (planet.name.toLowerCase() === "sun") {
      this.sun = planet;
    }

    // Initialize any missing orbital elements
    OrbitalMechanics.initializeOrbitalElements(planet);

    // Update orbital elements for the current epoch
    this.time.updateOrbitalElements(planet);

    // Create orbit visualization if enabled
    if (this.showOrbits && planet.name.toLowerCase() !== "sun") {
      this.createOrbitVisualization(planet);
    }
  }

  /**
   * Remove a planet from the solar system
   * @param planetName Name of the planet to remove
   */
  public removePlanet(planetName: string): boolean {
    const index = this.planets.findIndex((p) => p.name === planetName);
    if (index >= 0) {
      const planet = this.planets[index];

      // Remove orbit visualization if it exists
      this.removeOrbitVisualization(planet);

      // Remove from planets array
      this.planets.splice(index, 1);

      // Clear Sun reference if removing the Sun
      if (planet === this.sun) {
        this.sun = null;
      }

      return true;
    }
    return false;
  }

  /**
   * Update the entire solar system based on elapsed time
   * @param currentRealTime Current real-world time in milliseconds
   */
  public update(currentRealTime: number = Date.now()): void {
    // Update astronomical time and get elapsed simulation seconds
    const elapsedSeconds = this.time.update(currentRealTime);
    if (elapsedSeconds <= 0) return;

    // Update orbital elements for the current epoch
    for (const planet of this.planets) {
      this.time.updateOrbitalElements(planet);
    }

    // Update planet positions
    if (this.useKeplerianOrbits) {
      this.updateWithKeplerianModel(elapsedSeconds);
    } else if (this.useNBodyPhysics) {
      this.updateWithNBodyPhysics(elapsedSeconds);
    }

    // Update orbit visualizations if enabled
    if (this.showOrbits) {
      this.updateOrbitVisualizations();
    }
  }

  /**
   * Update planets using the Keplerian orbital model (simplified, non-interacting)
   * Simply call each planet's update method (which handles updating its own
   * calculated position and copying it into its parent group).
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private updateWithKeplerianModel(elapsedSeconds: number): void {
    for (const planet of this.planets) {
      // Skip the Sun
      if (planet === this.sun) continue;
      // Let the planet update itself (this updates its internal position,
      // its mesh position, and its parent group position as defined in BasePlanet.update)
      planet.update(elapsedSeconds);
    }
  }

  /**
   * Update planets using N-body gravitational physics (full interactions)
   * More accurate but computationally expensive.
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private updateWithNBodyPhysics(elapsedSeconds: number): void {
    const accelerations: THREE.Vector3[] = this.planets.map(
      () => new THREE.Vector3()
    );

    // Calculate gravitational forces between all planets
    for (let i = 0; i < this.planets.length; i++) {
      const planet1 = this.planets[i];
      for (let j = 0; j < this.planets.length; j++) {
        if (i === j) continue;
        const planet2 = this.planets[j];
        const force = this.calculateGravitationalForce(planet1, planet2);
        accelerations[i].add(force);
      }
    }

    // Apply relativistic corrections if enabled
    if (this.useRelativisticEffects) {
      this.applyRelativisticCorrections(accelerations, elapsedSeconds);
    }

    // Update velocities and positions manually, then update parent groups
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      planet.velocity.add(
        accelerations[i].clone().multiplyScalar(elapsedSeconds)
      );
      planet.position.add(
        planet.velocity.clone().multiplyScalar(elapsedSeconds)
      );
      planet.mesh.position.copy(planet.position);
      if ((planet as any).planetGroup) {
        (planet as any).planetGroup.position.copy(planet.position);
      }
      // Update rotation via our own helper
      this.updatePlanetRotation(planet, elapsedSeconds);
    }
  }

  /**
   * Calculate gravitational force between two planets
   * @param planet1 First planet
   * @param planet2 Second planet
   * @returns Acceleration vector on planet1 due to planet2
   */
  private calculateGravitationalForce(
    planet1: Planet,
    planet2: Planet
  ): THREE.Vector3 {
    const distanceVector = new THREE.Vector3().subVectors(
      planet2.position,
      planet1.position
    );
    const distance = distanceVector.length();
    if (distance < planet1.radius + planet2.radius) {
      return new THREE.Vector3();
    }
    const distanceMeters = distance * 1000;
    const G = 6.6743e-11;
    const forceMagnitude =
      (G * planet2.mass) / (distanceMeters * distanceMeters);
    return distanceVector.normalize().multiplyScalar(forceMagnitude);
  }

  /**
   * Apply relativistic corrections to planet accelerations
   * @param accelerations Array of acceleration vectors
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private applyRelativisticCorrections(
    accelerations: THREE.Vector3[],
    elapsedSeconds: number
  ): void {
    const c = 299792458;
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      const velocityMagnitude = planet.velocity.length() * 1000; // convert km/s to m/s
      if (velocityMagnitude < 1000) continue;
      const gammaSq =
        1 / (1 - (velocityMagnitude * velocityMagnitude) / (c * c));
      const gamma = Math.sqrt(gammaSq);
      if (gamma > 2.0) continue;
      accelerations[i].divideScalar(gamma);
      if (this.sun) {
        const distanceToSun = planet.position.distanceTo(this.sun.position);
        if (distanceToSun < planet.semiMajorAxis * 1.5) {
          const sunMass = this.sun.mass;
          const precessionPerOrbit =
            (6 * Math.PI * 6.6743e-11 * sunMass) /
            (c *
              c *
              planet.semiMajorAxis *
              1000 *
              (1 - planet.eccentricity * planet.eccentricity));
          const period = planet.orbitalPeriod * 86400;
          const angle =
            precessionPerOrbit * (elapsedSeconds / period) * 2 * Math.PI;
          if (Math.abs(angle) > 1e-12) {
            const orbit_normal = new THREE.Vector3()
              .crossVectors(planet.position, planet.velocity)
              .normalize();
            const quaternion = new THREE.Quaternion().setFromAxisAngle(
              orbit_normal,
              angle
            );
            planet.velocity.applyQuaternion(quaternion);
          }
        }
      }
    }
  }

  /**
   * Update planet rotation with proper axial tilt.
   * This helper is used in the N-body branch.
   * @param planet Planet to update
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private updatePlanetRotation(planet: Planet, elapsedSeconds: number): void {
    // Calculate rotation speed in radians per second
    const rotationPeriodSeconds = planet.rotationPeriod * 86400; // Convert days to seconds
    const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

    // Special case for retrograde rotation (Venus, Uranus)
    const isRetrograde = planet.obliquityToOrbit > 90;
    const rotationMultiplier = isRetrograde ? -1 : 1;

    // Apply rotation around Y axis (simplified model)
    if (planet.mesh instanceof THREE.Mesh) {
      planet.mesh.rotateY(rotationSpeed * elapsedSeconds * rotationMultiplier);
    } else if (planet.mesh instanceof THREE.Group) {
      // Handle planet groups (like Saturn with rings)
      planet.mesh.rotateY(rotationSpeed * elapsedSeconds * rotationMultiplier);
    }

    // REMOVED: The problematic code that was resetting rotations
    if (typeof planet.applyAxialTilt === "function") {
      planet.applyAxialTilt();
    }
  }

  /**
   * Create a visualization of a planet's orbit
   * @param planet Planet to visualize orbit for
   */
  private createOrbitVisualization(planet: Planet): void {
    if (planet.name.toLowerCase() === "sun") return;

    const points: THREE.Vector3[] = [];
    const segments = 256;
    const a = planet.semiMajorAxis;
    const e = planet.eccentricity;
    const i = planet.orbitalInclination * (Math.PI / 180);
    const omega = (planet.argumentOfPerihelion || 0) * (Math.PI / 180);
    const Omega = (planet.longitudeOfAscendingNode || 0) * (Math.PI / 180);

    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * 2 * Math.PI;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
      const x_orbit = r * Math.cos(theta);
      const y_orbit = r * Math.sin(theta);
      const x =
        (Math.cos(Omega) * Math.cos(omega) -
          Math.sin(Omega) * Math.sin(omega) * Math.cos(i)) *
          x_orbit +
        (-Math.cos(Omega) * Math.sin(omega) -
          Math.sin(Omega) * Math.cos(omega) * Math.cos(i)) *
          y_orbit;
      const y =
        (Math.sin(Omega) * Math.cos(omega) +
          Math.cos(Omega) * Math.sin(omega) * Math.cos(i)) *
          x_orbit +
        (-Math.sin(Omega) * Math.sin(omega) +
          Math.cos(Omega) * Math.cos(omega) * Math.cos(i)) *
          y_orbit;
      const z =
        Math.sin(omega) * Math.sin(i) * x_orbit +
        Math.cos(omega) * Math.sin(i) * y_orbit;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    let orbitColor = 0xffffff;
    switch (planet.name.toLowerCase()) {
      case "mercury":
        orbitColor = 0xcccccc;
        break;
      case "venus":
        orbitColor = 0xeedd82;
        break;
      case "earth":
        orbitColor = 0x6495ed;
        break;
      case "mars":
        orbitColor = 0xcd5c5c;
        break;
      case "jupiter":
        orbitColor = 0xffa500;
        break;
      case "saturn":
        orbitColor = 0xffd700;
        break;
      case "uranus":
        orbitColor = 0x40e0d0;
        break;
      case "neptune":
        orbitColor = 0x0000cd;
        break;
      case "pluto":
        orbitColor = 0x8b4513;
        break;
    }
    const material = new THREE.LineBasicMaterial({
      color: orbitColor,
      transparent: true,
      opacity: 0.5,
    });
    const orbitLine = new THREE.Line(geometry, material);
    orbitLine.name = `${planet.name}-orbit`;
    this.scene.add(orbitLine);
    this.orbitLines.push(orbitLine);
  }

  /**
   * Update orbit visualizations to match current orbital elements
   */
  private updateOrbitVisualizations(): void {
    for (const planet of this.planets) {
      if (planet.name.toLowerCase() === "sun") continue;
      const hasOrbit = this.orbitLines.some(
        (line) => line.name === `${planet.name}-orbit`
      );
      if (!hasOrbit) {
        this.createOrbitVisualization(planet);
      }
    }
  }

  /**
   * Remove orbit visualization for a planet
   * @param planet Planet to remove orbit visualization for
   */
  private removeOrbitVisualization(planet: Planet): void {
    const index = this.orbitLines.findIndex(
      (line) => line.name === `${planet.name}-orbit`
    );
    if (index >= 0) {
      const orbitLine = this.orbitLines[index];
      this.scene.remove(orbitLine);
      if (orbitLine.geometry) orbitLine.geometry.dispose();
      if ((orbitLine.material as THREE.Material).dispose) {
        (orbitLine.material as THREE.Material).dispose();
      }
      this.orbitLines.splice(index, 1);
    }
  }

  /**
   * Set the simulation time scale
   * @param scale Time acceleration factor (1.0 = real time)
   */
  public setTimeScale(scale: number): void {
    this.time.timeScale = scale;
  }

  /**
   * Get current time scale
   */
  public getTimeScale(): number {
    return this.time.timeScale;
  }

  /**
   * Set simulation date
   * @param date Date to set
   */
  public setDate(date: Date): void {
    this.time.setDate(date);
    for (const planet of this.planets) {
      this.time.updateOrbitalElements(planet);
    }
  }

  /**
   * Get current simulation date
   */
  public getDate(): Date {
    return this.time.julianToDate(this.time.julianDate);
  }

  /**
   * Get formatted date string
   */
  public getFormattedDate(): string {
    return this.time.getFormattedDate();
  }

  /**
   * Toggle between Keplerian and N-body physics
   * @param useNBody Whether to use N-body physics (true) or Keplerian orbits (false)
   */
  public setPhysicsModel(useNBody: boolean): void {
    this.useNBodyPhysics = useNBody;
    this.useKeplerianOrbits = !useNBody;
  }

  /**
   * Toggle relativistic effects
   * @param enable Whether to enable relativistic effects
   */
  public setRelativisticEffects(enable: boolean): void {
    this.useRelativisticEffects = enable;
  }

  /**
   * Toggle orbit visualizations
   * @param show Whether to show orbit lines
   */
  public setShowOrbits(show: boolean): void {
    this.showOrbits = show;
    if (show) {
      for (const planet of this.planets) {
        if (planet.name.toLowerCase() !== "sun") {
          this.createOrbitVisualization(planet);
        }
      }
    } else {
      for (const orbitLine of this.orbitLines) {
        this.scene.remove(orbitLine);
        if (orbitLine.geometry) orbitLine.geometry.dispose();
        if ((orbitLine.material as THREE.Material).dispose) {
          (orbitLine.material as THREE.Material).dispose();
        }
      }
      this.orbitLines = [];
    }
  }

  /**
   * Get planet by name
   * @param name Planet name
   */
  public getPlanetByName(name: string): Planet | null {
    return (
      this.planets.find((p) => p.name.toLowerCase() === name.toLowerCase()) ||
      null
    );
  }

  /**
   * Get all planets
   */
  public getAllPlanets(): Planet[] {
    return [...this.planets];
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    for (const orbitLine of this.orbitLines) {
      this.scene.remove(orbitLine);
      if (orbitLine.geometry) orbitLine.geometry.dispose();
      if ((orbitLine.material as THREE.Material).dispose) {
        (orbitLine.material as THREE.Material).dispose();
      }
    }
    this.orbitLines = [];
    this.planets = [];
    this.sun = null;
  }
}
