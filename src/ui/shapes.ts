import {
  Color,
  IcosahedronGeometry,
  Mesh,
  OctahedronGeometry,
  Scene,
  TorusKnotGeometry,
} from "three";
import {
  AmbientLight,
  DirectionalLight,
  MeshPhysicalNodeMaterial,
  Node,
} from "three/webgpu";
import {
  Fn,
  float,
  mix,
  positionLocal,
  sin,
  step,
  time,
  uniform,
  vec3,
} from "three/tsl";
import { Debug } from "../utils/debug";

// Debug.add/addColor are typed against Record<string, unknown>, but TSL
// uniform nodes and class instances don't carry an index signature —
// this cast is just satisfying that generic constraint, nothing unsafe
// happens at runtime since we're still passing the real object through.
const asBindable = <T>(value: T) => value as unknown as Record<string, unknown>;

type ShapeSpec = {
  geometry: InstanceType<
    | typeof IcosahedronGeometry
    | typeof TorusKnotGeometry
    | typeof OctahedronGeometry
  >;
  position: [number, number, number];
  color: Color;
};

/**
 * A few scattered geometries that dissolve in/out through a shared
 * noise field, with a glowing "burn" edge right at the cutoff —
 * classic dissolve-shader look, done with TSL nodes instead of GLSL
 * strings so every parameter below is just a uniform Tweakpane can
 * scrub live.
 *
 * MeshPhysicalNodeMaterial gives each shape its own base color, plus
 * roughness/metalness driven by a second, non-time-varying noise field
 * so the surface reads as worn/patchy rather than uniformly matte or
 * uniformly metallic.
 *
 * Note: both noise fields are cheap trig-wave pseudo-noise (no external
 * noise lib dependency), not true Perlin/Simplex. Swap in
 * mx_noise_float(...) from "three/tsl" if you want the real thing.
 */
export class Shapes {
  private meshes: Mesh[] = [];
  private lights: (AmbientLight | DirectionalLight)[] = [];
  private scene: Scene;

  private progress = uniform(0);
  private edgeWidth = uniform(0.01);
  private edgeColor = uniform(new Color(0xfdf500));
  private autoAnimate = true;

  constructor(scene: Scene) {
    this.scene = scene;

    const specs: ShapeSpec[] = [
      {
        geometry: new IcosahedronGeometry(0.35, 0),
        position: [-2.4, 0.6, -0.4],
        color: new Color(0xff4d6d), // rose
      },
      {
        geometry: new TorusKnotGeometry(0.28, 0.09, 100, 16),
        position: [2, -0.3, -0.6],
        color: new Color(0x2dd4bf), // teal
      },
      {
        geometry: new OctahedronGeometry(0.32, 0),
        position: [0.9, 1.4, -1.0],
        color: new Color(0xf59e0b), // amber
      },
    ];

    // Dissolve mask noise — three overlapping sine waves along
    // object-space position, offset by time.
    const dissolveNoise = Fn(([p]: [Node<"vec3">]) => {
      return sin(p.x.mul(3.1).add(time.mul(0.3)))
        .mul(sin(p.y.mul(2.7).sub(time.mul(0.2))))
        .mul(sin(p.z.mul(4.3).add(time.mul(0.25))))
        .add(1.0)
        .mul(0.5);
    });

    // Material noise — same idea but static (no time term) and higher
    // frequency, so it reads as surface grain rather than something
    // that pulses in sync with the dissolve.
    const materialNoise = Fn(([p]: [Node<"vec3">]) => {
      return sin(p.x.mul(9.0))
        .mul(sin(p.y.mul(7.0)))
        .mul(sin(p.z.mul(11.0)))
        .add(1.0)
        .mul(0.5);
    });

    // Lights once, not per shape — the previous version created a
    // fresh AmbientLight + DirectionalLight on every loop iteration,
    // which stacked three of each into the scene.
    const ambient = new AmbientLight(0xffffff, 2);
    const dir = new DirectionalLight(0xffffff, 2);
    dir.position.set(2, 2, 2);
    this.scene.add(ambient, dir);
    this.lights.push(ambient, dir);

    for (const spec of specs) {
      const material = new MeshPhysicalNodeMaterial({
        clearcoat: 0.25,
        clearcoatRoughness: 0.3,
      });

      const noiseVal = dissolveNoise(positionLocal);

      // Visible where noiseVal >= progress; dissolved below it.
      const mask = step(this.progress, noiseVal);
      // A thin band just above the cutoff — the part still visible
      // but about to vanish, where the glow lives.
      const band = step(this.progress, noiseVal).mul(
        step(noiseVal, this.progress.add(this.edgeWidth)),
      );

      // Offset the metalness sample so it doesn't track the roughness
      // pattern 1:1 — keeps the two from looking like the same map.
      const roughnessSample = materialNoise(positionLocal);
      const metalnessSample = materialNoise(positionLocal.add(vec3(4.7, 1.3, 8.2)));

      material.colorNode = vec3(spec.color.r, spec.color.g, spec.color.b);
      material.roughnessNode = mix(float(0.15), float(0.9), roughnessSample);
      material.metalnessNode = mix(float(0.0), float(1.0), metalnessSample);
      material.opacityNode = mask;
      material.emissiveNode = this.edgeColor.mul(band).mul(2.0);
      material.transparent = false;
      material.alphaTest = 0.5; // true cutout, not blended — keeps depth sorting correct

      const mesh = new Mesh(spec.geometry, material);
      mesh.position.set(...spec.position);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    this.setupPane();
  }

  private setupPane() {
    const debug = Debug.getInstance();
    const FOLDER = "Dissolve Shapes";

    debug.add({
      folder: FOLDER,
      object: asBindable(this),
      key: "autoAnimate",
      options: { label: "auto animate" },
    });

    debug.add({
      folder: FOLDER,
      object: asBindable(this.progress),
      key: "value",
      options: { label: "progress", min: 0, max: 1, step: 0.01 },
      onChange: () => {
        this.autoAnimate = false; // manual scrubbing takes over
      },
    });

    debug.add({
      folder: FOLDER,
      object: asBindable(this.edgeWidth),
      key: "value",
      options: { label: "edge width", min: 0.01, max: 0.3, step: 0.01 },
    });

    debug.separator(FOLDER);

    // initialColor IS this.edgeColor.value — addColor mutates it in
    // place on change, so the shader uniform updates with no extra
    // wiring on our end.
    debug.addColor({
      folder: FOLDER,
      label: "edge color",
      initialColor: this.edgeColor.value,
      onChange: () => {},
    });

    debug.button({
      folder: FOLDER,
      label: "reset",
      onClick: () => {
        this.progress.value = 0;
        this.edgeWidth.value = 0.01;
        this.autoAnimate = true;
      },
    });
  }

  update(delta: number) {
    if (this.autoAnimate) {
      this.progress.value = (Math.sin(performance.now() * 0.0006) + 1) / 2;
    }
    for (const mesh of this.meshes) {
      mesh.rotation.x += delta * 0.15;
      mesh.rotation.y += delta * 0.2;
    }
  }

  dispose() {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as MeshPhysicalNodeMaterial).dispose();
    }
    for (const light of this.lights) {
      this.scene.remove(light);
    }
  }
}