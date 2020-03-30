precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;
uniform sampler2D uTexture;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main(void) {
    // diffuse contribution
    // 1. normalize the light direction and store in a separate variable
    vec3 nLightDirection = normalize(uLightPosition - vWorldPosition);
    // 2. normalize the world normal and store in a separate variable
    vec3 nWorldNormal = normalize(vWorldNormal);
    // 3. calculate the lambert term
    float lambertian = max(dot(nWorldNormal, nLightDirection), 0.0);

    vec3 diffuseValue = texture2D(uTexture, vTexcoords).rgb * lambertian;

    gl_FragColor = vec4(diffuseValue, 1.0);
}
