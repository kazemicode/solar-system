precision mediump float;

uniform sampler2D uTexture;

varying vec2 vTexcoords; // shared with vs

void main(void) {
    gl_FragColor = texture2D(uTexture, vTexcoords);

}
