"use client";

import { useEffect, useRef, useState } from "react";
import { BoxGeometry, CanvasTexture, CircleGeometry, Color, CylinderGeometry, DirectionalLight, Group, HemisphereLight, InstancedMesh, MathUtils, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer, ACESFilmicToneMapping } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Minus, Plus, RotateCcw } from "lucide-react";

type Angle = "perspectiva" | "tela" | "teclado" | "lateral" | "traseira";
const angles: { id: Angle; name: string; camera: [number, number, number] }[] = [
  { id: "perspectiva", name: "Perspectiva", camera: [4.6, 3.15, 5.8] },
  { id: "tela", name: "Tela", camera: [0, 1.75, 7.6] },
  { id: "teclado", name: "Teclado", camera: [0, 6.8, 4.7] },
  { id: "lateral", name: "Lateral", camera: [7.6, 2.2, 0.75] },
  { id: "traseira", name: "Traseira", camera: [0.15, 2.7, -7.8] },
];

const viewNotes: Record<Angle, string> = {
  perspectiva: "Explore o formato geral. Confira a conservação nas fotos da unidade.",
  tela: "Tela e moldura. Riscos, manchas e pixels devem ser avaliados nas fotos reais.",
  teclado: "Teclado e trackpad. O layout das teclas é ilustrativo.",
  lateral: "Perfil e conexões. Confirme as portas disponíveis na ficha e nas fotos.",
  traseira: "Tampa e acabamento. O 3D não reproduz marcas de uso do aparelho.",
};

type ViewerState = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  fit: number;
  transition: { from: Vector3; to: Vector3; started: number | null } | null;
};

function metalColor(color: string) {
  const name = color.toLowerCase();
  if (name.includes("meia-noite")) return "#515a69";
  if (name.includes("preto")) return "#5a5b60";
  if (name.includes("cinza")) return "#888d96";
  if (name.includes("estelar") || name.includes("dourado")) return "#d8d0bd";
  return "#c9cdd2";
}

function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 680;
  const c = canvas.getContext("2d");
  if (!c) return null;
  const gradient = c.createLinearGradient(0, 0, 1024, 680);
  gradient.addColorStop(0, "#14191b"); gradient.addColorStop(1, "#323a3d");
  c.fillStyle = gradient; c.fillRect(0, 0, 1024, 680);
  c.fillStyle = "#606d72";
  c.beginPath(); c.moveTo(0, 550); c.bezierCurveTo(340, 120, 580, 650, 1024, 90); c.lineTo(1024, 680); c.lineTo(0, 680); c.fill();
  c.fillStyle = "#a4afb2";
  c.beginPath(); c.moveTo(0, 680); c.bezierCurveTo(360, 400, 510, 530, 1024, 215); c.lineTo(1024, 680); c.fill();
  c.fillStyle = "#d8dad7";
  c.beginPath(); c.moveTo(370, 680); c.bezierCurveTo(650, 390, 760, 430, 1024, 350); c.lineTo(1024, 680); c.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildLaptop(color: string, series: "Air" | "Pro", screen: string) {
  const assembly = new Group();
  const isPro = series === "Pro";
  const isLarge = screen.startsWith("16");
  const metal = new MeshPhysicalMaterial({ color: metalColor(color), metalness: 0.88, roughness: 0.32, clearcoat: 0.12 });
  const inset = new MeshStandardMaterial({ color: "#25282d", metalness: 0.32, roughness: 0.55 });
  const keyMaterial = new MeshStandardMaterial({ color: "#191c21", metalness: 0.08, roughness: 0.85 });
  const glass = new MeshPhysicalMaterial({ color: "#0d1014", metalness: 0.17, roughness: 0.28, clearcoat: 0.85 });
  const trackpad = new MeshStandardMaterial({ color: new Color(metalColor(color)).multiplyScalar(0.85), metalness: 0.62, roughness: 0.48 });
  const add = (geometry: BoxGeometry | CylinderGeometry | PlaneGeometry, material: MeshStandardMaterial | MeshPhysicalMaterial, parent: Group, pos: [number, number, number]) => {
    const m = new Mesh(geometry, material);
    m.position.set(...pos); parent.add(m); return m;
  };

  add(new RoundedBoxGeometry(3.62, isPro ? 0.16 : 0.10, 2.35, 3, 0.045), metal, assembly, [0, isPro ? 0.05 : 0.08, 0]);
  add(new RoundedBoxGeometry(2.95, 0.012, 1.20, 3, 0.025), inset, assembly, [0, 0.139, -0.40]);
  add(new RoundedBoxGeometry(1.31, 0.008, 0.71, 3, 0.025), trackpad, assembly, [0, 0.142, 0.68]);
  add(new RoundedBoxGeometry(0.43, 0.008, 0.038, 3, 0.003), trackpad, assembly, [0, 0.132, 1.16]);

  const keyGeometry = new RoundedBoxGeometry(0.172, 0.015, 0.143, 2, 0.012);
  const keys = new InstancedMesh(keyGeometry, keyMaterial, 70);
  const temp = new Object3D();
  let index = 0;
  const legends = document.createElement("canvas");
  legends.width = 1536; legends.height = 640;
  const ink = legends.getContext("2d");
  const rows = ["1234567890−=⌫", "QWERTYUIOP[]", "ASDFGHJKL;", "ZXCVBNM,./", "⌃⌥⌘   ⌘⌥◀▶"];
  if (ink) { ink.fillStyle = "#c4cad0"; ink.font = "27px Arial"; ink.textAlign = "center"; ink.textBaseline = "middle"; }
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 14; col++) {
      const x = -1.37 + col * 0.211;
      const z = -0.86 + row * 0.224;
      temp.position.set(x, 0.152, z);
      temp.scale.set(1, 1, row === 0 ? 0.75 : 1);
      // A single space bar, with transparent unused instances below the deck.
      if (row === 4 && col >= 4 && col <= 8) {
        temp.position.y = -0.1;
        if (col === 6) { temp.position.y = 0.152; temp.scale.x = 5.8; }
      }
      temp.updateMatrix();
      keys.setMatrixAt(index++, temp.matrix);
      if (ink && row < 4) ink.fillText(rows[row][col] || "", ((x + 1.49) / 2.98) * legends.width, ((z + 1.02) / 1.22) * legends.height);
    }
  }
  keys.instanceMatrix.needsUpdate = true; assembly.add(keys);
  const legendTexture = new CanvasTexture(legends);
  legendTexture.colorSpace = SRGBColorSpace;
  const legendPlane = new Mesh(new PlaneGeometry(2.98, 1.22), new MeshBasicMaterial({ map: legendTexture, transparent: true, depthWrite: false }));
  legendPlane.rotation.x = -Math.PI / 2;
  legendPlane.position.set(0, 0.161, -0.41); assembly.add(legendPlane);
  if (isPro) {
    const holes = new InstancedMesh(new CircleGeometry(0.006, 5), inset, 180);
    let hole = 0;
    for (const side of [-1, 1]) for (let row = 0; row < 30; row++) for (let col = 0; col < 3; col++) {
      temp.position.set(side * (1.57 + col * 0.037), 0.136, -0.94 + row * 0.036);
      temp.scale.set(1, 1, 1); temp.rotation.x = -Math.PI / 2;
      temp.updateMatrix(); holes.setMatrixAt(hole++, temp.matrix);
    }
    holes.instanceMatrix.needsUpdate = true; assembly.add(holes);
  }
  for (const z of [-0.67, -0.32]) {
    add(new BoxGeometry(0.012, 0.022, 0.16), inset, assembly, [-1.81, 0.084, z]);
  }
  for (const z of (isPro ? [-0.67, -0.23, 0.22] : [-0.67])) {
    add(new BoxGeometry(0.012, 0.021, 0.14), inset, assembly, [1.81, 0.084, z]);
  }
  if (isPro) {
    // Illustrative vent grilles on the thicker Pro-style chassis.
    for (let n = 0; n < 7; n++) {
      add(new BoxGeometry(0.01, 0.012, 0.10), inset, assembly, [-1.81, 0.045, -0.90 + n * 0.20]);
      add(new BoxGeometry(0.01, 0.012, 0.10), inset, assembly, [1.81, 0.045, -0.90 + n * 0.20]);
    }
  }
  const hinge = new Mesh(new CylinderGeometry(0.052, 0.052, 3.15, 20), new MeshStandardMaterial({ color: "#525b64", metalness: 0.85, roughness: 0.36 }));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, 0.14, -1.13); assembly.add(hinge);

  const lid = new Group();
  lid.position.set(0, 0.17, -1.14);
  lid.rotation.x = -0.19;
  assembly.add(lid);
  add(new RoundedBoxGeometry(3.59, 2.22, 0.068, 4, 0.032), metal, lid, [0, 1.11, -0.025]);
  add(new RoundedBoxGeometry(3.48, 2.11, 0.009, 3, 0.004), glass, lid, [0, 1.11, 0.016]);
  const texture = createScreenTexture();
  if (texture) {
    const display = new Mesh(new PlaneGeometry(3.30, 1.92), new MeshBasicMaterial({ map: texture }));
    display.position.set(0, 1.105, 0.023); lid.add(display);
  }
  const webcam = new Mesh(new CircleGeometry(0.012, 12), new MeshBasicMaterial({ color: "#284159" }));
  webcam.position.set(0, screen.includes("Liquid Retina") ? 2.12 : 2.16, 0.033); lid.add(webcam);
  if (screen.includes("Liquid Retina")) {
    add(new BoxGeometry(0.27, 0.065, 0.006), glass, lid, [0, 2.115, 0.028]);
  }

  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128; shadowCanvas.height = 128;
  const shade = shadowCanvas.getContext("2d");
  if (shade) {
    const gradient = shade.createRadialGradient(64, 64, 7, 64, 64, 64);
    gradient.addColorStop(0, "rgba(28,35,43,0.27)"); gradient.addColorStop(1, "rgba(28,35,43,0)");
    shade.fillStyle = gradient; shade.fillRect(0, 0, 128, 128);
  }
  const shadowTexture = new CanvasTexture(shadowCanvas);
  const shadow = new Mesh(new PlaneGeometry(6, 4.4), new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.22, -0.08, -0.06); assembly.add(shadow);
  if (isLarge) assembly.scale.set(1.1, 1.06, 1.05);
  return { assembly, textures: [texture, legendTexture, shadowTexture] };
}

export function Macbook3D({ color, series, screen }: { color: string; series: "Air" | "Pro"; screen: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ViewerState | null>(null);
  const [angle, setAngle] = useState<Angle | null>("perspectiva");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
    } catch {
      // Defer the fallback update so it does not synchronously set state in an effect.
      const timeout = window.setTimeout(() => setUnavailable(true), 0);
      return () => window.clearTimeout(timeout);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0xffffff, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);
    const scene = new Scene();
    const environment = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, 0.04);
    scene.environment = environmentMap.texture;
    scene.environmentIntensity = 0.85;
    environment.dispose(); pmrem.dispose();
    scene.add(new HemisphereLight("#ffffff", "#b5bfca", 1.5));
    const key = new DirectionalLight("#ffffff", 2.5); key.position.set(2, 7, 5); scene.add(key);
    const rim = new DirectionalLight("#e1e8ef", 1.6); rim.position.set(-5, 4, -3); scene.add(rim);
    const { assembly, textures } = buildLaptop(color, series, screen);
    scene.add(assembly);
    const camera = new PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(4.6, 3.15, 5.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.83, -0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 4.8;
    controls.maxDistance = 11;
    controls.minPolarAngle = 0.22;
    controls.maxPolarAngle = Math.PI * 0.57;
    controls.update();
    const state: ViewerState = { camera, controls, fit: 1, transition: null };
    sceneRef.current = state;
    const interaction = () => { state.transition = null; setAngle(null); };
    controls.addEventListener("start", interaction);

    const resize = () => {
      if (!host.isConnected) return;
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      const fit = Math.max(1, 1.18 / camera.aspect);
      const offset = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target.clone().add(offset.multiplyScalar(fit / state.fit)));
      state.fit = fit;
      state.transition = null;
      controls.minDistance = 4.8 * fit;
      controls.maxDistance = 11 * fit;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host); resize();
    let frame = 0;
    let visible = true;
    let contextLost = false;
    const draw = () => {
      frame = 0;
      if (!visible || document.hidden || contextLost) return;
      if (state.transition) {
        const now = performance.now();
        state.transition.started ??= now;
        const progress = Math.min(1, (now - state.transition.started) / 550);
        const eased = progress * progress * (3 - 2 * progress);
        camera.position.lerpVectors(state.transition.from, state.transition.to, eased);
        if (progress === 1) state.transition = null;
      }
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    const start = () => { if (!frame && visible && !document.hidden && !contextLost) frame = requestAnimationFrame(draw); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) start();
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: 0.01 });
    intersection.observe(host);
    document.addEventListener("visibilitychange", visibility);
    start();
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame); frame = 0;
      state.transition = null;
      setUnavailable(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
      controls.dispose();
      sceneRef.current = null;
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      host.removeChild(renderer.domElement);
      scene.traverse((node) => {
        if (node instanceof Mesh || node instanceof InstancedMesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((mat) => mat.dispose());
        }
      });
      textures.forEach((texture) => texture?.dispose());
      environmentMap.dispose();
      renderer.dispose();
    };
  }, [color, series, screen]);

  const choose = (option: typeof angles[number]) => {
    setAngle(option.id);
    const state = sceneRef.current;
    if (!state) return;
    const to = new Vector3(...option.camera).sub(state.controls.target).multiplyScalar(state.fit).add(state.controls.target);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      state.transition = null;
      state.camera.position.copy(to);
      state.controls.update();
    } else state.transition = { from: state.camera.position.clone(), to, started: null };
  };
  const rotate = (direction: number) => {
    const state = sceneRef.current;
    if (!state) return;
    state.transition = null;
    setAngle(null);
    const relative = state.camera.position.clone().sub(state.controls.target);
    relative.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(direction * 16));
    state.camera.position.copy(state.controls.target.clone().add(relative));
    state.controls.update();
  };
  const zoom = (direction: number) => {
    const state = sceneRef.current;
    if (!state) return;
    state.transition = null;
    const offset = state.camera.position.clone().sub(state.controls.target);
    const distance = MathUtils.clamp(offset.length() + direction * state.fit, state.controls.minDistance, state.controls.maxDistance);
    state.camera.position.copy(state.controls.target.clone().add(offset.setLength(distance)));
    state.controls.update();
  };

  return <div className="sf-3d-viewer">
    <div className="sf-3d-stage" tabIndex={0} role="group" aria-label={`Modelo 3D ilustrativo de MacBook ${series}. Use as setas para girar e mais ou menos para aproximar ou afastar.`} onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); rotate(e.key === "ArrowLeft" ? -1 : 1); } if (e.key === "+" || e.key === "=") { e.preventDefault(); zoom(-0.5); } if (e.key === "-") { e.preventDefault(); zoom(0.5); } }}>
      <div ref={mountRef} className="sf-3d-canvas" />
      {unavailable && <div className="sf-3d-error" role="status">A visualização 3D não está disponível neste navegador. Consulte as fotografias da unidade.</div>}
      <div className="sf-3d-stage-meta"><span>MACBOOK {series.toUpperCase()} · MODELO ILUSTRATIVO</span><span>Arraste para girar</span></div>
    </div>
    <div className="sf-3d-controls" role="group" aria-label="Ângulos da visualização 3D">
      {angles.map((item) => <button key={item.id} type="button" disabled={unavailable} className={angle === item.id ? "active" : ""} aria-pressed={angle === item.id} onClick={() => choose(item)}>{item.name}</button>)}
      <button type="button" disabled={unavailable} className="sf-3d-reset" onClick={() => zoom(-0.65)} aria-label="Aproximar modelo"><Plus size={16} /></button>
      <button type="button" disabled={unavailable} className="sf-3d-reset" onClick={() => zoom(0.65)} aria-label="Afastar modelo"><Minus size={16} /></button>
      <button type="button" disabled={unavailable} className="sf-3d-reset" onClick={() => choose(angles[0])} aria-label="Restaurar ângulo inicial"><RotateCcw size={16} /></button>
    </div>
    <p className="sf-3d-view-note" role="status">{angle ? viewNotes[angle] : "Visualização livre. Use os ângulos acima para voltar a uma perspectiva."}</p>
    <p className="sf-3d-disclaimer">Representação 3D ilustrativa do formato de um notebook. Cores, portas, dimensões e marcas de uso podem diferir da unidade anunciada. Consulte as fotos para avaliar o estado real.</p>
  </div>;
}
