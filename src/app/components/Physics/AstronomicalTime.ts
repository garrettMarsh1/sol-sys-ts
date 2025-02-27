import { Planet } from "../Interface/PlanetInterface";


export default class AstronomicalTime {
    private static readonly J2000_EPOCH = 2451545.0;

    private _julianDate: number;

    private _timeScale: number = 1.0;

    private _lastRealTime: number;

    private _referenceEpoch: number;

  
  constructor(
    initialDate: Date = new Date(),
    referenceEpoch: number = AstronomicalTime.J2000_EPOCH
  ) {
    this._julianDate = this.dateToJulian(initialDate);
    this._lastRealTime = Date.now();
    this._referenceEpoch = referenceEpoch;
  }

  
  private dateToJulian(date: Date): number {
        const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();

            let year = y;
    let month = m;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }

        const a = Math.floor(year / 100);
    const b = a / 4;
    const c = 2 - a + Math.floor(b);

        const jdn =
      Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) +
      d +
      c -
      1524.5;

        const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const milliseconds = date.getUTCMilliseconds();

    const dayFraction =
      (hours + minutes / 60 + seconds / 3600 + milliseconds / 3600000) / 24;

    return jdn + dayFraction;
  }

  
  public julianToDate(julianDate: number): Date {
        const jdn = Math.floor(julianDate + 0.5);

        const dayFraction = julianDate + 0.5 - jdn;

        let a = jdn;

        if (jdn >= 2299161) {
      const alpha = Math.floor((jdn - 1867216.25) / 36524.25);
      a = jdn + 1 + alpha - Math.floor(alpha / 4);
    }

    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);

        const day = b - d - Math.floor(30.6001 * e) + dayFraction;
    let month = e < 14 ? e - 1 : e - 13;
    let year = month > 2 ? c - 4716 : c - 4715;

        const totalHours = dayFraction * 24;
    const hours = Math.floor(totalHours);
    const totalMinutes = (totalHours - hours) * 60;
    const minutes = Math.floor(totalMinutes);
    const totalSeconds = (totalMinutes - minutes) * 60;
    const seconds = Math.floor(totalSeconds);
    const milliseconds = Math.round((totalSeconds - seconds) * 1000);

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

  
  public update(currentRealTime: number = Date.now()): number {
        const elapsedRealSeconds = (currentRealTime - this._lastRealTime) / 1000;
    this._lastRealTime = currentRealTime;

        const elapsedSimSeconds = elapsedRealSeconds * this._timeScale;

        const elapsedJulianDays = elapsedSimSeconds / 86400;

        this._julianDate += elapsedJulianDays;

        return elapsedSimSeconds;
  }

  
  public updateOrbitalElements(planet: Planet): void {
        const T = this.julianCenturies;

        if (planet.name === "Sun") return;

            switch (planet.name) {
      case "Mercury":
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

        if (planet.hasRelativisticPrecession) {
      this.applyRelativisticPrecession(planet, T);
    }
  }

  
  private applyRelativisticPrecession(planet: Planet, T: number): void {
    if (!planet.initialArgumentOfPerihelion) {
      planet.initialArgumentOfPerihelion = planet.argumentOfPerihelion || 0;
    }

        if (!planet.precessionRate) {
                        const semiMajorAxisAU = planet.semiMajorAxis / 149597870.7;       const orbitalPeriodYears = planet.orbitalPeriod / 365.25; 
            planet.precessionRate =
        43.03 *         (1 / semiMajorAxisAU) *         (1 / (1 - planet.eccentricity * planet.eccentricity));     }

        if (!planet.cumulativePrecession) planet.cumulativePrecession = 0;

        planet.cumulativePrecession = planet.precessionRate * T;

        if (planet.initialArgumentOfPerihelion !== undefined) {
      planet.argumentOfPerihelion =
        planet.initialArgumentOfPerihelion + planet.cumulativePrecession / 3600;     }
  }

  
  private updateMercuryElements(planet: Planet, T: number): void {
            planet.semiMajorAxis = 57909050 - 0.0036 * T;

        planet.eccentricity = 0.2056317 + 0.0002123 * T - 0.000000039 * T * T;

        planet.orbitalInclination = 7.00487 - 0.0059 * T + 0.0000008 * T * T;

        planet.longitudeOfAscendingNode = 48.33167 - 0.1254229 * T;

        if (!planet.initialArgumentOfPerihelion) {
      planet.initialArgumentOfPerihelion = 29.124 + 0.26938 * T;
      planet.argumentOfPerihelion = planet.initialArgumentOfPerihelion;
    }

        planet.hasRelativisticPrecession = true;
  }

  
  private updateVenusElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 108208930 - 0.0011 * T;
    planet.eccentricity = 0.006773 - 0.000047 * T;
    planet.orbitalInclination = 3.39471 + 0.0008 * T;
    planet.longitudeOfAscendingNode = 76.68069 - 0.278008 * T;
    planet.argumentOfPerihelion = 54.85229 + 0.1317 * T;

        planet.hasRelativisticPrecession = true;
  }

  
  private updateEarthElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 149597890 - 0.0003 * T;
    planet.eccentricity = 0.01671123 - 0.0000004 * T;
    planet.orbitalInclination = 0.00005 + 0.013 * T;
    planet.longitudeOfAscendingNode = 174.873 + 0.0 * T;     planet.argumentOfPerihelion = 288.064 + 0.00085 * T;
    planet.obliquityToOrbit = 23.439 - 0.00256 * T; 
        planet.hasRelativisticPrecession = true;
  }

  
  private updateMarsElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 227936640 + 0.0001 * T;
    planet.eccentricity = 0.0934 + 0.000092 * T;
    planet.orbitalInclination = 1.85 - 0.0061 * T;
    planet.longitudeOfAscendingNode = 49.57854 - 0.2949846 * T;
    planet.argumentOfPerihelion = 286.5016 + 0.70916 * T;

        planet.hasRelativisticPrecession = true;
  }

  
  private updateJupiterElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 778547200;
    planet.eccentricity = 0.0489 + 0.000164 * T;
    planet.orbitalInclination = 1.3053 - 0.00358 * T;
    planet.longitudeOfAscendingNode = 100.55615 + 0.4155 * T;
    planet.argumentOfPerihelion = 273.8777 + 1.0211 * T;
  }

  
  private updateSaturnElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 1433449370;
    planet.eccentricity = 0.0565 - 0.00015 * T;
    planet.orbitalInclination = 2.4845 - 0.00372 * T;
    planet.longitudeOfAscendingNode = 113.71504 - 0.2566722 * T;
    planet.argumentOfPerihelion = 339.3939 + 2.9544 * T;
  }

  
  private updateUranusElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 2870658186;
    planet.eccentricity = 0.046381 + 0.000019 * T;
    planet.orbitalInclination = 0.772556 - 0.0002 * T;
    planet.longitudeOfAscendingNode = 74.22988 + 0.0741461 * T;
    planet.argumentOfPerihelion = 96.7 + 0.556 * T;
  }

  
  private updateNeptuneElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 4498396441;
    planet.eccentricity = 0.0097 + 0.000007 * T;
    planet.orbitalInclination = 1.7679 - 0.00003 * T;
    planet.longitudeOfAscendingNode = 131.7806 - 0.0061 * T;
    planet.argumentOfPerihelion = 272.8461 - 0.6365 * T;
  }

  
  private updatePlutoElements(planet: Planet, T: number): void {
    planet.semiMajorAxis = 5906380624;
    planet.eccentricity = 0.2488 + 0.00002 * T;
    planet.orbitalInclination = 17.16 + 0.001 * T;
    planet.longitudeOfAscendingNode = 110.30347 - 0.0155611 * T;
    planet.argumentOfPerihelion = 113.834 + 0.159 * T;
  }

  
  get julianDate(): number {
    return this._julianDate;
  }

  
  get julianCenturies(): number {
    return (this._julianDate - AstronomicalTime.J2000_EPOCH) / 36525.0;
  }

  
  set timeScale(scale: number) {
    this._timeScale = Math.max(0, scale);   }

  
  get timeScale(): number {
    return this._timeScale;
  }

  
  public getFormattedDate(): string {
    const date = this.julianToDate(this._julianDate);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  
  public setDate(date: Date): void {
    this._julianDate = this.dateToJulian(date);
    this._lastRealTime = Date.now();
  }

  
  public advanceTime(days: number): void {
    this._julianDate += days;
    this._lastRealTime = Date.now();
  }
}
