uniform float uTime;
uniform float uSpeed;
uniform float uHeight;

varying vec2 vUv;

#include ../includes/vWave.glsl


void main() {
    csm_FragNormal = calcNormal(vUv);

//   csm_FragColor = vec4(calcNormal(vUv) * 0.5 + 0.5, 1.0);
}