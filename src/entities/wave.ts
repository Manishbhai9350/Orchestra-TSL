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
import { Debug } from "../utils/debug";
import { Mirror } from "./reflector";

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
  private spot!: SpotLight;
  private debug!: Debug;
  private mirror!: Mirror;
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
    const baseGeo = new PlaneGeometry(50, 70, 150, 150);
    this.baseMat = new CustomShaderMaterial({
      baseMaterial: MeshStandardMaterial,
      color: 0x000000,
      roughness: .57,
      metalness: 0,
      // wireframe: true,
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      // uniforms
    });

    const base = new Mesh(baseGeo, this.baseMat);

    base.position.set(0,0,25)
    base.rotation.x = -Math.PI / 2;

    // this.scene.add(base);

    const debug = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial({ color: 0xff4323 }),
    );

    debug.position.set(0, 4, 40);

    const point = new PointLight("orange", 50000,30,2);

    point.position.set(0, 7, 30);

    // this.scene.add(debug, point);

    this.spot = new SpotLight(0xffffff, 20, 2000, .1, 1, 0.3);

    this.spot.position.set(-2, 3, -40);
    this.spot.target = debug;
    const spotHelp = new SpotLightHelper(this.spot, "yellow");

    this.scene.add(this.spot, spotHelp);

    this.mirror = new Mirror(this.scene);

    this.addDebug();
  }

  addDebug(){
    this.debug = Debug.getInstance();

    // this.debug.add({
    //   folder:"Light",
    //   object: this.spot,
    //   key:'intensity',
    //   options:{
    //     min:0,
    //     max:1000,
    //     step:10
    //   }
    // })



    // this.debug.add({
    //   folder:"Wave",
    //   object: this.baseMat,
    //   key:'roughness',
    //   options:{
    //     min:0,
    //     max:1,
    //     step:.001
    //   }
    // })
    // this.debug.add({
    //   folder:"Wave",
    //   object: this.baseMat,
    //   key:'metalness',
    //   options:{
    //     min:0,
    //     max:1,
    //     step:.001
    //   }
    // })


  }

  update(dt: number) {
    // this.uniforms.uTime.value += dt;
    this.mirror.update(dt);
  }
}
