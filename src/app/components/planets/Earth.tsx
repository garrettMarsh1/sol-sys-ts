import * as THREE from 'three';
import Sun from './Sun';

const vertexShader = `
precision highp float;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vDebugColor;

void main() {
    vDebugColor = vWorldPosition;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform sampler2D earthMap;
uniform sampler2D nightMap;
uniform vec3 lightPos;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vec4 dayColor = texture2D(earthMap, vUv);
    vec4 nightColor = texture2D(nightMap, vUv);
    vec3 lightDirection = normalize(lightPos - vWorldPosition);
    float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
    vec4 finalColor = mix(nightColor, dayColor, lightIntensity);
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}
`;

const cloudVertexShader = `
precision highp float;
varying vec2 vUv;
uniform float time;

void main() {
    vUv = uv;
    vec3 transformed = vec3(position);
    transformed.x += 0.1 * sin(2.0 * 3.14159 * time);
    transformed.y += 0.1 * cos(2.0 * 3.14159 * time);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const cloudFragmentShader = `
precision highp float;
uniform vec3 cloudColor;
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(cloudColor, 0.5);
}
`;

const atmosphereVertexShader = `
precision highp float;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
precision highp float;
uniform vec3 atmosphereColor;
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(atmosphereColor, 0.5);
}
`;

class Earth {
    public name: string;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public mass: number;
    public diameter: number;
    public density: number;
    public gravity: number;
    public escapeVelocity: number;
    public rotationPeriod: number;
    public lengthOfDay: number;
    public distanceFromSun: number;
    public perihelion: number;
    public aphelion: number;
    public orbitalPeriod: number;
    public orbitalVelocity: number;
    public orbitalInclination: number;
    public orbitalEccentricity: number;
    public obliquityToOrbit: number;
    public meanTemperature: number;
    public surfacePressure: number;
    public numberOfMoons: number;
    public hasRingSystem: boolean;
    public hasGlobalMagneticField: boolean;
    public texture: THREE.Texture;
    public nightTexture: THREE.Texture;
    public cloudTexture: THREE.Texture;
    public semiMajorAxis: number;
    public semiMinorAxis: number;
    public eccentricity: number;
    public meanAnomaly: number;
    public centralBody: number;
    public surfaceTemperature: number;
    public magneticField: { polar: number; equatorial: number };
    public atmosphere: { layers: { name: string; temperature: number; pressure: number }[] };
    public earthParent: THREE.Object3D;
    public material: THREE.ShaderMaterial;
    public mesh: THREE.Mesh;
    public cloudMesh: THREE.Mesh;
    public atmosphereMesh: THREE.Mesh;
    public lastUpdateTime: number;

    constructor() {
        this.name = "Earth";
        this.position = new THREE.Vector3(149597890, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 5.972e24; // kg
        this.diameter = 12742; // km
        this.density = 5514; // kg/m^3
        this.gravity = 9.807; // m/s^2
        this.escapeVelocity = 11.186; // km/s
        this.rotationPeriod = 1; // days
        this.lengthOfDay = 24; // hours
        this.distanceFromSun = 149597890; // km
        this.perihelion = 147095000; // km
        this.aphelion = 152100000; // km
        this.orbitalPeriod = 365.256; // days
        this.orbitalVelocity = 29.78; // km/s
        this.orbitalInclination = 0.0; // degrees
        this.orbitalEccentricity = 0.0167; // unitless
        this.obliquityToOrbit = 23.439; // degrees
        this.meanTemperature = 288; // K
        this.surfacePressure = 101325; // Pa
        this.numberOfMoons = 1; // unitless
        this.hasRingSystem = false; // boolean
        this.hasGlobalMagneticField = true; // boolean
        this.texture = new THREE.TextureLoader().load('images/earth.jpeg');
        this.nightTexture = new THREE.TextureLoader().load('images/8k_earth_nightmap.jpeg');
        this.cloudTexture = new THREE.TextureLoader().load('images/earthClouds.jpeg');
        this.semiMajorAxis = (this.aphelion + this.perihelion) / 2; // a = (r_max + r_min) / 2
        this.semiMinorAxis = Math.sqrt(this.aphelion * this.perihelion); // b = sqrt(r_max * r_min)
        this.eccentricity = this.orbitalEccentricity; // e = (r_max - r_min) / (r_max + r_min)
        this.meanAnomaly = 0; // M = 0
        this.centralBody = Sun.mass;
        this.surfaceTemperature = 288; // K
        this.rotationPeriod = 1; // days
        this.magneticField = {
            polar: 2e-5,
            equatorial: 4e-5
        };
        this.atmosphere = {
            layers: [
                {
                    name: "troposphere",
                    temperature: 288,
                    pressure: 101325
                },
                {
                    name: "stratosphere",
                    temperature: 216,
                    pressure: 22632
                },
                {
                    name: "mesosphere",
                    temperature: 186,
                    pressure: 5474
                },
                {
                    name: "thermosphere",
                    temperature: 186,
                    pressure: 5474
                }
            ]
        };
        this.earthParent = new THREE.Object3D();
        
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                earthMap: { value: this.texture },
                nightMap: { value: this.nightTexture },
                lightPos: { value: new THREE.Vector3(0, 0, 0) } // Sun position
            }
        });

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2, 64, 64),
            this.material
        );
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        this.cloudMesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2 + 2.1, 64, 64),
            new THREE.ShaderMaterial({
                vertexShader: cloudVertexShader,
                fragmentShader: cloudFragmentShader,
                uniforms: {
                    cloudColor: { value: new THREE.Color(0x000000) }, // Black color for clouds
                    time: { value: 0 }
                },
                transparent: true,
                blending: THREE.NormalBlending
            })
        );
        this.cloudMesh.position.set(this.position.x, this.position.y, this.position.z);

        this.atmosphereMesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.diameter / 2 + 5, 64, 64),
            new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: atmosphereFragmentShader,
                uniforms: {
                    atmosphereColor: { value: new THREE.Color(0xffc0cb) } // Pink color for the atmosphere
                },
                side: THREE.BackSide,
                transparent: true,
                blending: THREE.AdditiveBlending
            })
        );
        this.atmosphereMesh.position.set(this.position.x, this.position.y, this.position.z);

        this.earthParent = new THREE.Object3D();
        this.earthParent.add(this.mesh);
        this.earthParent.add(this.cloudMesh);
        this.earthParent.add(this.atmosphereMesh);
        this.earthParent.lookAt(new THREE.Vector3(10, 0, 0));

        this.velocity = new THREE.Vector3(0, this.solveKepler(this.meanAnomaly, this.eccentricity), 0);

        this.lastUpdateTime = Date.now();
    }

    calculateForce() {
        const sunMass = Sun.mass;
        const distance = this.mesh.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const forceMagnitude = (6.67430e-11 * sunMass * this.mass) / (distance * distance);
        const forceDirection = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.mesh.position).normalize();
        return forceDirection.multiplyScalar(forceMagnitude);
    }

    solveKepler(M: number, e: number) {
        let E = M;
        let delta = 1;
        while (delta > 1e-6) {
            delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            E -= delta;
        }
        return E;
    }

    calculateOrbit() {
        const elapsedTime = (Date.now() - this.lastUpdateTime) / 1000; // Time in seconds
        this.lastUpdateTime = Date.now();

        const meanMotion = 2 * Math.PI / this.orbitalPeriod; // Mean motion (radians per day)
        this.meanAnomaly += meanMotion * (elapsedTime / 86400); // Update mean anomaly

        const E = this.solveKepler(this.meanAnomaly, this.eccentricity);
        const x = this.semiMajorAxis * (Math.cos(E) - this.eccentricity);
        const y = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity ** 2) * Math.sin(E);
        const z = 0; // Assuming orbit in the xy-plane

        this.mesh.position.set(x, y, z);
        this.earthParent.position.set(x, y, z);
        this.cloudMesh.position.set(x, y, z);
    }

    update() {
        this.calculateOrbit();
        this.material.uniforms.lightPos.value.set(0, 0, 0); // Ensure light position is set correctly
        this.mesh.rotation.y += (2 * Math.PI) / (24 * 60 * 60); // Full rotation in 24 hours
    }
}

export default Earth;
