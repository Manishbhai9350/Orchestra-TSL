import './style.css';
import "./ui/base.css";

import { Color, WebGPURenderer } from "three/webgpu";
import { PerspectiveCamera, Scene } from "three";
import { Clock } from "./Clock";
import { Cube } from "./entities/cube";
import { Particles } from "./entities/particles";
import { Shapes } from "./ui/shapes";
import { bridge } from "./ui/ui-bridge";

// ── Scene ──────────────────────────────────────────────────────────────

class App {
  private renderer: WebGPURenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private clock: Clock;
  private cube: Cube;
  private particles: Particles;
  private shapes: Shapes;
  private animFrameId: number = 0;
  private lastFrameTime = performance.now();
  private tickAccumulator = 0;

  // Bound once so dispose() can actually remove the same reference
  // that was added — the old version created a fresh arrow function
  // on each call, so the listener never got cleaned up.
  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGPURenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    this.scene = new Scene();
    this.scene.background = new Color(0x0e0d0b);

    this.camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 3);

    this.clock = new Clock();
    this.cube = new Cube(this.scene);
    this.particles = new Particles(this.scene);
    this.shapes = new Shapes(this.scene);

    bridge.on("mutate", () => this.handleMutate());

    this.init();
  }

  private async init() {
    await this.renderer.init();
    this.resize();
    this.loop();

    window.addEventListener("resize", this.onResize);
  }

  private handleMutate() {
    // Cube doesn't have a mutate() method yet in the file you pasted —
    // this cast keeps it a safe no-op until you add one. See the chat
    // reply for a snippet to drop into entities/cube.ts.
    (this.cube as unknown as { mutate?: () => void }).mutate?.();
    this.particles.burst();
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
    this.animFrameId = requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.cube.update(this.clock);
    this.particles.update(delta);
    this.shapes.update(delta);

    // Throttled telemetry out to the UI — this is the engine "talking".
    this.tickAccumulator += delta;
    if (this.tickAccumulator >= 0.2) {
      this.tickAccumulator = 0;
      bridge.emit("tick", { fps: Math.round(1 / Math.max(delta, 1 / 240)) });
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener("resize", this.onResize);
    this.cube.dispose();
    this.particles.dispose();
    this.shapes.dispose();
    this.renderer.dispose();
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
new App(canvas);