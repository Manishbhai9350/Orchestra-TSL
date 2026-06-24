import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from "three";
import { Reflector } from "three/examples/jsm/Addons.js";

export class Mirror {
  private reflector!: Reflector;
  private plane!: PlaneGeometry;
  private scene: Scene;
  constructor(scene: Scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    this.plane = new PlaneGeometry(20, 20, 100, 100);
    this.reflector = new Reflector(this.plane, {});
    this.reflector.rotation.x = -Math.PI/2;

    this.scene.add(this.reflector)
  }

  update(dt: number) {

  }
}
