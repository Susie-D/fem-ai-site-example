import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cities } from "../cities";
import { landmarkSprites } from "../sprites";

type Props = {
  activeCity: number;
  cityProgress: number;
  journeyProgress: number;
  onCitySelect: (index: number) => void;
  reducedMotion: boolean;
};

type LiveState = Omit<Props, "onCitySelect">;

type LiveLandmark = {
  config: (typeof landmarkSprites)[number];
  rear: THREE.Sprite;
  front: THREE.Sprite;
  rearMaterial: THREE.SpriteMaterial;
  frontMaterial: THREE.SpriteMaterial;
  isFront: boolean;
  wasActive: boolean;
  position: THREE.Vector3;
  scale: number;
  opacity: number;
};

const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
    gl_FragColor = vec4(glowColor, intensity * 0.76);
  }
`;

function damp(current: number, target: number, smoothing: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

function pathProgress(phase: number, focus: number) {
  return phase <= focus
    ? 0.5 * (phase / Math.max(0.001, focus))
    : 0.5 + 0.5 * ((phase - focus) / Math.max(0.001, 1 - focus));
}

function smoothSegment(value: number, start: number, end: number) {
  return THREE.MathUtils.smoothstep((value - start) / Math.max(0.001, end - start), 0, 1);
}

function sampleOrbitPoint(
  config: (typeof landmarkSprites)[number],
  progress: number,
  clearanceRadius: number,
  positionScale: number,
) {
  const entry = new THREE.Vector3(config.entryPoint[0] * positionScale, config.entryPoint[1] * positionScale, config.entryPoint[2]);
  const focal = new THREE.Vector3(config.focalPoint[0] * positionScale, config.focalPoint[1] * positionScale, 2.15);
  const exit = new THREE.Vector3(config.exitPoint[0] * positionScale, config.exitPoint[1] * positionScale, config.exitPoint[2]);
  const entryDirection = new THREE.Vector2(entry.x, entry.y).normalize();
  const exitDirection = new THREE.Vector2(exit.x, exit.y).normalize();
  const entryDistance = Math.max(Math.hypot(entry.x, entry.y), clearanceRadius + 0.38 + config.orbitSize * positionScale);
  const exitDistance = Math.max(Math.hypot(exit.x, exit.y), clearanceRadius + 0.38 + config.orbitSize * positionScale);
  entry.set(entryDirection.x * entryDistance, entryDirection.y * entryDistance, config.entryPoint[2]);
  exit.set(exitDirection.x * exitDistance, exitDirection.y * exitDistance, config.exitPoint[2]);
  const entryLimb = new THREE.Vector3(entryDirection.x * clearanceRadius, entryDirection.y * clearanceRadius, -0.62);
  const entryFront = entryLimb.clone().setZ(2.05);
  const exitLimb = new THREE.Vector3(exitDirection.x * clearanceRadius, exitDirection.y * clearanceRadius, 2.05);
  const exitRear = exitLimb.clone().setZ(-0.62);
  const lateralMix = 0.2 + 0.28 * positionScale;
  const lateral = focal.clone().lerp(exitLimb, lateralMix);
  lateral.y += config.direction * config.orbitSize * positionScale * 0.3;

  const points = [entry, entryLimb, entryFront, focal, lateral, exitLimb, exitRear, exit];
  const stops = [0, 0.21, 0.3, 0.5, 0.64, 0.73, 0.82, 1];
  let index = stops.length - 2;
  for (let i = 0; i < stops.length - 1; i++) {
    if (progress <= stops[i + 1]) {
      index = i;
      break;
    }
  }
  const t = smoothSegment(progress, stops[index], stops[index + 1]);
  return points[index].clone().lerp(points[index + 1], t);
}

function sampleOrbitScale(progress: number) {
  const stops = [0, 0.21, 0.3, 0.5, 0.73, 0.82, 1];
  const values = [0.34, 0.68, 0.78, 1.06, 0.82, 0.62, 0.32];
  let index = stops.length - 2;
  for (let i = 0; i < stops.length - 1; i++) {
    if (progress <= stops[i + 1]) {
      index = i;
      break;
    }
  }
  return THREE.MathUtils.lerp(values[index], values[index + 1], smoothSegment(progress, stops[index], stops[index + 1]));
}

function seeded(index: number) {
  const value = Math.sin(index * 91.713 + 18.19) * 43758.5453;
  return value - Math.floor(value);
}

function material(color: string, metalness = 0.25, roughness = 0.45, opacity = 0.86) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    transparent: opacity < 1,
    opacity,
    clearcoat: 0.35,
    side: THREE.DoubleSide,
  });
}

function addRibbon(group: THREE.Group, color: string, radius: number, tilt: number, width = 0.025) {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, (_, i) => {
      const a = (i / 8) * Math.PI * 1.7 - 1.1;
      return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a * 1.25) * 0.34, Math.sin(a) * radius * 0.42);
    }),
  );
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, width, 5, false), material(color, 0.45, 0.24, 0.72));
  mesh.rotation.set(tilt, tilt * 0.35, tilt * 0.8);
  group.add(mesh);
}

function particleField(count: number, color: string, spread: number, size: number, seedOffset = 0) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = spread * (0.45 + seeded(i + seedOffset) * 0.7);
    const angle = seeded(i + 21 + seedOffset) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (seeded(i + 47 + seedOffset) - 0.5) * spread * 1.1;
    positions[i * 3 + 2] = (seeded(i + 75 + seedOffset) - 0.5) * spread;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
}

function addRepeated(
  group: THREE.Group,
  count: number,
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  spread: number,
  seedOffset: number,
) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geometry, mat);
    const a = seeded(i + seedOffset) * Math.PI * 2;
    const r = spread * (0.62 + seeded(i + seedOffset + 40) * 0.5);
    mesh.position.set(Math.cos(a) * r, (seeded(i + seedOffset + 80) - 0.5) * spread * 1.15, Math.sin(a) * r * 0.72);
    const s = 0.55 + seeded(i + seedOffset + 120) * 1.1;
    mesh.scale.setScalar(s);
    mesh.rotation.set(a, a * 0.7, seeded(i + seedOffset + 160) * Math.PI);
    group.add(mesh);
  }
}

function buildTokyo() {
  const root = new THREE.Group();
  const petal = new THREE.SphereGeometry(0.038, 7, 5);
  petal.scale(1.7, 0.35, 0.8);
  addRepeated(root, 38, petal, material("#ffc0cf", 0.05, 0.72, 0.82), 2.35, 10);
  for (const x of [-1.75, 1.75]) {
    const torii = new THREE.Group();
    const lacquer = material("#bd3e45", 0.45, 0.24, 0.9);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.72, 8), lacquer);
    post.position.x = -0.2;
    torii.add(post, post.clone());
    torii.children[1].position.x = 0.2;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.055, 0.06), lacquer);
    beam.position.y = 0.31;
    torii.add(beam);
    torii.position.set(x, x * 0.2, -0.35);
    torii.rotation.z = x * -0.1;
    root.add(torii);
  }
  addRepeated(root, 7, new THREE.CylinderGeometry(0.055, 0.075, 0.16, 12), material("#f3a36c", 0.25, 0.3, 0.82), 1.75, 280);
  addRepeated(root, 12, new THREE.CylinderGeometry(0.009, 0.009, 0.48, 5), material("#c8e4ed", 0.92, 0.12), 2.05, 320);
  addRibbon(root, "#8f2238", 2.05, 0.34, 0.018);
  return root;
}

function buildCairo() {
  const root = new THREE.Group();
  addRepeated(root, 10, new THREE.IcosahedronGeometry(0.12, 1), material("#dca956", 0.62, 0.28, 0.72), 2.1, 410);
  addRepeated(root, 12, new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshPhysicalMaterial({ color: "#ffdca0", transmission: 0.75, opacity: 0.42, transparent: true, roughness: 0.08 }), 1.95, 470);
  addRibbon(root, "#f0bd68", 2.15, -0.55, 0.016);
  root.add(particleField(85, "#dcb76c", 2.45, 0.016, 510));
  return root;
}

function buildParis() {
  const root = new THREE.Group();
  addRibbon(root, "#bc9165", 2.1, 0.72, 0.014);
  addRibbon(root, "#7d8584", 1.92, -0.45, 0.01);
  addRepeated(root, 22, new THREE.CircleGeometry(0.055, 5), material("#b46d3f", 0.05, 0.8, 0.74), 2.25, 620);
  return root;
}

function buildNewYork() {
  const root = new THREE.Group();
  const chrome = material("#b9bec4", 0.9, 0.16, 0.78);
  for (const side of [-1, 1]) {
    const fan = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const ray = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.66 + i * 0.04, 0.018), chrome);
      ray.rotation.z = side * (0.14 + i * 0.095);
      ray.position.y = 0.28;
      fan.add(ray);
    }
    fan.position.set(side * 1.7, -0.35, 0.05);
    root.add(fan);
  }
  const clock = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 48), chrome);
  clock.position.set(1.7, 0.85, -0.1);
  root.add(clock);
  addRepeated(root, 24, new THREE.OctahedronGeometry(0.032, 0), material("#eaf5f6", 0.2, 0.42, 0.82), 2.3, 740);
  addRepeated(root, 11, new THREE.CircleGeometry(0.055, 5), material("#a85a45", 0.1, 0.7, 0.76), 2.05, 790);
  root.add(particleField(70, "#ff9e7e", 2.35, 0.012, 820));
  return root;
}

function buildUshuaia() {
  const root = new THREE.Group();
  addRibbon(root, "#68e5ce", 2.2, 0.9, 0.025);
  addRibbon(root, "#709de4", 2.32, -0.7, 0.02);
  addRibbon(root, "#b67bd7", 2.05, 0.18, 0.012);
  addRepeated(root, 18, new THREE.OctahedronGeometry(0.1, 0), new THREE.MeshPhysicalMaterial({ color: "#c8eff2", transmission: 0.68, transparent: true, opacity: 0.62, roughness: 0.14 }), 2.2, 910);
  addRepeated(root, 12, new THREE.DodecahedronGeometry(0.045, 0), material("#18232e", 0.05, 0.78), 2.1, 960);
  root.add(particleField(130, "#dff8ff", 2.5, 0.018, 1010));
  return root;
}

function cloneGroup(source: THREE.Group) {
  const clone = source.clone(true);
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
      child.geometry = child.geometry.clone();
      child.material = Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone();
    }
  });
  return clone;
}

export function WorldScene({ activeCity, cityProgress, journeyProgress, onCitySelect, reducedMotion }: Props) {
  const rearRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<LiveState>({ activeCity, cityProgress, journeyProgress, reducedMotion });
  const selectRef = useRef(onCitySelect);

  useEffect(() => {
    stateRef.current = { activeCity, cityProgress, journeyProgress, reducedMotion };
    selectRef.current = onCitySelect;
  }, [activeCity, cityProgress, journeyProgress, onCitySelect, reducedMotion]);

  useEffect(() => {
    const rearCanvas = rearRef.current;
    const frontCanvas = frontRef.current;
    if (!rearCanvas || !frontCanvas) return;

    const rearRenderer = new THREE.WebGLRenderer({ canvas: rearCanvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    const frontRenderer = new THREE.WebGLRenderer({ canvas: frontCanvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    const dpr = Math.min(devicePixelRatio, 1.75);
    rearRenderer.setPixelRatio(dpr);
    frontRenderer.setPixelRatio(dpr);
    rearRenderer.outputColorSpace = THREE.SRGBColorSpace;
    frontRenderer.outputColorSpace = THREE.SRGBColorSpace;
    frontRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    frontRenderer.toneMappingExposure = 1.05;

    const rearScene = new THREE.Scene();
    const frontScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7.2;

    const earth = new THREE.Group();
    frontScene.add(earth);
    const loader = new THREE.TextureLoader();
    const dayMap = loader.load("/earth/earth-day.jpg");
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = Math.min(8, frontRenderer.capabilities.getMaxAnisotropy());
    const normalMap = loader.load("/earth/earth-normal.jpg");
    const specularMap = loader.load("/earth/earth-specular.jpg");
    const globeMat = new THREE.MeshPhongMaterial({
      map: dayMap,
      normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      specularMap,
      specular: new THREE.Color("#7191a0"),
      shininess: 18,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.62, 96, 64), globeMat);
    earth.add(sphere);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: atmosphereFragment,
      uniforms: { glowColor: { value: new THREE.Color(cities[0].glow) } },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.74, 64, 48), atmosphereMaterial);
    earth.add(atmosphere);

    const cloudMap = loader.load("/earth/earth-clouds.png");
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.anisotropy = Math.min(8, frontRenderer.capabilities.getMaxAnisotropy());
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudMap,
      color: "#dbe7eb",
      transparent: true,
      opacity: 0.2,
      alphaTest: 0.018,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.642, 64, 48), cloudMaterial);
    earth.add(clouds);

    const populationCenters: Array<[number, number]> = [
      [35.68, 139.65], [34.69, 135.5], [37.57, 126.98], [31.23, 121.47],
      [22.32, 114.17], [1.35, 103.82], [19.08, 72.88], [25.2, 55.27],
      [30.04, 31.24], [41.01, 28.98], [48.86, 2.35], [51.51, -0.13],
      [52.52, 13.41], [40.42, -3.7], [40.71, -74.01], [34.05, -118.24],
      [41.88, -87.63], [19.43, -99.13], [-23.55, -46.63], [-34.6, -58.38],
      [-33.87, 151.21], [-37.81, 144.96], [-1.29, 36.82], [6.52, 3.38],
    ];
    const lightPositions = new Float32Array(populationCenters.length * 3);
    populationCenters.forEach(([latValue, lngValue], index) => {
      const lat = THREE.MathUtils.degToRad(latValue);
      const lng = THREE.MathUtils.degToRad(lngValue);
      lightPositions[index * 3] = Math.cos(lat) * Math.cos(lng) * 1.655;
      lightPositions[index * 3 + 1] = Math.sin(lat) * 1.655;
      lightPositions[index * 3 + 2] = -Math.cos(lat) * Math.sin(lng) * 1.655;
    });
    const cityLightGeometry = new THREE.BufferGeometry();
    cityLightGeometry.setAttribute("position", new THREE.BufferAttribute(lightPositions, 3));
    const cityLightMaterial = new THREE.PointsMaterial({
      color: "#ffd891",
      size: 0.026,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    earth.add(new THREE.Points(cityLightGeometry, cityLightMaterial));

    const markerMeshes: THREE.Mesh[] = [];
    const markerMat = new THREE.MeshBasicMaterial({ color: "#fff8e9", depthTest: false, transparent: true, opacity: 0.82 });
    cities.forEach((city, index) => {
      const lat = THREE.MathUtils.degToRad(city.lat);
      const lng = THREE.MathUtils.degToRad(city.lng);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), markerMat.clone());
      marker.position.set(Math.cos(lat) * Math.cos(lng) * 1.65, Math.sin(lat) * 1.65, -Math.cos(lat) * Math.sin(lng) * 1.65);
      marker.userData.city = index;
      marker.renderOrder = 20;
      earth.add(marker);
      markerMeshes.push(marker);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.037, 0.048, 24), new THREE.MeshBasicMaterial({ color: city.accent, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthTest: false }));
      ring.userData.city = index;
      marker.add(ring);
    });

    const ambient = new THREE.HemisphereLight("#b9d9ff", "#221311", 1.05);
    const sun = new THREE.DirectionalLight("#ffd6ac", 3.8);
    sun.position.set(-3, 2.2, 4);
    frontScene.add(ambient, sun);
    const rim = new THREE.PointLight("#86d5ff", 5.5, 12);
    rim.position.set(3, -1, 2);
    frontScene.add(rim);

    const stars = particleField(380, "#aebfca", 8, 0.012, 1200);
    stars.scale.z = 0.4;
    rearScene.add(stars);
    const orbitLines: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(2.05 + i * 0.18, 0.0035, 3, 160),
        new THREE.MeshBasicMaterial({ color: i === 1 ? "#788b96" : "#485963", transparent: true, opacity: 0.22 }),
      );
      orbit.rotation.set(0.75 + i * 0.26, 0.2, 0.4 - i * 0.35);
      rearScene.add(orbit);
      orbitLines.push(orbit);
    }

    const builders = [buildTokyo, buildCairo, buildParis, buildNewYork, buildUshuaia];
    const rearRoots = builders.map((build) => {
      const group = build();
      rearScene.add(group);
      return group;
    });
    const frontRoots = rearRoots.map((group) => {
      const clone = cloneGroup(group);
      frontScene.add(clone);
      return clone;
    });

    const spriteTextures: THREE.Texture[] = [];
    const liveLandmarks: LiveLandmark[] = landmarkSprites.map((config) => {
      const texture = loader.load(config.src);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, frontRenderer.capabilities.getMaxAnisotropy());
      spriteTextures.push(texture);

      const materialOptions: THREE.SpriteMaterialParameters = {
        map: texture,
        transparent: true,
        opacity: 0,
        alphaTest: 0.018,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      };
      const rearMaterial = new THREE.SpriteMaterial(materialOptions);
      const frontMaterial = new THREE.SpriteMaterial(materialOptions);
      const rear = new THREE.Sprite(rearMaterial);
      const front = new THREE.Sprite(frontMaterial);
      rear.name = config.id;
      front.name = `${config.id}-foreground`;
      front.renderOrder = 30;
      rear.visible = false;
      front.visible = false;
      rearScene.add(rear);
      frontScene.add(front);
      const initialPosition = new THREE.Vector3(config.entryPoint[0], config.entryPoint[1], config.entryPoint[2]);
      rear.position.copy(initialPosition);
      front.position.copy(initialPosition);
      return {
        config,
        rear,
        front,
        rearMaterial,
        frontMaterial,
        isFront: false,
        wasActive: false,
        position: initialPosition,
        scale: 0.3,
        opacity: 0,
      };
    });

    let width = 1;
    let height = 1;
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      rearRenderer.setSize(width, height, false);
      frontRenderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    addEventListener("resize", resize);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragX = 0;
    let dragY = 0;
    const onDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      frontCanvas.setPointerCapture(event.pointerId);
      frontCanvas.classList.add("is-dragging");
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      dragX += (event.clientX - lastX) * 0.006;
      dragY += (event.clientY - lastY) * 0.004;
      dragY = THREE.MathUtils.clamp(dragY, -0.7, 0.7);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      dragging = false;
      frontCanvas.classList.remove("is-dragging");
      const pointer = new THREE.Vector2((event.clientX / width) * 2 - 1, -(event.clientY / height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markerMeshes, true).find((item) => typeof item.object.userData.city === "number" || typeof item.object.parent?.userData.city === "number");
      const cityIndex = hit && (hit.object.userData.city ?? hit.object.parent?.userData.city);
      if (typeof cityIndex === "number" && Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) < 6) selectRef.current(cityIndex);
    };
    frontCanvas.addEventListener("pointerdown", onDown);
    frontCanvas.addEventListener("pointermove", onMove);
    frontCanvas.addEventListener("pointerup", onUp);
    frontCanvas.addEventListener("pointercancel", onUp);

    let frame = 0;
    let lastTime = performance.now();
    let visibleCity = -1;
    const layerIsFront = [false, false, false, false, false];
    const globeTints = ["#fff0f3", "#ffe1b3", "#f0d0a7", "#f5c2b6", "#c5e3e8"].map((value) => new THREE.Color(value));
    const sunTints = ["#ffc4ce", "#ffd08a", "#ffd8a1", "#ff9a78", "#96cde9"].map((value) => new THREE.Color(value));
    const cloudTargets = [0.22, 0.08, 0.16, 0.3, 0.46];
    const lightTargets = [0.2, 0.08, 0.04, 0.38, 0.56];
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const state = stateRef.current;
      const city = cities[state.activeCity];
      const phase = state.cityProgress;
      const pulse = Math.sin(phase * Math.PI * 2);

      if (visibleCity !== state.activeCity) {
        visibleCity = state.activeCity;
      }

      const targetY = -Math.PI / 2 - THREE.MathUtils.degToRad(city.lng) + dragX;
      const targetX = THREE.MathUtils.degToRad(city.lat) * 0.72 + dragY;
      earth.rotation.y = damp(earth.rotation.y, targetY, state.reducedMotion ? 20 : 2.8, delta);
      earth.rotation.x = damp(earth.rotation.x, targetX, state.reducedMotion ? 20 : 2.8, delta);

      const viewportScale = width < 520 ? 0.58 : width < 850 ? 0.86 : 1;
      earth.scale.setScalar(viewportScale);
      markerMeshes.forEach((marker, index) => {
        const active = index === state.activeCity;
        const target = active ? 2.05 + Math.sin(time * 0.006) * 0.18 : 1;
        marker.scale.setScalar(damp(marker.scale.x, target, 6, delta));
        (marker.material as THREE.MeshBasicMaterial).opacity = active ? 1 : 0.66;
      });

      atmosphereMaterial.uniforms.glowColor.value.lerp(new THREE.Color(city.glow), 1 - Math.exp(-2.4 * delta));
      globeMat.color.lerp(globeTints[state.activeCity], 1 - Math.exp(-1.8 * delta));
      sun.color.lerp(sunTints[state.activeCity], 1 - Math.exp(-2 * delta));
      sun.position.x = -3.5 + state.journeyProgress * 7;
      ambient.intensity = damp(ambient.intensity, [0.8, 1.2, 1.32, 0.82, 0.55][state.activeCity], 2, delta);
      cloudMaterial.opacity = damp(cloudMaterial.opacity, cloudTargets[state.activeCity], 2.2, delta);
      cityLightMaterial.opacity = damp(cityLightMaterial.opacity, lightTargets[state.activeCity], 2.4, delta);
      if (!state.reducedMotion) {
        clouds.rotation.y += delta * 0.006;
      }

      const depth = Math.sin((phase * 1.5 - 0.25) * Math.PI * 2);
      if (depth > 0.16) layerIsFront[state.activeCity] = true;
      if (depth < -0.16) layerIsFront[state.activeCity] = false;
      rearRoots.forEach((root, index) => {
        root.visible = index === state.activeCity && !layerIsFront[index];
      });
      frontRoots.forEach((root, index) => {
        root.visible = index === state.activeCity && layerIsFront[index];
      });
      const rootScale = 0.85 + Math.sin(phase * Math.PI) * 0.22;
      const targetRot = phase * Math.PI * 0.86 + state.activeCity * 0.4;
      for (const [index, root] of [rearRoots[state.activeCity], frontRoots[state.activeCity]].entries()) {
        root.rotation.y = damp(root.rotation.y, targetRot, 3.4, delta);
        root.rotation.z = damp(root.rotation.z, pulse * 0.16, 3, delta);
        root.scale.setScalar(damp(root.scale.x, rootScale, 3, delta));
        root.position.z = index === 0 ? -0.25 : 0.3;
      }

      liveLandmarks.forEach((landmark) => {
        const { config, rear, front, rearMaterial, frontMaterial } = landmark;
        const isActive = config.city === state.activeCity;
        if (!isActive) {
          rear.visible = false;
          front.visible = false;
          rearMaterial.opacity = 0;
          frontMaterial.opacity = 0;
          landmark.wasActive = false;
          return;
        }

        const orbitProgress = pathProgress(phase, config.focalPosition);
        const landmarkPositionScale = width < 520 ? 0.18 : width < 850 ? 0.38 : 1;
        const landmarkSizeScale = width < 520 ? 0.52 : width < 850 ? 0.62 : 1;
        const maximumWidth = config.scale[0] * landmarkSizeScale * 1.06;
        const maximumHeight = config.scale[1] * landmarkSizeScale * 1.06;
        const globeRadius = 1.74 * viewportScale;
        const assetRadius = Math.hypot(maximumWidth, maximumHeight) * 0.36;
        const clearanceRadius = globeRadius + assetRadius + config.orbitSize * landmarkPositionScale;
        const targetPosition = sampleOrbitPoint(config, orbitProgress, clearanceRadius, landmarkPositionScale);
        const foregroundLift =
          (height < 760 ? 0.62 : 0) *
          smoothSegment(0.25, 0.34, orbitProgress) *
          (1 - smoothSegment(0.76, 0.86, orbitProgress));
        targetPosition.y += foregroundLift;
        const targetScale = sampleOrbitScale(orbitProgress);
        const motionRate = state.reducedMotion ? 30 : orbitProgress < 0.12 || orbitProgress > 0.88 ? 13 : 8.5;
        const radialDistanceBefore = Math.hypot(landmark.position.x, landmark.position.y);
        const safelyPastLimbBefore = radialDistanceBefore >= clearanceRadius * 0.9;

        if (!landmark.wasActive) {
          landmark.position.copy(targetPosition);
          landmark.scale = targetScale;
          landmark.opacity = 0;
          landmark.isFront = targetPosition.z > 0;
          landmark.wasActive = true;
        } else {
          if (!landmark.isFront && orbitProgress >= 0.3 && orbitProgress <= 0.73 && safelyPastLimbBefore) {
            landmark.isFront = true;
          }
          landmark.position.x = damp(landmark.position.x, targetPosition.x, motionRate, delta);
          landmark.position.y = damp(landmark.position.y, targetPosition.y, motionRate, delta);
          landmark.position.z = damp(landmark.position.z, targetPosition.z, motionRate, delta);
          landmark.scale = damp(landmark.scale, targetScale, motionRate, delta);
        }

        const spriteWidth = config.scale[0] * landmarkSizeScale * landmark.scale;
        const spriteHeight = config.scale[1] * landmarkSizeScale * landmark.scale;
        const currentAssetRadius = Math.hypot(spriteWidth, spriteHeight) * 0.36;
        const currentClearance = globeRadius + currentAssetRadius + config.orbitSize * landmarkPositionScale * 0.72;
        const radialDistance = Math.hypot(landmark.position.x, landmark.position.y);
        const safelyPastLimb = radialDistance >= currentClearance * 0.94;
        if (
          landmark.position.z > 0.16 &&
          safelyPastLimb &&
          orbitProgress >= 0.27 &&
          orbitProgress <= 0.78
        ) {
          landmark.isFront = true;
        }
        if (
          landmark.position.z < -0.16 &&
          safelyPastLimb &&
          (orbitProgress < 0.27 || orbitProgress > 0.82)
        ) {
          landmark.isFront = false;
        }

        const edgeIn = THREE.MathUtils.smoothstep(orbitProgress, 0.015, 0.14);
        const edgeOut = 1 - THREE.MathUtils.smoothstep(orbitProgress, 0.86, 0.985);
        let targetOpacity = config.opacity * edgeIn * edgeOut;
        if (orbitProgress > 0.82 && (landmark.isFront || !safelyPastLimb)) {
          targetOpacity = config.opacity;
        }
        landmark.opacity = damp(landmark.opacity, targetOpacity, state.reducedMotion ? 30 : 9, delta);

        for (const sprite of [rear, front]) {
          sprite.position.copy(landmark.position);
          sprite.scale.set(spriteWidth, spriteHeight, 1);
        }
        rearMaterial.opacity = landmark.opacity;
        frontMaterial.opacity = landmark.opacity;
        rearMaterial.rotation = Math.sin(orbitProgress * Math.PI * 2) * 0.018 * config.direction;
        frontMaterial.rotation = rearMaterial.rotation;
        rear.visible = !landmark.isFront && landmark.opacity > 0.01;
        front.visible = landmark.isFront && landmark.opacity > 0.01;
      });
      if (!state.reducedMotion) {
        stars.rotation.y += delta * 0.008;
        orbitLines.forEach((orbit, index) => {
          orbit.rotation.y += delta * (index % 2 === 0 ? 0.004 : -0.003);
          orbit.rotation.z += delta * (0.002 + index * 0.0007);
        });
      }
      rearRenderer.render(rearScene, camera);
      frontRenderer.render(frontScene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      frontCanvas.removeEventListener("pointerdown", onDown);
      frontCanvas.removeEventListener("pointermove", onMove);
      frontCanvas.removeEventListener("pointerup", onUp);
      frontCanvas.removeEventListener("pointercancel", onUp);
      rearRenderer.dispose();
      frontRenderer.dispose();
      dayMap.dispose();
      normalMap.dispose();
      specularMap.dispose();
      cloudMap.dispose();
      spriteTextures.forEach((texture) => texture.dispose());
      rearScene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      frontScene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
    };
  }, []);

  return (
    <div className="world-stage" aria-label="Interactive Earth with five city markers">
      <canvas ref={rearRef} className="webgl-layer webgl-rear" aria-hidden="true" />
      <div className="earth-shadow" aria-hidden="true" />
      <canvas ref={frontRef} className="webgl-layer webgl-front" aria-label="Drag to rotate Earth; select glowing city markers to navigate" />
    </div>
  );
}
