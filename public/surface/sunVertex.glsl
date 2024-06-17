
const vertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

uniform float time;
uniform float flareFrequency;
uniform float flareAmplitude;

void main() {
    vNormal = normal;
    vPosition = position;
    float flare = sin(flareFrequency * (dot(position, vec3(1.0, 0.5, 1.0)) + time));
    vPosition += normal * (flare * flareAmplitude);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}
`;

