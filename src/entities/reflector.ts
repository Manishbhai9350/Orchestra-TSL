import {
  AmbientLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  TorusKnotGeometry,
} from "three";
import { Reflector } from "three/examples/jsm/Addons.js";

const ReflectorShader = {
  name: "ReflectorShader",

  uniforms: {
    color: {
      value: null,
    },

    tDiffuse: {
      value: null,
    },

    textureMatrix: {
      value: null,
    },

    uTime: {
      value: 0,
    },
  },

  vertexShader: /* glsl */ `
  uniform mat4 textureMatrix;
  uniform float uTime;
		varying vec4 vUv;
    varying float vElevation;
    

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

      vec3 pos = position;

      float elevation = sin(pos.x + uTime + sin((pos.x + pos.y) + uTime  ) ) * sin(pos.y + uTime ); 

      pos.z += elevation;
      
			gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
      
			vUv = textureMatrix * vec4( position, 1.0 );
      vElevation = elevation;

			#include <logdepthbuf_vertex>

		}`,

  fragmentShader: /* glsl */ `
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;
    varying float vElevation;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

      gl_FragColor = vec4(vElevation,0.0,0.0,1.0);

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`,
};

export class Mirror {
  private reflector!: Reflector;
  private plane!: PlaneGeometry;
  private scene: Scene;
  constructor(scene: Scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    this.plane = new PlaneGeometry(100, 100, 130, 130);
    this.reflector = new Reflector(this.plane, {
      shader: ReflectorShader,
    });
    this.reflector.rotation.x = -Math.PI / 2;

    this.scene.add(new AmbientLight(0xffffff, 10));

    const knot = new Mesh(
      new TorusKnotGeometry(5, 1, 100, 10),
      new MeshBasicMaterial({ color: "white" }),
    );

    knot.position.set(0, 10, 0);

    this.scene.add(knot);

    this.scene.add(this.reflector);
  }

  update(dt: number) {
    this.reflector.material.uniforms.uTime.value += dt;
    // console.log(this.reflector.material.uniforms)
  }
}
