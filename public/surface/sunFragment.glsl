
const fragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;

uniform float surfaceTemperature;
uniform float luminosity;
uniform float magneticField;

vec3 blackbody(float temperature) {
    vec3 color = vec3(0.0);
    color.r = pow(temperature / 6580.0, -0.133);
    color.g = pow(temperature / 6580.0, -0.755);
    color.b = pow(temperature / 6580.0, -0.407);
    color = clamp(color, 0.0, 1.0);
    return color;
}

vec2 rotate2d(vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

vec3 magneticFieldColor(vec3 color, vec3 position, float magneticField) {
    vec2 st = rotate2d(position.xy, magneticField);
    vec3 dark = vec3(0.2, 0.2, 0.2);
    return mix(dark, color, smoothstep(0.25, 0.35, length(st)));
}

void main() {
    float intensity = dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );
    vec3 sunColor = blackbody(surfaceTemperature);
    sunColor = magneticFieldColor(sunColor, vPosition, magneticField);
    gl_FragColor = vec4( sunColor * intensity * luminosity, 1.0 );
}

`;
