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
  private useKeplerianOrbits: boolean = true;
  private useNBodyPhysics: boolean = false;
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

    // Skip update if no time has passed
    if (elapsedSeconds <= 0) return;

    // Update orbital elements for the current epoch
    for (const planet of this.planets) {
      this.time.updateOrbitalElements(planet);
    }

    // Update planet positions based on selected physics model
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
   * Update planets using Keplerian orbital model (simplified, non-interacting)
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private updateWithKeplerianModel(elapsedSeconds: number): void {
    // Get the Sun's mass for calculations
    const sunMass = this.sun ? this.sun.mass : 1.989e30; // Default if sun not found

    for (const planet of this.planets) {
      // Skip the Sun
      if (planet === this.sun) continue;

      // Calculate orbital position with relativistic effects if enabled
      if (this.useRelativisticEffects) {
        // Use OrbitalMechanics static method for position calculation
        const newPosition = OrbitalMechanics.calculateOrbitalPosition(
          planet,
          elapsedSeconds,
          sunMass
        );

        // Update mesh and actual position
        planet.mesh.position.copy(newPosition);
        planet.position.copy(newPosition);
      } else {
        // Use planet's own orbit calculation method if it exists
        if (typeof planet.calculateOrbit === "function") {
          planet.calculateOrbit(elapsedSeconds);
        } else {
          // Fall back to standard update method
          planet.update(elapsedSeconds);
        }
      }

      // Update rotation - all planets should be able to handle this
      this.updatePlanetRotation(planet, elapsedSeconds);
    }
  }

  /**
   * Update planets using N-body gravitational physics (full interactions)
   * More accurate but computationally expensive
   * @param elapsedSeconds Elapsed simulation time in seconds
   */
  private updateWithNBodyPhysics(elapsedSeconds: number): void {
    // Create arrays to store forces for each planet
    const accelerations: THREE.Vector3[] = this.planets.map(
      () => new THREE.Vector3()
    );

    // Calculate gravitational forces between all planets
    for (let i = 0; i < this.planets.length; i++) {
      const planet1 = this.planets[i];

      for (let j = 0; j < this.planets.length; j++) {
        if (i === j) continue; // Skip self-interaction

        const planet2 = this.planets[j];

        // Calculate gravitational acceleration on planet1 due to planet2
        const force = this.calculateGravitationalForce(planet1, planet2);
        accelerations[i].add(force);
      }
    }

    // Apply relativistic corrections if enabled
    if (this.useRelativisticEffects) {
      this.applyRelativisticCorrections(accelerations, elapsedSeconds);
    }

    // Update velocities and positions
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];

      // Update velocity: v = v + a * dt
      planet.velocity.add(
        accelerations[i].clone().multiplyScalar(elapsedSeconds)
      );

      // Update position: p = p + v * dt
      const positionDelta = planet.velocity
        .clone()
        .multiplyScalar(elapsedSeconds);
      planet.position.add(positionDelta);

      // Update mesh position
      planet.mesh.position.copy(planet.position);

      // Update rotation
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
    // Calculate distance vector and magnitude
    const distanceVector = new THREE.Vector3().subVectors(
      planet2.position,
      planet1.position
    );
    const distance = distanceVector.length();

    // Skip if too close (prevents numerical instability)
    if (distance < planet1.radius + planet2.radius) {
      return new THREE.Vector3();
    }

    // Convert to meters for calculations
    const distanceMeters = distance * 1000;

    // Universal gravitational constant in m^3 kg^-1 s^-2
    const G = 6.6743e-11;

    // Calculate force magnitude: F = G * (m1 * m2) / r²
    const forceMagnitude =
      (G * planet2.mass) / (distanceMeters * distanceMeters);

    // Direction toward other planet
    const direction = distanceVector.normalize();

    // Calculate acceleration: a = F / m
    return direction.multiplyScalar(forceMagnitude);
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
    // Speed of light in m/s
    const c = 299792458;

    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];

      // Skip planets with very low velocities
      const velocityMagnitude = planet.velocity.length() * 1000; // km/s to m/s
      if (velocityMagnitude < 1000) continue;

      // Calculate relativistic γ factor
      const gammaSq =
        1 / (1 - (velocityMagnitude * velocityMagnitude) / (c * c));
      const gamma = Math.sqrt(gammaSq);

      // For extremely high velocities, cap the factor to prevent instability
      if (gamma > 2.0) continue;

      // Apply relativistic mass increase effect on acceleration
      // a = F/m becomes a = F/(γm) for relativistic mass
      accelerations[i].divideScalar(gamma);

      // If close to the Sun, apply perihelion precession
      if (this.sun) {
        const distanceToSun = planet.position.distanceTo(this.sun.position);
        if (distanceToSun < planet.semiMajorAxis * 1.5) {
          // Calculate precession rate (simplified)
          const sunMass = this.sun.mass;
          const precessionPerOrbit =
            (6 * Math.PI * 6.6743e-11 * sunMass) /
            (c *
              c *
              planet.semiMajorAxis *
              1000 *
              (1 - planet.eccentricity * planet.eccentricity));

          // Apply small rotation to velocity vector
          // This effectively creates the perihelion precession effect
          const period = planet.orbitalPeriod * 86400; // days to seconds
          const angle =
            precessionPerOrbit * (elapsedSeconds / period) * 2 * Math.PI;

          if (Math.abs(angle) > 1e-12) {
            // Create rotation axis (perpendicular to orbital plane)
            const orbit_normal = new THREE.Vector3()
              .crossVectors(planet.position, planet.velocity)
              .normalize();

            // Create quaternion for rotation
            const quaternion = new THREE.Quaternion().setFromAxisAngle(
              orbit_normal,
              angle
            );

            // Apply rotation to velocity vector
            planet.velocity.applyQuaternion(quaternion);
          }
        }
      }
    }
  }

  /**
   * Update planet rotation with proper axial tilt
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

    // If the planet has its own axial tilt method, use that
    if (typeof planet.applyAxialTilt === "function") {
      planet.applyAxialTilt();
    }
  }

  /**
   * Create a visualization of a planet's orbit
   * @param planet Planet to visualize orbit for
   */
  private createOrbitVisualization(planet: Planet): void {
    // Skip the Sun
    if (planet.name.toLowerCase() === "sun") return;

    // Generate points for the elliptical orbit
    const points: THREE.Vector3[] = [];
    const segments = 256;

    // Convert orbital elements for calculation
    const a = planet.semiMajorAxis;
    const e = planet.eccentricity;
    const i = planet.orbitalInclination * (Math.PI / 180);
    const omega = (planet.argumentOfPerihelion || 0) * (Math.PI / 180);
    const Omega = (planet.longitudeOfAscendingNode || 0) * (Math.PI / 180);

    for (let j = 0; j <= segments; j++) {
      // True anomaly around the orbit
      const theta = (j / segments) * 2 * Math.PI;

      // Distance from focus
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));

      // Position in orbital plane
      const x_orbit = r * Math.cos(theta);
      const y_orbit = r * Math.sin(theta);

      // Transform to 3D space accounting for inclination and orientation
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

    // Create the orbit line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Assign a color based on the planet
    let orbitColor = 0xffffff; // Default white
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

    // Add to scene and store reference
    this.scene.add(orbitLine);
    this.orbitLines.push(orbitLine);
  }

  /**
   * Update orbit visualizations to match current orbital elements
   */
  private updateOrbitVisualizations(): void {
    // For now, just ensure all planets have orbit lines
    for (const planet of this.planets) {
      // Skip the Sun
      if (planet.name.toLowerCase() === "sun") continue;

      // Check if this planet has an orbit line
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

      // Dispose of geometry and material
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

    // Update orbital elements for the new epoch
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
      // Create orbit visualizations for all planets
      for (const planet of this.planets) {
        if (planet.name.toLowerCase() !== "sun") {
          this.createOrbitVisualization(planet);
        }
      }
    } else {
      // Remove all orbit visualizations
      for (const orbitLine of this.orbitLines) {
        this.scene.remove(orbitLine);

        // Dispose of geometry and material
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
    // Remove all orbit visualizations
    for (const orbitLine of this.orbitLines) {
      this.scene.remove(orbitLine);

      // Dispose of geometry and material
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
