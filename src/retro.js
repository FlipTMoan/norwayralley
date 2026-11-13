import * as THREE from 'three';

/**
 * A tiny PS1-style presenter: the whole world is drawn into a low-resolution
 * target, then shown through a shader that quantises colour, dithers, adds
 * scanlines and a soft vignette.
 */
export class RetroPresenter {
  constructor(renderer) {
    this.renderer = renderer;
    this.pixelScaleOverride = null;
    this.target = new THREE.WebGLRenderTarget(640, 360, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.target.texture.generateMipmaps = false;

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tDiffuse: { value: this.target.texture },
        uResolution: { value: new THREE.Vector2(640, 360) },
        uScreen: { value: new THREE.Vector2(1280, 720) },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform vec2 uScreen;
        uniform float uTime;
        varying vec2 vUv;

        float bayer4(vec2 p) {
          int x = int(mod(p.x, 4.0));
          int y = int(mod(p.y, 4.0));
          float m[16];
          m[0] = 0.0;  m[1] = 8.0;  m[2] = 2.0;  m[3] = 10.0;
          m[4] = 12.0; m[5] = 4.0;  m[6] = 14.0; m[7] = 6.0;
          m[8] = 3.0;  m[9] = 11.0; m[10] = 1.0; m[11] = 9.0;
          m[12] = 15.0;m[13] = 7.0; m[14] = 13.0;m[15] = 5.0;
          int i = x + y * 4;
          return m[i] / 16.0 - 0.5;
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 d = (vUv - 0.5) * 0.0018;
          float r = texture2D(tDiffuse, vUv + d).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - d).b;
          vec3 col = vec3(r, g, b);

          // Slightly warm, slightly contrasty.
          col = pow(max(col, 0.0), vec3(0.96));
          col = (col - 0.5) * 1.065 + 0.5;
          col *= vec3(1.035, 1.0, 0.955);

          float dither = bayer4(gl_FragCoord.xy) * 0.045;
          col += dither;
          float levels = 26.0;
          col = floor(col * levels + 0.5) / levels;

          float scan = 0.955 + 0.045 * sin(vUv.y * uScreen.y * 3.14159265);
          col *= scan;

          vec2 vig = vUv * (1.0 - vUv);
          float v = smoothstep(0.0, 0.24, vig.x) * smoothstep(0.0, 0.20, vig.y);
          col *= mix(0.72, 1.0, v);

          float grain = hash(gl_FragCoord.xy + uTime * 60.0) - 0.5;
          col += grain * 0.012;

          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }
      `,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.postScene.add(this.quad);
  }

  resize(width, height) {
    this.lastWidth = width;
    this.lastHeight = height;
    const pixelScale = this.pixelScaleOverride ?? (width < 700 ? 0.6 : 0.46);
    const w = Math.max(420, Math.min(1024, Math.round(width * pixelScale)));
    const h = Math.max(260, Math.round(w * (height / width)));
    this.target.setSize(w, h);
    this.material.uniforms.uResolution.value.set(w, h);
    this.material.uniforms.uScreen.value.set(width, height);
    this.postCamera.updateProjectionMatrix();
  }

  /** Drop the internal render resolution (used by the perf watchdog). */
  setPixelScale(scale) {
    this.pixelScaleOverride = scale;
    if (this.lastWidth) this.resize(this.lastWidth, this.lastHeight);
  }

  render(scene, camera, time) {
    const r = this.renderer;
    this.material.uniforms.uTime.value = time;
    r.setRenderTarget(this.target);
    r.clear();
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.postScene, this.postCamera);
  }
}
