import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SpotLight,
  SpotLightHelper,
  Uniform,
  Vector3,
  type IUniform,
  type Scene,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from '../shaders/water2/vertex.glsl'
import fragmentShader from '../shaders/water2/fragment.glsl'

interface WaveUniforms {
  uTime: Uniform<number>;
  uSpeed: Uniform<number>;
  uHeight: Uniform<number>;
  uEpsilon: Uniform<number>;
  uFresnelPow: Uniform<number>;
  uDeepColor: Uniform<Color>;
  uShallowColor: Uniform<Color>;
  uGlintColor: Uniform<Color>;
}

export class Wave {
  private scene: Scene;
  private baseMat!: CustomShaderMaterial<typeof MeshStandardMaterial>;
  private uniforms!: WaveUniforms;
  constructor(scene: Scene) {
    this.scene = scene;

    this.init();
  }

  init() {
    this.uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 0.4 },
      uHeight: { value: .3 },
      uEpsilon: { value: 0.02 }, // larger = smoother normals
      uFresnelPow: { value: 6.0 },
      uDeepColor: { value: new Color(0.01, 0.01, 0.015) },
      uShallowColor: { value: new Color(0.1, 0.07, 0.04) },
      uGlintColor: { value: new Color(0.8, 0.5, 0.2) },
    };
    const baseGeo = new PlaneGeometry(50, 70, 100, 200);
    this.baseMat = new CustomShaderMaterial({
      baseMaterial: MeshStandardMaterial,
      color: 0x000000,
      roughness: 0.1,
      metalness: 0,
      //   wireframe: true,
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      // uniforms
    });

    const base = new Mesh(baseGeo, this.baseMat);

    base.position.set(0,0,25)
    base.rotation.x = -Math.PI / 2;

    this.scene.add(base);

    const debug = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial({ color: 0xff4323 }),
    );

    debug.position.set(0, 1, 40);

    const point = new PointLight("orange", 10000);

    point.position.set(-7, 3, 20);

    this.scene.add(debug, point);

    const spot = new SpotLight(0xffffff, 200, 1000, .6, 0.1, 0.3);

    this.scene.add(new AmbientLight(0xffffff, 100));

    spot.position.set(-2, 3, 0);
    spot.target = debug;
    const spotHelp = new SpotLightHelper(spot, "yellow");

    this.scene.add(spot, spotHelp);
  }

  update(dt: number) {
    this.uniforms.uTime.value += dt;
  }
}
