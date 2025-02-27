import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";

const G = 6.6743e-11; const C = 299792458; const AU = 1.496e11; const SECONDS_PER_DAY = 86400;


export default class OrbitalMechanics {
  
  public static calculateOrbitalPosition(
    planet: Planet,
    timeElapsedSeconds: number,
    centralBodyMass: number = 1.989e30   ): THREE.Vector3 {
        const meanMotion = (2 * Math.PI) / (planet.orbitalPeriod * SECONDS_PER_DAY);     planet.meanAnomaly += meanMotion * timeElapsedSeconds;
    planet.meanAnomaly %= 2 * Math.PI; 
        const E = this.solveKepler(planet.meanAnomaly, planet.eccentricity);

        const trueAnomaly =
      2 *
      Math.atan(
        Math.sqrt((1 + planet.eccentricity) / (1 - planet.eccentricity)) *
          Math.tan(E / 2)
      );

        const relativistic = this.calculateRelativisticPrecession(
      planet,
      centralBodyMass,
      timeElapsedSeconds
    );

        const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(E));

        return this.calculatePosition3D(
      r,
      trueAnomaly + relativistic.precessionAngle,
      planet.orbitalInclination * (Math.PI / 180),
      planet.longitudeOfAscendingNode || 0,
      planet.argumentOfPerihelion || 0
    );
  }

  
  public static solveKepler(M: number, e: number): number {
        let E = M;
    let delta = 1;

                const maxIterations = 30;
    let iterations = 0;

    while (Math.abs(delta) > 1e-8 && iterations < maxIterations) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
      iterations++;
    }

        return E % (2 * Math.PI);
  }

  
  private static calculateRelativisticPrecession(
    planet: Planet,
    centralBodyMass: number,
    timeElapsedSeconds: number
  ): { precessionAngle: number } {
        
        const a = planet.semiMajorAxis * 1000;
    const e = planet.eccentricity;

        const precessionPerOrbit =
      (6 * Math.PI * G * centralBodyMass) / (C * C * a * (1 - e * e));

        const fractionOfOrbit =
      timeElapsedSeconds / (planet.orbitalPeriod * SECONDS_PER_DAY);

        const precessionAngle = precessionPerOrbit * fractionOfOrbit;

    return { precessionAngle };
  }

  
  private static calculatePosition3D(
    r: number,
    trueAnomaly: number,
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPerihelion: number
  ): THREE.Vector3 {
        const xOrbit = r * Math.cos(trueAnomaly);
    const yOrbit = r * Math.sin(trueAnomaly);

        const cosΩ = Math.cos(longitudeOfAscendingNode);
    const sinΩ = Math.sin(longitudeOfAscendingNode);
    const cosω = Math.cos(argumentOfPerihelion);
    const sinω = Math.sin(argumentOfPerihelion);
    const cosi = Math.cos(inclination);
    const sini = Math.sin(inclination);

        const x =
      (cosΩ * cosω - sinΩ * sinω * cosi) * xOrbit +
      (-cosΩ * sinω - sinΩ * cosω * cosi) * yOrbit;

    const y =
      (sinΩ * cosω + cosΩ * sinω * cosi) * xOrbit +
      (-sinΩ * sinω + cosΩ * cosω * cosi) * yOrbit;

    const z = sinω * sini * xOrbit + cosω * sini * yOrbit;

    return new THREE.Vector3(x, y, z);
  }

  
  public static applyAxialTilt(
    planetMesh: THREE.Object3D,
    planet: Planet
  ): void {
        const obliquity = planet.obliquityToOrbit * (Math.PI / 180);

        const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), obliquity);

        planetMesh.setRotationFromQuaternion(quaternion);

        if (planet.name === "Uranus") {
            const uranusQ = new THREE.Quaternion();
      uranusQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      quaternion.multiply(uranusQ);
      planetMesh.setRotationFromQuaternion(quaternion);
    }
  }

  
  public static initializeOrbitalElements(planet: Planet): void {
        if (!planet.semiMinorAxis) {
      planet.semiMinorAxis =
        planet.semiMajorAxis *
        Math.sqrt(1 - planet.eccentricity * planet.eccentricity);
    }

        if (planet.longitudeOfAscendingNode === undefined) {
            planet.longitudeOfAscendingNode = 0;
    }

    if (planet.argumentOfPerihelion === undefined) {
            planet.argumentOfPerihelion = 0;
    }

        planet.orbitalInclination = planet.orbitalInclination || 0;
    planet.orbitalInclinationRad = planet.orbitalInclination * (Math.PI / 180);
  }

  
  public static calculateEarthJ2000Matrix(): THREE.Matrix4 {
        const obliquity = 23.439281 * (Math.PI / 180); 
    const matrix = new THREE.Matrix4();
    const rotationX = new THREE.Matrix4().makeRotationX(obliquity);

    matrix.multiply(rotationX);
    return matrix;
  }
}
