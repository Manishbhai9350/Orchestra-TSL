import { PerspectiveCamera, Vector2 } from "three";
import type { WebGPURenderer } from "three/webgpu";

/**
 * Visible width/height (in world units) of the camera's frustum at a
 * given z depth — e.g. how big a full-bleed background plane needs to
 * be, or what range to scatter particles in, to exactly fill the
 * viewport at that depth.
 *
 * Assumes a camera looking down -z (camera.position.z > 0, aimed at
 * the origin), which is what App sets up. For an OrthographicCamera
 * the math is simpler and depth-independent — this won't apply there.
 */
export function GetViewportBounds(
  camera: PerspectiveCamera,
  renderer: WebGPURenderer,
  z = 0,
): { width: number; height: number } {
  const distance = camera.position.z - z;

  if (distance <= 0) {
    console.warn(
      "GetViewportBounds: z is at 0 or in front of the camera, bounds are undefined.",
    );
    return { width: 0, height: 0 };
  }

  const size = renderer.getSize(new Vector2());
  const aspect = size.x / size.y;

  const verticalFov = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(verticalFov / 2) * distance;
  const width = height * aspect;

  return { width, height };
}
