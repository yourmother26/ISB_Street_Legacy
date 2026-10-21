import * as THREE from 'three';

export async function initEngine(canvas, { onStats = () => {} } = {}) {
  if (!canvas) throw new Error('Game canvas was not found.');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fc8e8);
  scene.fog = new THREE.Fog(0x9fc8e8, 95, 260);
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 450);
  camera.position.set(0, 2.2, 14);

  scene.add(new THREE.HemisphereLight(0xd7edff, 0x69735d, 2.1));
  const sun = new THREE.DirectionalLight(0xffedcf, 2.0);
  sun.position.set(-35, 65, 28);
  scene.add(sun);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x657a55, roughness: 1 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x25292e, roughness: 1 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb9b8ad, roughness: 1 });
  const whitePaint = new THREE.MeshBasicMaterial({ color: 0xf3f1e8 });
  const yellowPaint = new THREE.MeshBasicMaterial({ color: 0xf0c84a });
  const concreteMats = [0xd7c7a9, 0xb9c3c9, 0xc4b3a2, 0x9da9a8, 0xe0d9cb].map(color => new THREE.MeshStandardMaterial({ color, roughness: .95 }));
  const houseMats = [0xf0bd65, 0xe5e0d2, 0xd96f5e, 0x70a6c4, 0x91b978, 0xc8a2ce, 0xe7d66f, 0xd8e5e8, 0xc17f50].map(color => new THREE.MeshStandardMaterial({ color, roughness: .9 }));
  const roofMats = [0x873f35, 0x4b5056, 0x8a6c47, 0x315c68].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x8fd8f2, emissive: 0x17394b, roughness: .35, metalness: .1 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x593b2a, roughness: .9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b422b, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7946, roughness: 1 });

  function box(name, material, x, y, z, w, h, d, castShadow = false) {
    const mesh = new THREE.Mesh(boxGeo, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  function groundPlane(material, x, z, w, d, y = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // Ground and a small road network: dark asphalt, pale kerbs and clear white markings.
  groundPlane(groundMat, 0, 0, 300, 300, -.12);
  const roadXs = [-42, 0, 42];
  const roadZs = [-48, 0, 48];
  for (const x of roadXs) {
    groundPlane(asphaltMat, x, 0, 13, 250, -.015);
    for (const side of [-1, 1]) {
      box('road kerb', sidewalkMat, x + side * 7.05, .06, 0, .34, .12, 250);
      for (let z = -120; z <= 120; z += 12) {
        groundPlane(whitePaint, x, z, .18, 5.1, .012);
      }
      box('road edge line', whitePaint, x + side * 5.95, .012, 0, .12, .02, 250);
    }
  }
  for (const z of roadZs) {
    groundPlane(asphaltMat, 0, z, 250, 13, -.01);
    for (const side of [-1, 1]) {
      box('road kerb', sidewalkMat, 0, .06, z + side * 7.05, 250, .12, .34);
      for (let x = -120; x <= 120; x += 12) {
        groundPlane(whitePaint, x, z, 5.1, .18, .013);
      }
      box('road edge line', whitePaint, 0, .012, z + side * 5.95, 250, .02, .12);
    }
  }
  // Crosswalks at the larger intersections.
  for (const cx of roadXs) for (const cz of roadZs) {
    for (let i = -4; i <= 4; i++) {
      groundPlane(whitePaint, cx + i * 1.15, cz - 8.4, .72, 2.2, .025);
      groundPlane(whitePaint, cx - 8.4, cz + i * 1.15, 2.2, .72, .025);
    }
  }

  // Reproducible city layout, with homes, shops, apartments and a few taller buildings.
  let seed = 98231;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const choose = list => list[Math.floor(random() * list.length)];
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const treeGeo = new THREE.SphereGeometry(1, 7, 5);
  const houseLots = [];
  for (let blockX = -1; blockX <= 1; blockX++) {
    for (let blockZ = -1; blockZ <= 1; blockZ++) {
      const centerX = blockX * 42;
      const centerZ = blockZ * 48;
      // Each city block has several separate lots, leaving yards and footpaths.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = centerX + sx * (12 + random() * 4);
        const z = centerZ + sz * (14 + random() * 5);
        houseLots.push({ x, z, blockX, blockZ });
      }
    }
  }

  for (const lot of houseLots) {
    const isTower = random() < .16;
    const isShop = !isTower && random() < .25;
    const w = isTower ? 10 + random() * 5 : 6 + random() * 3.2;
    const d = isTower ? 10 + random() * 5 : 6 + random() * 4;
    const h = isTower ? 17 + random() * 24 : isShop ? 5 + random() * 2 : 3.4 + random() * 2.5;
    const mat = isTower ? choose(concreteMats) : choose(houseMats);
    box(isTower ? 'mid-rise building' : isShop ? 'street shop' : 'coloured house', mat, lot.x, h / 2, lot.z, w, h, d, true);
    // Flat roofs for shops/apartments, pitched-looking roof caps for houses.
    if (!isTower && !isShop) {
      const roof = new THREE.Mesh(roofGeo, choose(roofMats));
      roof.scale.set(w * .76, Math.max(1.7, h * .45), d * .76);
      roof.position.set(lot.x, h + roof.scale.y * .42, lot.z);
      roof.rotation.y = random() * Math.PI / 2;
      scene.add(roof);
    } else {
      box('roof trim', choose(roofMats), lot.x, h + .12, lot.z, w + .2, .24, d + .2);
    }
    // Front-facing doors and windows; keep the facade detail light for mobile GPUs.
    const frontZ = lot.z + d / 2 + .035;
    box('front door', doorMat, lot.x + (random() - .5) * w * .35, Math.min(1.1, h * .28), frontZ, .8, 1.9, .08);
    if (h < 9) {
      for (const wx of [-1, 1]) {
        box('front window', windowMat, lot.x + wx * w * .25, Math.min(2.3, h * .58), frontZ + .015, 1.05, .85, .08);
      }
    } else {
      for (let floor = 1; floor < Math.min(5, Math.floor(h / 3)); floor++) {
        for (const wx of [-1, 1]) box('building window', windowMat, lot.x + wx * w * .25, floor * 2.7, frontZ, 1.1, 1.25, .08);
      }
    }
    // Small yard wall and a tree make residential blocks feel less like a tower canyon.
    if (!isTower && random() > .3) {
      box('yard wall', choose(concreteMats), lot.x, .48, lot.z + d / 2 + 2.3, w + 2.5, .9, .22);
      const tx = lot.x + (random() > .5 ? 1 : -1) * (w / 2 + 2);
      box('tree trunk', trunkMat, tx, 1.15, lot.z, .38, 2.3, .38);
      const leaves = new THREE.Mesh(treeGeo, leafMat);
      leaves.position.set(tx, 3, lot.z);
      leaves.scale.set(1.5, 1.7, 1.5);
      scene.add(leaves);
    }
  }

  // Streetlights and a few small blue signs along the central avenue.
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4249, roughness: .8 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffefc1 });
  for (let z = -105; z <= 105; z += 21) {
    for (const side of [-1, 1]) {
      const x = side * 7.9;
      box('streetlight pole', poleMat, x, 2.8, z, .12, 5.6, .12);
      box('streetlight arm', poleMat, x - side * .65, 5.45, z, 1.35, .12, .12);
      box('streetlight lamp', lampMat, x - side * 1.25, 5.38, z, .48, .12, .28);
    }
  }

  // Free camera: mouse/touch look, WASD/arrow movement, plus left-side touch joystick dragging.
  let yaw = 0;
  let pitch = -.06;
  let dragging = false;
  let dragMode = 'look';
  let lastX = 0, lastY = 0;
  let moveX = 0, moveY = 0;
  let paused = false;
  const keys = new Set();
  const onKeyDown = e => {
    if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(e.key)) {
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
      keys.add(e.key.toLowerCase());
    }
  };
  const onKeyUp = e => keys.delete(e.key.toLowerCase());
  const onPointerDown = e => {
    if (paused || e.clientX < window.innerWidth * .38) return;
    dragging = true;
    dragMode = 'look';
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragging || paused) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (dragMode === 'look') {
      yaw -= dx * .0042;
      pitch = THREE.MathUtils.clamp(pitch - dy * .0032, -1.35, 1.15);
    } else {
      moveX = THREE.MathUtils.clamp(dx / 58, -1, 1);
      moveY = THREE.MathUtils.clamp(dy / 58, -1, 1);
    }
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerUp = () => { dragging = false; moveX = 0; moveY = 0; };
  const onWheel = e => {
    camera.position.y = THREE.MathUtils.clamp(camera.position.y + e.deltaY * .008, 1.4, 24);
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { keys.clear(); moveX = 0; moveY = 0; });

  let lastTime = performance.now(), sampleStart = lastTime, frames = 0, frameMs = 0, running = true;
  function resize() {
    const viewport = window.visualViewport;
    const w = Math.max(1, Math.round(viewport?.width || window.innerWidth));
    const h = Math.max(1, Math.round(viewport?.height || window.innerHeight));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    frames++;
    if (now - sampleStart >= 600) {
      const fps = Math.round(frames * 1000 / (now - sampleStart));
      frameMs = Math.round((now - sampleStart) / Math.max(frames, 1) * 10) / 10;
      frames = 0; sampleStart = now;
      onStats({ fps, frameMs, renderer: 'WebGL · free cam' });
    }
    if (paused) { renderer.render(scene, camera); return; }
    let forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - moveY;
    let strafe = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + moveX;
    const length = Math.hypot(forward, strafe);
    if (length > 1) { forward /= length; strafe /= length; }
    const speed = (keys.has('shift') ? 24 : 11) * dt;
    camera.position.x += (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed;
    camera.position.z += (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * speed;
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.4, 30);
    const lookDir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(camera.position.clone().add(lookDir));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  return {
    renderer, scene, camera,
    setMoveInput(x, y) { moveX = THREE.MathUtils.clamp(x, -1, 1); moveY = THREE.MathUtils.clamp(y, -1, 1); },
    setPaused(value) { paused = Boolean(value); if (paused) { keys.clear(); moveX = 0; moveY = 0; dragging = false; } },
    setQuality(level) {
      const ratio = level === 'high' ? 1.3 : level === 'low' ? .8 : 1.05;
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * ratio, 1.25));
      resize();
    },
    dispose() {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      renderer.dispose();
    }
  };
}
