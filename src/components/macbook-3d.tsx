"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ACESFilmicToneMapping, Box3, DirectionalLight, HemisphereLight, Mesh, Object3D, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Texture, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ArrowUpRight, Expand, LoaderCircle, Minus, Pause, Play, Plus, RotateCcw, Sun, X, ScanEye } from "lucide-react";

const views = [
  { id: "perspectiva", label: "Perspectiva", position: [1.4, 0.85, 2.5], detail: "Visão geral das proporções do MacBook." },
  { id: "frente", label: "Frente", position: [0, 0.45, 3], detail: "Tela, teclado e área de trabalho." },
  { id: "lateral", label: "Lateral", position: [3, 0.4, 0.25], detail: "Perfil e espessura do chassi." },
  { id: "superior", label: "Superior", position: [0, 3, 0.3], detail: "Teclado, trackpad e proporções vistos de cima." },
] as const;
export type MacbookAngle = typeof views[number]["id"];
type Angle = MacbookAngle;
type Light = "studio" | "soft";
type Viewer = {
  select: (position: readonly [number, number, number]) => void;
  zoom: (factor: number) => void;
  rotate: (direction: number) => void;
  light: (value: Light) => void;
  spin: (enabled: boolean) => void;
};

function disposeModel(root: Object3D) {
  const textures = new Set<Texture>();
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      material.dispose();
    }
  });
  const bitmaps = new Set<ImageBitmap>();
  textures.forEach((texture) => {
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
    texture.dispose();
  });
  bitmaps.forEach((bitmap) => bitmap.close());
}

/** Product geometry comes exclusively from existing third-party GLB files. */
export function Macbook3D({ series, screen, presentation = "studio", view, onInteract }: { color: string; series: "Air" | "Pro"; screen: string; presentation?: "studio" | "hero" | "story"; view?: MacbookAngle; onInteract?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const descriptionId = useId();
  const [angle, setAngle] = useState<Angle | null>("perspectiva");
  const [light, setLight] = useState<Light>("studio");
  const [spinning, setSpinning] = useState(false);
  const [tour, setTour] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const interaction = useRef(onInteract);

  useEffect(() => { interaction.current = onInteract; }, [onInteract]);
  useEffect(() => {
    if (!view || loading || error) return;
    const selected = views.find((item) => item.id === view);
    if (selected) viewer.current?.select(selected.position);
  }, [view, loading, error]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!tour || loading || error || reducedMotion) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % views.length;
      setAngle(views[index].id);
      viewer.current?.select(views[index].position);
    }, 2900);
    return () => window.clearInterval(timer);
  }, [tour, loading, error, reducedMotion]);

  useEffect(() => {
    if (!expanded) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setExpanded(false); }
      if (event.key !== "Tab") return;
      const elements = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [expanded]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let cancelled = false, failed = false, visible = true, loaded = false;
    let frame = 0, lastTime = 0, distance = 5, modelRadius = 1;
    let transition: { from: Vector3; to: Vector3; start: number } | null = null;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { const timer = window.setTimeout(() => { setError(true); setLoading(false); }, 0); return () => clearTimeout(timer); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    const scene = new Scene();
    const environmentScene = new RoomEnvironment();
    const generator = new PMREMGenerator(renderer);
    const environment = generator.fromScene(environmentScene, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.1;
    environmentScene.dispose(); generator.dispose();
    scene.add(new HemisphereLight(0xffffff, 0x697789, 1.5));
    const key = new DirectionalLight(0xffffff, 2.5); key.position.set(3, 5, 5); scene.add(key);
    const rim = new DirectionalLight(0xcbdfff, 2); rim.position.set(-4, 2, -3); scene.add(rim);
    const camera = new PerspectiveCamera(35, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.085;
    controls.enablePan = false;
    // Dedicated zoom controls avoid intercepting normal page scrolling.
    controls.enableZoom = false;
    renderer.domElement.style.touchAction = "pan-y";
    controls.minPolarAngle = 0.08; controls.maxPolarAngle = Math.PI * 0.78;
    controls.autoRotateSpeed = 0.65;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");

    function invalidate() {
      if (!frame && !cancelled && !failed && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function draw(time: number) {
      frame = 0;
      if (cancelled || failed || !visible || document.hidden) return;
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      if (transition) {
        const progress = Math.min((time - transition.start) / 650, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(transition.from, transition.to, ease);
        if (progress === 1) transition = null;
      }
      controls.update(delta);
      renderer.render(scene, camera);
      if (transition || controls.autoRotate) invalidate();
    }
    function moveTo(to: Vector3) {
      controls.autoRotate = false; setSpinning(false);
      controls.enableDamping = false; controls.update(); controls.enableDamping = true;
      if (motion.matches) { camera.position.copy(to); controls.update(); }
      else transition = { from: camera.position.clone(), to, start: performance.now() };
      invalidate();
    }
    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      const oldDistance = distance;
      camera.aspect = width / height;
      const vertical = camera.fov * Math.PI / 360;
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      distance = modelRadius / Math.sin(Math.min(vertical, horizontal)) * 0.84;
      controls.minDistance = distance * 0.55; controls.maxDistance = distance * 1.8;
      if (loaded) { transition = null; camera.position.multiplyScalar(distance / oldDistance); }
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); invalidate();
    };
    viewer.current = {
      select: (position) => {
        setAngle(views.find((item) => item.position.every((coordinate, index) => coordinate === position[index]))?.id ?? null);
        moveTo(new Vector3(...position).normalize().multiplyScalar(distance));
      },
      zoom: (factor) => moveTo(camera.position.clone().multiplyScalar(factor).clampLength(controls.minDistance, controls.maxDistance)),
      rotate: (direction) => {
        setAngle(null);
        moveTo(camera.position.clone().applyAxisAngle(new Vector3(0, 1, 0), direction * Math.PI / 10));
      },
      light: (value) => {
        const studio = value === "studio";
        renderer.toneMappingExposure = studio ? 1.05 : 1.2;
        scene.environmentIntensity = studio ? 1.1 : 1.6;
        key.intensity = studio ? 2.5 : 0.8; rim.intensity = studio ? 2 : 0.5;
        invalidate();
      },
      spin: (enabled) => {
        transition = null; controls.autoRotate = enabled && !motion.matches;
        setSpinning(controls.autoRotate); if (enabled) setAngle(null); invalidate();
      },
    };
    const fail = () => {
      if (cancelled) return;
      failed = true; cancelAnimationFrame(frame); frame = 0;
      controls.autoRotate = false; setSpinning(false); setTour(false); setError(true); setLoading(false);
    };
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const deadline = window.setTimeout(fail, 30000);
    const draco = new DRACOLoader().setDecoderPath("/draco/").setWorkerLimit(1);
    new GLTFLoader().setDRACOLoader(draco).load(
      // Both bundled assets identify a 16-inch Pro in their original metadata.
      // Use that reference honestly, regardless of the advertised unit's screen.
      "/models/macbook-16.glb",
      (gltf) => {
        clearTimeout(deadline); draco.dispose();
        if (cancelled || failed) { disposeModel(gltf.scene); return; }
        const model = gltf.scene;
        const bounds = new Box3().setFromObject(model);
        const size = bounds.getSize(new Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) { disposeModel(model); fail(); return; }
        const scale = 3.2 / largest;
        model.scale.multiplyScalar(scale);
        model.position.copy(bounds.getCenter(new Vector3()).multiplyScalar(-scale));
        scene.add(model);
        modelRadius = size.length() * scale / 2;
        resize(); loaded = true;
        camera.position.copy(new Vector3(...views[0].position).normalize().multiplyScalar(distance));
        controls.update(); setLoading(false); invalidate();
      }, undefined, () => { clearTimeout(deadline); draco.dispose(); fail(); },
    );
    const onInteraction = () => {
      interaction.current?.();
      transition = null; controls.autoRotate = false; setSpinning(false); setTour(false); setAngle(null); invalidate();
    };
    const onMotion = () => { if (motion.matches) { controls.autoRotate = false; transition = null; setSpinning(false); setTour(false); invalidate(); } };
    const onVisibility = () => {
      lastTime = 0;
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; controls.autoRotate = false; setSpinning(false); setTour(false); } else invalidate();
    };
    controls.addEventListener("start", onInteraction); controls.addEventListener("change", invalidate);
    motion.addEventListener("change", onMotion);
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false; lastTime = 0;
      if (visible) invalidate(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    intersection.observe(host); document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true; clearTimeout(deadline); cancelAnimationFrame(frame);
      intersection.disconnect(); observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onMotion);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      controls.removeEventListener("start", onInteraction); controls.removeEventListener("change", invalidate);
      controls.dispose(); viewer.current = null;
      disposeModel(scene); environment.dispose(); renderer.dispose();
      // Late loader callbacks dispose their own model and decoder after unmount.
      if (loaded || failed) draco.dispose();
      renderer.domElement.remove();
    };
  }, [attempt, presentation]);

  const retry = () => { setError(false); setLoading(true); setAngle("perspectiva"); setLight("studio"); setSpinning(false); setTour(false); setAttempt((value) => value + 1); };
  const disabled = loading || error;
  return <div ref={root} data-presentation={presentation} data-state={error ? "error" : loading ? "loading" : "ready"} className={`sf-3d-viewer sf-3d-studio${expanded ? " is-expanded" : ""}`} onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button")) interaction.current?.(); }} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? "Visualização ampliada do MacBook" : undefined}>
    <div className="sf-3d-stage" data-light={light}>
      <div className="sf-studio-heading"><div><span className="sf-studio-eyebrow">MODELO INTERATIVO / 16″</span><span className="sf-studio-title">MacBook <span>Pro</span></span></div><button ref={closeButton} type="button" className="sf-studio-icon" aria-label={expanded ? "Fechar visualização ampliada" : "Ampliar visualização 3D"} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={18} /> : <Expand size={17} />}</button></div>
      <div className="sf-studio-watermark" aria-hidden="true">MacBook.</div>
      <div className="sf-studio-shadow" aria-hidden="true" />
      <div className="sf-3d-canvas" ref={mount} tabIndex={disabled ? -1 : 0} role="group" aria-label="Modelo 3D. Use as setas para girar e as teclas mais e menos para ajustar o zoom." aria-describedby={descriptionId} onKeyDown={(event) => {
        if (event.key.startsWith("Arrow") || ["+", "=", "-"].includes(event.key)) interaction.current?.();
        if (event.key.startsWith("Arrow")) {
          event.preventDefault();
          setTour(false);
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") viewer.current?.rotate(event.key === "ArrowLeft" ? -1 : 1);
          else viewer.current?.zoom(event.key === "ArrowUp" ? 0.85 : 1.15);
        }
        if (["+", "=", "-"].includes(event.key)) { event.preventDefault(); setTour(false); viewer.current?.zoom(event.key === "-" ? 1.15 : 0.85); }
      }} />
      {loading && !error && <div className="sf-studio-status" role="status"><LoaderCircle size={25} className="sf-studio-spinner" /><span>Carregando visualização</span></div>}
      {error && <div className="sf-studio-status sf-studio-fallback" role="status"><Image src="/images/pro.jpg" alt="Fotografia editorial ilustrativa de MacBook" fill sizes="(max-width: 850px) 90vw, 600px" /><div><span>Visualização 3D indisponível</span><p>Fotografia ilustrativa. Você pode tentar carregar o modelo novamente.</p><button type="button" onClick={retry}><RotateCcw size={15} /> Tentar novamente</button></div></div>}
      <div className="sf-studio-bottom"><span className="sf-studio-hint">Arraste para explorar <ArrowUpRight size={13} /></span><div className="sf-studio-tools"><button type="button" className="sf-studio-icon" aria-label="Afastar modelo" disabled={disabled} onClick={() => { setTour(false); viewer.current?.zoom(1.15); }}><Minus size={17} /></button><button type="button" className="sf-studio-icon" aria-label="Aproximar modelo" disabled={disabled} onClick={() => { setTour(false); viewer.current?.zoom(0.85); }}><Plus size={17} /></button><button type="button" className="sf-studio-icon" aria-label="Restaurar câmera" disabled={disabled} onClick={() => { setTour(false); setAngle("perspectiva"); viewer.current?.select(views[0].position); }}><RotateCcw size={15} /></button></div></div>
    </div>
    <div className="sf-studio-toolbar"><div className="sf-studio-views" role="group" aria-label="Ângulos do MacBook">{views.map((view) => <button key={view.id} type="button" disabled={disabled} aria-pressed={angle === view.id} onClick={() => { setTour(false); setAngle(view.id); viewer.current?.select(view.position); }}>{view.label}</button>)}</div><div className="sf-studio-playback"><button type="button" className="sf-studio-tour" disabled={disabled || reducedMotion} title={reducedMotion ? "Tour desativado pela preferência de movimento reduzido" : undefined} aria-pressed={tour} onClick={() => { if (!tour) { viewer.current?.spin(false); setAngle(views[0].id); viewer.current?.select(views[0].position); } setTour(!tour); }}><ScanEye size={15} /><span>{tour ? "Parar tour" : "Tour guiado"}</span></button><button type="button" className="sf-studio-spin" disabled={disabled || reducedMotion} aria-pressed={spinning} aria-label={spinning ? "Pausar rotação automática" : "Iniciar rotação automática"} onClick={() => { setTour(false); viewer.current?.spin(!spinning); }}>{spinning ? <Pause size={13} /> : <Play size={13} />}<span>Girar</span></button></div></div>
    <p className="sf-studio-angle-detail" aria-live="polite"><span>{tour ? "TOUR ATIVO" : angle ? "ÂNGULO SELECIONADO" : "CONTROLE LIVRE"}</span>{views.find((view) => view.id === angle)?.detail ?? "Arraste o modelo para examinar outros ângulos."}</p>
    <div className="sf-studio-footer"><span className="sf-studio-reference">Referência de formato · {series === "Air" ? "modelo Pro ilustrativo" : "modelo ilustrativo"}</span><div className="sf-studio-lights" role="group" aria-label="Iluminação do modelo"><Sun size={13} aria-hidden="true" />{([{ id: "studio", label: "Estúdio" }, { id: "soft", label: "Suave" }] as const).map((item) => <button key={item.id} type="button" disabled={disabled} aria-pressed={light === item.id} onClick={() => { setLight(item.id); viewer.current?.light(item.id); }}>{item.label}</button>)}</div></div>
    <p className="sf-3d-disclaimer" id={descriptionId}>Referência 3D: MacBook Pro 16″. {presentation === "studio" ? `A unidade anunciada é ${series} ${screen}; configuração, cor e conservação podem diferir. ` : ""}Consulte as fotografias da unidade.<span className="sf-studio-credit"><a href="https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4" target="_blank" rel="noreferrer">Modelo: jackbaeten</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · versão otimizada via Wistant.</span></p>
  </div>;
}
