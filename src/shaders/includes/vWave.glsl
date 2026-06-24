// float waveY(float x, float z) {
//   float t  = uTime * uSpeed;
//   float w1 = sin(x * 0.8 + t * 0.9) * sin(z * 0.6 + t * 0.7);
//   float w2 = sin((x + z) * 1.4 + t * 1.3) * cos((x - z) * 1.1 + t) * 0.4;
//   float w3 = sin(x * 3.0 + t * 2.2) * sin(z * 2.8 + t * 1.9) * 0.15;
//   float r  = length(vec2(x, z));
//   float w4 = sin(r * 0.5 - t * 1.5) * exp(-r * 0.08) * 0.5;
//   return (w1 + w2 + w3 + w4) * uHeight;
// }

vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient Noise 2D by Inigo Quilez
float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x), mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

// Non-tiling wave function using Fractal Brownian Motion (fBm)
float waveY(float x, float z) {
    vec2 p = vec2(x, z);
    float t = uTime * uSpeed;

    float amplitude = 1.0;
    float frequency = 0.2;
    float totalWave = 0.0;

    // Octave 1: Large, rolling swells
    // Adding time directly to the coordinates creates a directional current
    totalWave += noise2D(p * frequency + vec2(t * 0.4, t * 0.3)) * amplitude;

    // Octave 2: Medium choppy waves
    // We rotate the coordinates slightly using prime scales to prevent alignment
    amplitude *= 0.4;
    frequency *= 2.31; // Non-integer scaling prevents repetition
    totalWave += noise2D(p * frequency + vec2(-t * 0.6, t * 0.5)) * amplitude;

    // Octave 3: Small surface ripples
    amplitude *= 0.35;
    frequency *= 2.73;
    totalWave += noise2D(p * frequency + vec2(t * 0.9, -t * 0.8)) * amplitude;

    // Optional: Keep your original radial ripple for a "splash/impact" center point
    float r = length(p);
    float radialWave = sin(r * 0.4 - t * 1.5) * exp(-r * 0.06) * 0.3;

    return (totalWave + radialWave) * uHeight * 6.0;
}

vec3 calcNormal(vec2 uv) {
    float e = 0.01;
    float hL = waveY(uv.x - e, uv.y);
    float hR = waveY(uv.x + e, uv.y);
    float hD = waveY(uv.x, uv.y - e);
    float hU = waveY(uv.x, uv.y + e);
    vec3 tangentX = normalize(vec3(2.0 * e, 0.0, (hR - hL) * 3.0));
    vec3 tangentY = normalize(vec3(0.0, 2.0 * e, (hU - hD) * 3.0));
    return normalize(cross(tangentX, tangentY));
}