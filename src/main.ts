import "./style.css";
import {
  PerspectiveCamera,
  Scene,
  Color,
  LoadingManager,
  PlaneGeometry,
  RepeatWrapping,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  PMREMGenerator,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Fog,
  ACESFilmicToneMapping,
} from "three";
import { Clock } from "./Clock";
import {
  DRACOLoader,
  OrbitControls,
  Water,
} from "three/examples/jsm/Addons.js";
import { Debug } from "./utils/debug";
// import WaterVertex from "./shaders/water/vertex.glsl";
// import WaterFragment from "./shaders/water/fragment.glsl";
import { Wave } from "./entities/wave";
import Stats from "three/examples/jsm/libs/stats.module.js";

class App {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private sceneEnv = new Scene();
  private camera: PerspectiveCamera;
  private Draco = new DRACOLoader();
  private LManager = new LoadingManager();
  private TLaoder = new TextureLoader(this.LManager);
  private stats: Stats;

  public renderTarget!: WebGLRenderer;
  public pmrem!: PMREMGenerator;

  public water!: Water;

  public wave!: Wave;

  private clock: Clock;
  private controls!: OrbitControls;
  private debug = Debug.getInstance();

  private params = {
    exposure: 0.1,
  };

  private animFrameId: number = 0;
  private lastFrameTime = performance.now();
  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .3;
    
    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    // pure black — no sky
    this.scene = new Scene();
    this.scene.background = new Color(0x000000);

    this.camera = new PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      10000,
    );
    // low angle, close, slight upward tilt
    this.camera.position.set(0, 8, 60);

    this.clock = new Clock();
    this.init();
  }

  private async init() {
    this.resize();
    this.loop();

    this.wave = new Wave(this.scene);

    this.pmrem = new PMREMGenerator(this.renderer);

    // ── Water ─────────────────────────────────────────────────────────
    // const waterPlane = new PlaneGeometry(500, 1000);
    // this.water = new Water(waterPlane, {
    //   textureWidth: 512,
    //   textureHeight: 512,
    //   waterNormals: this.TLaoder.load("/textures/waternormals.jpg", (t) => {
    //     t.wrapS = t.wrapT = RepeatWrapping;
    //     t.repeat.set(10, 10);
    //   }),
    //   sunDirection: new Vector3(-0.15, 1, -1),
    //   sunColor: 0xffffff,
    //   waterColor: 0x000000,
    //   distortionScale: 0.2, // was 1.2 — this is the key, lower = smoother
    //   fog: true,
    // });

    // this.water.material.vertexShader = WaterVertex;
    // this.water.material.fragmentShader = WaterFragment;
    // this.water.material.needsUpdate = true;

    // this.water.material.onBeforeCompile(
    //   {
    //     vertexShader: WaterVertex,
    //     fragmentShader: WaterFragment,
    //   },
    //   this.renderer,
    // );
    // this.water.rotation.x = -Math.PI / 2;
    // this.scene.add(this.water);
    // After creating water, override sunDirection to get specular glint
    // this.water.material.uniforms["sunDirection"].value.set(-0.15, 0.25, -1);

    // Boost scene lights so any meshes you add are visible
    const ambient = new AmbientLight(0xffffff, 0.3); // was 0.08
    const keyLight = new DirectionalLight(0xc87040, 4); // was 2.0
    keyLight.position.set(-10, 20, 10);
    const fillLight = new DirectionalLight(0x334466, 1.0); // was 0.4
    fillLight.position.set(10, 5, -10);

    const waterGlow = new PointLight(0x8b4a1a, 3, 150); // wider range
    waterGlow.position.set(0, 2, 0);
    this.scene.add(waterGlow);

    // ── Controls ──────────────────────────────────────────────────────
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.target.set(0, 4, 0);
    this.controls.minDistance = 5.0;
    this.controls.maxDistance = 200.0;
    this.controls.update();

    this.scene.fog = new Fog(0x000000, 0, 600);

    window.addEventListener("resize", this.onResize);
    this.setupDebug();
  }

  private setupDebug() {
    return;
    const waterUniforms = this.water.material.uniforms;

    // ── Water ─────────────────────────────────────────────────────────
    this.debug
      .add({
        folder: "Water",
        object: waterUniforms.distortionScale,
        key: "value",
        options: { label: "distortionScale", min: 0, max: 4, step: 0.05 },
      })
      .add({
        folder: "Water",
        object: waterUniforms.size,
        key: "value",
        options: { label: "size", min: 0.1, max: 20, step: 0.1 },
      })
      .addColor({
        folder: "Water",
        label: "waterColor",
        initialColor: new Color(waterUniforms["waterColor"].value),
        onChange: (c) => {
          waterUniforms["waterColor"].value = c;
        },
      })
      .addColor({
        folder: "Water",
        label: "sunColor",
        initialColor: new Color(waterUniforms["sunColor"].value),
        onChange: (c) => {
          waterUniforms["sunColor"].value = c;
        },
      })
      .add({
        folder: "Water",
        object: waterUniforms.sunDirection.value, // Vector3 — bind x,y,z directly
        key: "x",
        options: { label: "sun dir x", min: -1, max: 1, step: 0.01 },
        onChange: () => waterUniforms["sunDirection"].value.normalize(),
      })
      .add({
        folder: "Water",
        object: waterUniforms.sunDirection.value,
        key: "y",
        options: { label: "sun dir y", min: -1, max: 1, step: 0.01 },
        onChange: () => waterUniforms["sunDirection"].value.normalize(),
      })
      .add({
        folder: "Water",
        object: waterUniforms.sunDirection.value,
        key: "z",
        options: { label: "sun dir z", min: -1, max: 1, step: 0.01 },
        onChange: () => waterUniforms["sunDirection"].value.normalize(),
      });
  }
  private resize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private loop() {
    this.stats.update()
    this.animFrameId = requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (this.water?.material) {
      this.water.material.uniforms["time"].value += delta * 0.6; // slow, calm
    }

    this.wave?.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.debug.dispose();
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
new App(canvas);
