import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  Scene,
} from "three";
import { PointsNodeMaterial } from "three/webgpu";
import {
  Fn,
  attribute,
  float,
  mix,
  positionLocal,
  sin,
  time,
  uniform,
  vec3,
  vec4,
} from "three/tsl";

const COUNT = 600;

/**
 * A drifting cloud of glowing points orbiting the origin, built with
 * TSL node materials so it sits next to Cube as another modular,
 * self-mutating entity rather than a one-off effect.
 *
 * burst() is the hook the UI's "Mutate Geometry" button calls — it
 * spikes a uniform that the position/color nodes read, so the
 * reaction is driven entirely on the GPU, no per-frame JS writes.
 */
export class Particles {
  private points: Points;
  private burstStrength = uniform(0);
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;

    const geometry = new BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const radius = 1.4 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      seeds[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("seed", new Float32BufferAttribute(seeds, 1));

    const material = new PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const seedAttr = attribute<'float'>("seed", "float");

    const drift = Fn(() => {
      const t = time.mul(0.6).add(seedAttr);
      const offset = vec3(sin(t), sin(t.mul(1.3)).mul(0.6), sin(t.mul(0.8)));
      return positionLocal.add(offset.mul(0.08).mul(this.burstStrength.add(1)));
    });

    const glow = Fn(() => {
      const pulse = sin(time.mul(2.0).add(seedAttr)).mul(0.5).add(0.5);
      const intensity = mix(float(0.25), float(1.0), pulse).mul(
        this.burstStrength.mul(2).add(1),
      );
      return vec4(vec3(0.0, 0.95, 1.0).mul(intensity), intensity);
    });

    material.positionNode = drift();
    material.colorNode = glow();
    material.sizeNode = float(3).mul(this.burstStrength.mul(4).add(1));

    this.points = new Points(geometry, material);
    this.scene.add(this.points);
  }

  /** Called from main.ts when the "mutate" bridge event fires. */
  burst() {
    this.burstStrength.value = 1;
  }

  update(delta: number) {
    if (this.burstStrength.value > 0) {
      this.burstStrength.value = Math.max(
        0,
        this.burstStrength.value - delta * 1.5,
      );
    }
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as PointsNodeMaterial).dispose();
  }
}