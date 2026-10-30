import { ACESFilmicToneMapping, HalfFloatType, PCFSoftShadowMap, Vector2, WebGLRenderer, WebGLRenderTarget, type Camera, type Scene } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Below this many frames a second for a couple of seconds, the glow and shadows go.
const SLOW_FRAME_SECONDS = 1 / 24;
const SAMPLE_FRAMES = 90;

// The renderer: film-like colour and glow around bright things, easing off on a phone that can't keep up.
export class RenderPipeline {
  readonly renderer: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private full = true;
  private frames = 0;
  private spent = 0;
  onSlow: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, scene: Scene, camera: Camera) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new Vector2(1, 1), 0.28, 0.5, 1);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.scene = scene;
    this.camera = camera;
  }

  private readonly scene: Scene;
  private readonly camera: Camera;

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  render(delta: number) {
    if (this.full) {
      this.composer.render(delta);
      this.frames++;
      this.spent += delta;
      if (this.frames >= SAMPLE_FRAMES) {
        if (this.spent / this.frames > SLOW_FRAME_SECONDS) this.simplify();
        this.frames = 0;
        this.spent = 0;
      }
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private simplify() {
    this.full = false;
    this.renderer.setPixelRatio(1);
    this.onSlow?.();
  }

  dispose() {
    this.bloom.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
