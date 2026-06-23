uniform float uTime;
uniform float uSpeed;
uniform float uHeight;

varying vec2 vUv;

#include ../includes/vWave.glsl

void main() {
    vUv = uv * 30.0;

    float h = waveY(vUv.x, vUv.y);
    csm_Position.z += h * 10.0;
    csm_Normal = calcNormal(vUv);
}