// src/app/components/Physics/AstronomicalTime.ts
import { Planet } from "../Interface/PlanetInterface";

/**
 * Manages astronomical time for solar system simulations
 * Provides Julian Date calculations, time scaling, and orbital element updates
 */
export default class AstronomicalTime {
  // J2000 epoch (January 1, 2000, 12:00 UTC) as standard astronomical reference
  private static readonly J2000_EPOCH = 2451545.0;

  // Current Julian Date (days since 4713 BCE)
  private _julianDate: number;

  // Time acceleration factor (1.0 = real time, >1 = faster, <1 = slower)
  private _timeScale: number = 1.0;

  // Track last update time for delta calculations
  private _lastRealTime: number;

  // Reference epoch for planetary orbital elements
  private _referenceEpoch: number;

  /**
   * Create a new astronomical time tracker
   * @param initialDate Optional starting date (defaults to current time)
   * @param referenceEpoch Optional reference epoch (defaults to J2000)
   */
  constructor(
    initialDate: Date = new Date(),
    referenceEpoch: number = AstronomicalTime.J2000_EPOCH
  ) {
    this._julianDate = this.dateToJulian(initialDate);
    this._lastRealTime = Date.now();
    this._referenceEpoch = referenceEpoch;
  }

  /**
   * Convert JavaScript Date to Julian Date
   * @param date JavaScript Date object
   * @returns Julian Date (days since January 1, 4713 BCE at noon UTC)
   */
  private dateToJulian(date: Date): number {
    // Algorithm from Jean Meeus' "Astronomical Algorithms"
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();

    // Account for the fact that in astronomical calculations,
    // January and February are counted as months 13 and 14 of the previous year
    let year = y;
    let month = m;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    // Check if date is in Gregorian calendar (after Oct 15, 1582)
    const a = Math.floor(year / 100);
    const b = a / 4;
    const c = 2 - a + Math.floor(b);

    // Calculate Julian Day Number without time component
    const jdn =
      Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) +
      d +
      c -
      1524.5;

    // Add time component
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const milliseconds = date.getUTCMilliseconds();

    const dayFraction =
      (hours + minutes / 60 + seconds / 3600 + milliseconds / 3600000) / 24;

    return jdn + dayFraction;
  }

  /**
   * Convert Julian Date to JavaScript Date
   * @param julianDate Julian Date
   * @returns JavaScript Date object
   */
  public julianToDate(julianDate: number): Date {
    // Julian Day Number without time component
    const jdn = Math.floor(julianDate + 0.5);

    // Extract time component
    const dayFraction = julianDate + 0.5 - jdn;

    // Calculate date components (algorithm from Jean Meeus)
    let a = jdn;

    // Adjust for Gregorian calendar
    if (jdn >= 2299161) {
      const alpha = Math.floor((jdn - 1867216.25) / 36524.25);
      a = jdn + 1 + alpha - Math.floor(alpha / 4);
    }

    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);

    // Calculate day, month, year
    const day = b - d - Math.floor(30.6001 * e) + dayFraction;
    let month = e < 14 ? e - 1 : e - 13;
    let year = month > 2 ? c - 4716 : c - 4715;

    // Calculate hours, minutes, seconds, milliseconds
    const totalHours = dayFraction * 24;
    const hours = Math.floor(totalHours);
    const totalMinutes = (totalHours - hours) * 60;
    const minutes = Math.floor(totalMinutes);
    const totalSeconds = (totalMinutes - minutes) * 60;
    const seconds = Math.floor(totalSeconds);
    const milliseconds = Math.round((totalSeconds - seconds) * 1000);

    // Create JavaScript Date
    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        Math.floor(day),
        hours,
        minutes,
        seconds,
        milliseconds
      )
    );

    return date;
  }

  /**
   * Update astronomical time based on elapsed real time
   * @param currentRealTime Current real time in milliseconds
   * @returns The elapsed simulation time in seconds
   */
  public update(currentRealTime: number = Date.now()): number {
    // Calculate elapsed real time in seconds
    const elapsedRealSeconds = (currentRealTime - this._lastRealTime) / 1000;
    this._lastRealTime = currentRealTime;

    // Apply time scale to get simulation time
    const elapsedSimSeconds = elapsedRealSeconds * this._timeScale;

    // Convert seconds to Julian days (1 day = 86400 seconds)
    const elapsedJulianDays = elapsedSimSeconds / 86400;

    // Update Julian date
    this._julianDate += elapsedJulianDays;

    // Return elapsed simulation seconds for orbit calculations
    return elapsedSimSeconds;
  }

  /**
   * Updates orbital elements based on current epoch
   * Applies secular variations and perturbations to planets
   * @param planet Planet to update
   */
  public updateOrbitalElements(planet: Planet): void {
    // Calculate time difference from reference epoch in centuries
    const T = this.julianCenturies;

    // Skip Sun or if the planet has fixed orbital elements
    if (planet.name === "Sun") return;

    // Apply secular variations based on planet
    // Values derived from astronomical theories like VSOP87
    switch (planet.name) {
      case "Mercury":
        // Mercury has the largest relativistic precession (~43 arcsec/century)
        this.updateMercuryElements(planet, T);
        break;

      case "Venus":
        this.updateVenusElements(planet, T);
        break;

      case "Earth":
        this.updateEarthElements(planet, T);
        break;

      case "Mars":
        this.updateMarsElements(planet, T);
        break;

      case "Jupiter":
        this.updateJupiterElements(planet, T);
        break;

      case "Saturn":
        this.updateSaturnElements(planet, T);
        break;

      case "Uranus":
        this.updateUranusElements(planet, T);
        break;

      case "Neptune":
        this.updateNeptuneElements(planet, T);
        break;

      case "Pluto":
        this.updatePlutoElements(planet, T);
        break;
    }

    // Apply relativistic perihelion precession if enabled
    if (planet.hasRelativisticPrecession) {
      this.applyRelativisticPrecession(planet, T);
    }
  }

  /**
   * Apply relativistic perihelion precession
   * Most significant for Mercury (~43 arcsec/century)
   */
  private applyRelativisticPrecession(planet: Planet, T: number): void {
    if (!planet.initialArgumentOfPerihelion) {
      planet.initialArgumentOfPerihelion = planet.argumentOfPerihelion || 0;
    }

    // Get or calculate precession rate in arcsec/century
    if (!planet.precessionRate) {
      // Einstein's formula: 24π³a²/(T²c²(1-e²))
      // where a is semi-major axis in AU, T is orbital period in years
      // Simplified here to approximate values
      const semiMajorAxisAU = planet.semiMajorAxis / 149597870.7; // km to AU
      const orbitalPeriodYears = planet.orbitalPeriod / 365.25; // days to years

      // Calculate relativistic precession in arcsec/century
      planet.precessionRate =
        43.03 * // Mercury's known precession
        (1 / semiMajorAxisAU) * // Scales inversely with distance
        (1 / (1 - planet.eccentricity * planet.eccentricity)); // Higher for eccentric orbits
    }

    // Accumulate precession
    if (!planet.cumulativePrecession) planet.cumulativePrecession = 0;

    // Apply precession to argument of perihelion (convert arcsec to degrees)
    planet.cumulativePrecession = planet.precessionRate * T;

    // Update current argument of perihelion (degrees)
    if (planet.initialArgumentOfPerihelion !== undefined) {
      planet.argumentOfPerihelion =
        planet.initialArgumentOfPerihelion + planet.cumulativePrecession / 3600; // arcsec to degrees
    }
  }

  /**
   * Update Mercury's orbital elements for given epoch
   */
  private updateMercuryElements(planet: Planet, T: number): void {
    // Secular variations from VSOP87 theory
    // Semi-major axis (very small variation)
    planet.semiMajorAxis = 57909050 - 0.0036 * T;

    // Eccentricity
    planet.eccentricity = 0.2056317 + 0.0002123 * T - 0.000000039 * T * T;

    // Inclination (degrees)
    planet.orbitalInclination = 7.00487 - 0.0059 * T + 0.0000008 * T * T;

    // Longitude of ascending node (degrees)
    planet.longitudeOfAscendingNode = 48.33167 - 0.1254229 * T;

    // Argument of perihelion (degrees) - excluding relativistic effects
    if (!planet.initialArgumentOfPerihelion) {
      planet.initialArgumentOfPerihelion = 29.124 + 0.26938 * T;
      planet.argumentOfPerihelion = planet.initialArgumentOfPerihelion;
    }

    // Enable relativistic precession (most significant for Mercury)
    planet.hasRelativisticPrecession = true;
  }

  /**
   * Update Venus's orbital elements for given epoch
   */
  private updateVenusElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 108208930 - 0.0011 * T;
    planet.eccentricity = 0.006773 - 0.000047 * T;
    planet.orbitalInclination = 3.39471 + 0.0008 * T;
    planet.longitudeOfAscendingNode = 76.68069 - 0.278008 * T;
    planet.argumentOfPerihelion = 54.85229 + 0.1317 * T;

    // Small but measurable relativistic precession
    planet.hasRelativisticPrecession = true;
  }

  /**
   * Update Earth's orbital elements for given epoch
   */
  private updateEarthElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 149597890 - 0.0003 * T;
    planet.eccentricity = 0.01671123 - 0.0000004 * T;
    planet.orbitalInclination = 0.00005 + 0.013 * T;
    planet.longitudeOfAscendingNode = 174.873 + 0.0 * T; // Reference plane is Earth's orbit
    planet.argumentOfPerihelion = 288.064 + 0.00085 * T;
    planet.obliquityToOrbit = 23.439 - 0.00256 * T; // Axial tilt decreases over time

    // Apply relativistic precession
    planet.hasRelativisticPrecession = true;
  }

  /**
   * Update Mars's orbital elements for given epoch
   */
  private updateMarsElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 227936640 + 0.0001 * T;
    planet.eccentricity = 0.0934 + 0.000092 * T;
    planet.orbitalInclination = 1.85 - 0.0061 * T;
    planet.longitudeOfAscendingNode = 49.57854 - 0.2949846 * T;
    planet.argumentOfPerihelion = 286.5016 + 0.70916 * T;

    // Apply relativistic precession
    planet.hasRelativisticPrecession = true;
  }

  /**
   * Update Jupiter's orbital elements for given epoch
   */
  private updateJupiterElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 778547200;
    planet.eccentricity = 0.0489 + 0.000164 * T;
    planet.orbitalInclination = 1.3053 - 0.00358 * T;
    planet.longitudeOfAscendingNode = 100.55615 + 0.4155 * T;
    planet.argumentOfPerihelion = 273.8777 + 1.0211 * T;
  }

  /**
   * Update Saturn's orbital elements for given epoch
   */
  private updateSaturnElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 1433449370;
    planet.eccentricity = 0.0565 - 0.00015 * T;
    planet.orbitalInclination = 2.4845 - 0.00372 * T;
    planet.longitudeOfAscendingNode = 113.71504 - 0.2566722 * T;
    planet.argumentOfPerihelion = 339.3939 + 2.9544 * T;
  }

  /**
   * Update Uranus's orbital elements for given epoch
   */
  private updateUranusElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 2870658186;
    planet.eccentricity = 0.046381 + 0.000019 * T;
    planet.orbitalInclination = 0.772556 - 0.0002 * T;
    planet.longitudeOfAscendingNode = 74.22988 + 0.0741461 * T;
    planet.argumentOfPerihelion = 96.7 + 0.556 * T;
  }

  /**
   * Update Neptune's orbital elements for given epoch
   */
  private updateNeptuneElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 4498396441;
    planet.eccentricity = 0.0097 + 0.000007 * T;
    planet.orbitalInclination = 1.7679 - 0.00003 * T;
    planet.longitudeOfAscendingNode = 131.7806 - 0.0061 * T;
    planet.argumentOfPerihelion = 272.8461 - 0.6365 * T;
  }

  /**
   * Update Pluto's orbital elements for given epoch
   */
  private updatePlutoElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 5906380624;
    planet.eccentricity = 0.2488 + 0.00002 * T;
    planet.orbitalInclination = 17.16 + 0.001 * T;
    planet.longitudeOfAscendingNode = 110.30347 - 0.0155611 * T;
    planet.argumentOfPerihelion = 113.834 + 0.159 * T;
  }

  /**
   * Get current Julian Date
   */
  get julianDate(): number {
    return this._julianDate;
  }

  /**
   * Get Julian centuries since J2000 epoch (T)
   * Used in many astronomical formulas
   */
  get julianCenturies(): number {
    return (this._julianDate - AstronomicalTime.J2000_EPOCH) / 36525.0;
  }

  /**
   * Set simulation time scale factor
   * @param scale Time acceleration factor (1.0 = real time)
   */
  set timeScale(scale: number) {
    this._timeScale = Math.max(0, scale); // Prevent negative time
  }

  /**
   * Get current time scale factor
   */
  get timeScale(): number {
    return this._timeScale;
  }

  /**
   * Get formatted date string
   */
  public getFormattedDate(): string {
    const date = this.julianToDate(this._julianDate);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  /**
   * Set the simulation date
   * @param date New date to set
   */
  public setDate(date: Date): void {
    this._julianDate = this.dateToJulian(date);
    this._lastRealTime = Date.now();
  }

  /**
   * Advance simulation by a specific amount of time
   * @param days Number of days to advance
   */
  public advanceTime(days: number): void {
    this._julianDate += days;
    this._lastRealTime = Date.now();
  }
}
