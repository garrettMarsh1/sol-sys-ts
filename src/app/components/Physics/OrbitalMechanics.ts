// src/app/components/Physics/OrbitalMechanics.ts
import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";

// Physical constants
const G = 6.6743e-11; // Universal gravitational constant (m^3 kg^-1 s^-2)
const C = 299792458; // Speed of light (m/s)
const AU = 1.496e11; // 1 Astronomical Unit in meters
const SECONDS_PER_DAY = 86400;

/**
 * Implements realistic orbital mechanics for planetary systems
 * including full 3D orbits, axial tilt, and relativistic effects
 */
export default class OrbitalMechanics {
  /**
   * Calculates position using Keplerian orbital elements with relativistic corrections
   * @param planet - Planet to calculate position for
   * @param julianDate - Current Julian date
   * @param centralBodyMass - Mass of central body (Sun) in kg
   */
  public static calculateOrbitalPosition(
    planet: Planet,
    timeElapsedSeconds: number,
    centralBodyMass: number = 1.989e30 // Sun's mass as default
  ): THREE.Vector3 {
    // Update mean anomaly based on elapsed time
    const meanMotion = (2 * Math.PI) / (planet.orbitalPeriod * SECONDS_PER_DAY); // radians per second
    planet.meanAnomaly += meanMotion * timeElapsedSeconds;
    planet.meanAnomaly %= 2 * Math.PI; // Keep within [0, 2π)

    // Solve Kepler's equation for eccentric anomaly
    const E = this.solveKepler(planet.meanAnomaly, planet.eccentricity);

    // Calculate true anomaly (angle from perihelion to current position)
    const trueAnomaly =
      2 *
      Math.atan(
        Math.sqrt((1 + planet.eccentricity) / (1 - planet.eccentricity)) *
          Math.tan(E / 2)
      );

    // Apply relativistic perihelion precession (most noticeable for Mercury)
    const relativistic = this.calculateRelativisticPrecession(
      planet,
      centralBodyMass,
      timeElapsedSeconds
    );

    // Calculate distance to central body
    const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(E));

    // Convert orbital elements to 3D position
    return this.calculatePosition3D(
      r,
      trueAnomaly + relativistic.precessionAngle,
      planet.orbitalInclination * (Math.PI / 180),
      planet.longitudeOfAscendingNode || 0,
      planet.argumentOfPerihelion || 0
    );
  }

  /**
   * Solves Kepler's equation to find eccentric anomaly
   * @param M - Mean anomaly in radians
   * @param e - Eccentricity
   * @returns Eccentric anomaly in radians
   */
  public static solveKepler(M: number, e: number): number {
    // Initial guess: for low eccentricity, E ≈ M
    let E = M;
    let delta = 1;

    // Use Newton-Raphson method to converge on solution
    // f(E) = E - e*sin(E) - M = 0
    // f'(E) = 1 - e*cos(E)
    const maxIterations = 30;
    let iterations = 0;

    while (Math.abs(delta) > 1e-8 && iterations < maxIterations) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
      iterations++;
    }

    // Ensure E is within [0, 2π)
    return E % (2 * Math.PI);
  }

  /**
   * Calculates relativistic corrections to orbital motion
   * @param planet - Planet object
   * @param centralBodyMass - Mass of central body (Sun)
   * @param timeElapsedSeconds - Time elapsed in seconds
   */
  private static calculateRelativisticPrecession(
    planet: Planet,
    centralBodyMass: number,
    timeElapsedSeconds: number
  ): { precessionAngle: number } {
    // Einstein's relativistic perihelion precession formula
    // radians per orbit = 6πGM/c²a(1-e²)

    // Convert semiMajorAxis from km to meters
    const a = planet.semiMajorAxis * 1000;
    const e = planet.eccentricity;

    // Calculate precession rate per orbit (radians)
    const precessionPerOrbit =
      (6 * Math.PI * G * centralBodyMass) / (C * C * a * (1 - e * e));

    // Calculate number of orbits completed in elapsed time
    const fractionOfOrbit =
      timeElapsedSeconds / (planet.orbitalPeriod * SECONDS_PER_DAY);

    // Total precession angle
    const precessionAngle = precessionPerOrbit * fractionOfOrbit;

    return { precessionAngle };
  }

  /**
   * Converts orbital elements to 3D position
   */
  private static calculatePosition3D(
    r: number,
    trueAnomaly: number,
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPerihelion: number
  ): THREE.Vector3 {
    // Position in orbital plane (2D)
    const xOrbit = r * Math.cos(trueAnomaly);
    const yOrbit = r * Math.sin(trueAnomaly);

    // Apply rotations to convert from orbital plane to reference plane
    const cosΩ = Math.cos(longitudeOfAscendingNode);
    const sinΩ = Math.sin(longitudeOfAscendingNode);
    const cosω = Math.cos(argumentOfPerihelion);
    const sinω = Math.sin(argumentOfPerihelion);
    const cosi = Math.cos(inclination);
    const sini = Math.sin(inclination);

    // Apply rotation matrices
    const x =
      (cosΩ * cosω - sinΩ * sinω * cosi) * xOrbit +
      (-cosΩ * sinω - sinΩ * cosω * cosi) * yOrbit;

    const y =
      (sinΩ * cosω + cosΩ * sinω * cosi) * xOrbit +
      (-sinΩ * sinω + cosΩ * cosω * cosi) * yOrbit;

    const z = sinω * sini * xOrbit + cosω * sini * yOrbit;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Apply proper axial tilt to a planet mesh
   * @param planetMesh - The planet's mesh object
   * @param planet - Planet data object
   */
  public static applyAxialTilt(
    planetMesh: THREE.Object3D,
    planet: Planet
  ): void {
    // Convert tilt angle to radians
    const obliquity = planet.obliquityToOrbit * (Math.PI / 180);

    // Create quaternion for obliquity (axial tilt)
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), obliquity);

    // Apply quaternion to planet mesh
    planetMesh.setRotationFromQuaternion(quaternion);

    // Special case for Uranus (tilted nearly 90 degrees)
    if (planet.name === "Uranus") {
      // Additional rotation to account for Uranus's extreme tilt
      const uranusQ = new THREE.Quaternion();
      uranusQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      quaternion.multiply(uranusQ);
      planetMesh.setRotationFromQuaternion(quaternion);
    }
  }

  /**
   * Initialize orbital elements that may be missing from planet data
   * @param planet - Planet to initialize
   */
  public static initializeOrbitalElements(planet: Planet): void {
    // Calculate semi-minor axis if needed
    if (!planet.semiMinorAxis) {
      planet.semiMinorAxis =
        planet.semiMajorAxis *
        Math.sqrt(1 - planet.eccentricity * planet.eccentricity);
    }

    // Set default values for missing orbital elements
    if (planet.longitudeOfAscendingNode === undefined) {
      // Using default of 0 for simplicity, but could be set to astronomically accurate values
      planet.longitudeOfAscendingNode = 0;
    }

    if (planet.argumentOfPerihelion === undefined) {
      // Using default of 0 for simplicity, but could be set to astronomically accurate values
      planet.argumentOfPerihelion = 0;
    }

    // Convert inclination and other angles to radians internally
    planet.orbitalInclination = planet.orbitalInclination || 0;
    planet.orbitalInclinationRad = planet.orbitalInclination * (Math.PI / 180);
  }

  /**
   * Calculate Earth's J2000 rotation matrix
   * This is useful for aligning planetary systems to standard astronomical coordinates
   */
  public static calculateEarthJ2000Matrix(): THREE.Matrix4 {
    // Constants for J2000 Earth orientation
    const obliquity = 23.439281 * (Math.PI / 180); // Earth's axial tilt at J2000

    const matrix = new THREE.Matrix4();
    const rotationX = new THREE.Matrix4().makeRotationX(obliquity);

    matrix.multiply(rotationX);
    return matrix;
  }
}
