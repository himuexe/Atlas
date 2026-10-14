import {
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  Mesh,
} from 'three';

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(1.6, -1.2, 1.2, 1.6);
  for (int octave = 0; octave < 4; octave++) {
    value += noise(p) * amplitude;
    p = turn * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vUv - vec2(0.73, 0.53);
  p.x *= aspect;
  p += uPointer * 0.012;

  float time = uTime;
  vec2 slowDrift = vec2(time * 0.018, -time * 0.013);
  float broadNoise = fbm(p * 2.3 + slowDrift);
  float fineNoise = fbm(p * 4.6 - slowDrift.yx + vec2(2.7, 0.8));
  vec2 distortion = vec2(broadNoise - 0.5, fineNoise - 0.5) * 0.19;
  float radius = length((p + distortion) * vec2(1.32, 1.05));

  // A soft energy volume with an irregular perimeter instead of a hard-edged object.
  float haze = exp(-radius * 2.65) * (0.32 + broadNoise * 0.62);
  float core = exp(-radius * 5.0) * (0.7 + fineNoise * 0.48);
  float source = exp(-radius * 8.6) * (0.55 + broadNoise * 0.45);

  // Two faint, broken filaments dissolve into the energy cloud at their ends.
  float curveA = p.y - (0.15 * sin(p.x * 3.1 + fineNoise * 3.0 + time * 0.05)
                       + 0.16 * p.x + 0.035 * sin(p.y * 5.0 + broadNoise * 3.0));
  float curveB = p.x - (-0.06 + 0.18 * sin(p.y * 4.7 + broadNoise * 3.0 - time * 0.045)
                       + 0.08 * p.y);
  float dissolve = 1.0 - smoothstep(0.29, 0.7, radius);
  float wispA = exp(-abs(curveA) * 31.0) * exp(-pow((p.x + 0.06) / 0.38, 2.0)) * dissolve;
  float wispB = exp(-abs(curveB) * 27.0) * exp(-pow((p.y - 0.03) / 0.42, 2.0)) * dissolve * 0.52;
  float wisps = wispA + wispB;

  // Hash-selected, tiny drifting points stay sparse and are visible only near the field.
  vec2 particleGrid = vUv * vec2(38.0, 24.0);
  vec2 cell = floor(particleGrid);
  float seed = hash21(cell);
  vec2 point = fract(particleGrid) - vec2(hash21(cell + 13.1), hash21(cell + 71.7));
  point -= vec2(sin(time * 0.18 + seed * 6.283) * 0.12,
                cos(time * 0.15 + seed * 6.283) * 0.12);
  float particle = 1.0 - smoothstep(0.018, 0.052, length(point));
  float particleMask = step(0.978, seed) * smoothstep(0.06, 0.42, haze);
  float particleLight = particle * particleMask * (0.55 + 0.22 * sin(time * 0.35 + seed * 20.0));

  vec3 color = vec3(0.0, 0.0, 0.0);
  color += vec3(0.004, 0.035, 0.013) * haze;
  color += vec3(0.012, 0.23, 0.075) * core;
  color += vec3(0.032, 0.52, 0.16) * source;
  color += vec3(0.018, 0.31, 0.1) * wisps;
  color += vec3(0.032, 0.4, 0.13) * particleLight;

  float alpha = clamp(haze * 0.38 + core * 0.34 + source * 0.16 + wisps * 0.24 + particleLight * 0.6, 0.0, 0.7);
  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Mount the Dashboard's decorative, reduced-motion-aware energy field. */
export function mountDashboardScene(host: HTMLDivElement, canvas: HTMLCanvasElement): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
  } catch {
    // The host's CSS atmosphere remains visible if WebGL initialization fails.
    return () => undefined;
  }

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  const resolution = new Vector2(1, 1);
  const pointer = new Vector2();
  const targetPointer = new Vector2();
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uResolution: { value: resolution },
      uPointer: { value: pointer },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(2, 2);
  scene.add(new Mesh(geometry, material));

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 0.85 : 1.1));

  let frameId = 0;
  let lastRender = 0;
  let elapsedScene = 0;
  let visible = true;
  let pageVisible = !document.hidden;

  const draw = () => renderer.render(scene, camera);
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    resolution.set(width, height);
    renderer.setSize(width, height, false);
    draw();
  };
  const stop = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
  };
  const tick = (time: number) => {
    frameId = 0;
    if (!visible || !pageVisible || reducedMotion.matches) return;
    if (time - lastRender >= 1000 / 30) {
      const elapsed = lastRender ? Math.min((time - lastRender) / 1000, 0.05) : 0;
      lastRender = time;
      elapsedScene += elapsed;
      pointer.lerp(targetPointer, 0.035);
      material.uniforms.uTime.value = elapsedScene;
      draw();
    }
    frameId = requestAnimationFrame(tick);
  };
  const start = () => {
    if (frameId || !visible || !pageVisible || reducedMotion.matches) return;
    lastRender = 0;
    frameId = requestAnimationFrame(tick);
  };
  const handlePointerMove = (event: PointerEvent) => {
    const bounds = host.getBoundingClientRect();
    if (
      event.clientX >= bounds.left && event.clientX <= bounds.right &&
      event.clientY >= bounds.top && event.clientY <= bounds.bottom
    ) {
      targetPointer.set(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
      );
    }
  };
  const handleVisibility = () => {
    pageVisible = !document.hidden;
    if (pageVisible) start();
    else stop();
  };
  const handleMotionPreference = () => {
    if (reducedMotion.matches) {
      stop();
      draw();
    } else {
      start();
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersectionObserver.observe(host);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);
  reducedMotion.addEventListener('change', handleMotionPreference);
  resize();
  if (!reducedMotion.matches) start();

  return () => {
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('visibilitychange', handleVisibility);
    reducedMotion.removeEventListener('change', handleMotionPreference);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
