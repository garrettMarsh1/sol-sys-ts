import * as THREE from "three";
import { Planet } from "../Interface/PlanetInterface";
import AstronomicalTime from "./AstronomicalTime";
import OrbitalMechanics from "./OrbitalMechanics";


export default class SolarSystemManager {
    private planets: Planet[] = [];

    private time: AstronomicalTime;

    private useKeplerianOrbits: boolean = false;
  private useNBodyPhysics: boolean = true;
  private useRelativisticEffects: boolean = true;

    private sun: Planet | null = null;

    private showOrbits: boolean = false;
  private orbitLines: THREE.Line[] = [];
  private scene: THREE.Scene;

  
  constructor(scene: THREE.Scene, initialDate: Date = new Date()) {
    this.scene = scene;
    this.time = new AstronomicalTime(initialDate);
  }

  
  public addPlanet(planet: Planet): void {
    this.planets.push(planet);

        if (planet.name.toLowerCase() === "sun") {
      this.sun = planet;
    }

        OrbitalMechanics.initializeOrbitalElements(planet);

        this.time.updateOrbitalElements(planet);

        if (this.showOrbits && planet.name.toLowerCase() !== "sun") {
      this.createOrbitVisualization(planet);
    }
  }

  
  public removePlanet(planetName: string): boolean {
    const index = this.planets.findIndex((p) => p.name === planetName);
    if (index >= 0) {
      const planet = this.planets[index];

            this.removeOrbitVisualization(planet);

            this.planets.splice(index, 1);

            if (planet === this.sun) {
        this.sun = null;
      }

      return true;
    }
    return false;
  }

  
  public update(currentRealTime: number = Date.now()): void {
        const elapsedSeconds = this.time.update(currentRealTime);
    if (elapsedSeconds <= 0) return;

        for (const planet of this.planets) {
      this.time.updateOrbitalElements(planet);
    }

        if (this.useKeplerianOrbits) {
      this.updateWithKeplerianModel(elapsedSeconds);
    } else if (this.useNBodyPhysics) {
      this.updateWithNBodyPhysics(elapsedSeconds);
    }

        if (this.showOrbits) {
      this.updateOrbitVisualizations();
    }
  }

  
  private updateWithKeplerianModel(elapsedSeconds: number): void {
    for (const planet of this.planets) {
            if (planet === this.sun) continue;
                  planet.update(elapsedSeconds);
    }
  }

  
  private updateWithNBodyPhysics(elapsedSeconds: number): void {
    const accelerations: THREE.Vector3[] = this.planets.map(
      () => new THREE.Vector3()
    );

        for (let i = 0; i < this.planets.length; i++) {
      const planet1 = this.planets[i];
      for (let j = 0; j < this.planets.length; j++) {
        if (i === j) continue;
        const planet2 = this.planets[j];
        const force = this.calculateGravitationalForce(planet1, planet2);
        accelerations[i].add(force);
      }
    }

        if (this.useRelativisticEffects) {
      this.applyRelativisticCorrections(accelerations, elapsedSeconds);
    }

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
            this.updatePlanetRotation(planet, elapsedSeconds);
    }
  }

  
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

  
  private applyRelativisticCorrections(
    accelerations: THREE.Vector3[],
    elapsedSeconds: number
  ): void {
    const c = 299792458;
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      const velocityMagnitude = planet.velocity.length() * 1000;       if (velocityMagnitude < 1000) continue;
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

  
  private updatePlanetRotation(planet: Planet, elapsedSeconds: number): void {
        const rotationPeriodSeconds = planet.rotationPeriod * 86400;     const rotationSpeed = (2 * Math.PI) / rotationPeriodSeconds;

        const isRetrograde = planet.obliquityToOrbit > 90;
    const rotationMultiplier = isRetrograde ? -1 : 1;

        if (planet.mesh instanceof THREE.Mesh) {
      planet.mesh.rotateY(rotationSpeed * elapsedSeconds * rotationMultiplier);
    } else if (planet.mesh instanceof THREE.Group) {
            planet.mesh.rotateY(rotationSpeed * elapsedSeconds * rotationMultiplier);
    }

        if (typeof planet.applyAxialTilt === "function") {
      planet.applyAxialTilt();
    }
  }

  
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

  
  public setTimeScale(scale: number): void {
    this.time.timeScale = scale;
  }

  
  public getTimeScale(): number {
    return this.time.timeScale;
  }

  
  public setDate(date: Date): void {
    this.time.setDate(date);
    for (const planet of this.planets) {
      this.time.updateOrbitalElements(planet);
    }
  }

  
  public getDate(): Date {
    return this.time.julianToDate(this.time.julianDate);
  }

  
  public getFormattedDate(): string {
    return this.time.getFormattedDate();
  }

  
  public setPhysicsModel(useNBody: boolean): void {
    this.useNBodyPhysics = useNBody;
    this.useKeplerianOrbits = !useNBody;
  }

  
  public setRelativisticEffects(enable: boolean): void {
    this.useRelativisticEffects = enable;
  }

  
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

  
  public getPlanetByName(name: string): Planet | null {
    return (
      this.planets.find((p) => p.name.toLowerCase() === name.toLowerCase()) ||
      null
    );
  }

  
  public getAllPlanets(): Planet[] {
    return [...this.planets];
  }

  
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
