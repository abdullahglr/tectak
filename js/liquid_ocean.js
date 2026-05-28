/**
 * TECTAK - Liquid Ocean 3D Background Animation
 * Geliştirici: Abdullah GÜLER & Antigravity
 * Altyapı: Three.js
 */

(function() {
  const container = document.getElementById('site-ocean-container');
  if (!container || typeof THREE === 'undefined') return;

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || window.innerHeight;

  // Scene
  const scene = new THREE.Scene();
  const backgroundColor = 0x0a0a0f; // TECTAK --bg-primary
  const accentColor = 0x00ffff;      // Cyan

  scene.background = new THREE.Color(backgroundColor);
  scene.fog = new THREE.FogExp2(backgroundColor, 0.08);

  // Camera
  const camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 50);
  camera.position.set(0, 3.5, 11);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, accentColor, 1.2);
  scene.add(hemiLight);

  const pointLight1 = new THREE.PointLight(accentColor, 2, 30);
  pointLight1.position.set(-5, 5, -10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(accentColor, 1, 15);
  pointLight2.position.set(5, 2, 5);
  scene.add(pointLight2);

  // Rotating group
  const group = new THREE.Group();
  scene.add(group);

  // Grid Helper (Liquid Ocean style)
  const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x1e293b);
  gridHelper.position.y = -1.2;
  group.add(gridHelper);

  // Ocean Mesh
  const oceanSize = 35;
  const oceanFragments = 30;
  const waveAmplitude = 0.08; // Calm Waters setting
  const waveSpeed = 0.02;     // Calm Waters setting

  const geo = new THREE.PlaneGeometry(oceanSize, oceanSize, oceanFragments, oceanFragments);
  const positionAttribute = geo.getAttribute('position');
  
  const waves = [];
  for (let i = 0; i < positionAttribute.count; i++) {
    waves.push({
      x: positionAttribute.getX(i),
      y: positionAttribute.getY(i),
      z: positionAttribute.getZ(i),
      ang: Math.random() * Math.PI * 2,
      amp: Math.random() * waveAmplitude,
      speed: 0.01 + Math.random() * waveSpeed,
    });
  }

  const surfaceMaterial = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.1,
    wireframe: false,
    side: THREE.DoubleSide
  });

  const wireframeMaterial = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  });

  const oceanMesh = new THREE.Mesh(geo, surfaceMaterial);
  const wireframeMesh = new THREE.Mesh(geo, wireframeMaterial);

  const oceanGroup = new THREE.Group();
  oceanGroup.rotation.x = -90 * Math.PI / 180;
  oceanGroup.add(oceanMesh);
  oceanGroup.add(wireframeMesh);
  group.add(oceanGroup);

  // Boats (floating box pillars)
  const boatCount = 0; // Calm Waters setting (no boats)
  const boatSpread = 6;
  const boats = [];
  const boatGeom = new THREE.BoxGeometry(0.4, 1.2, 0.4);
  const boatMat = new THREE.MeshStandardMaterial({ 
    color: accentColor, 
    roughness: 0.2,
    metalness: 0.8
  });

  for (let i = 0; i < boatCount; i++) {
    const x = -Math.random() * boatSpread + Math.random() * boatSpread;
    const z = -Math.random() * boatSpread + Math.random() * boatSpread;
    const sX = 0.4 + Math.random() * 0.6;
    const sY = 0.5 + Math.random() * 1.5;

    const mesh = new THREE.Mesh(boatGeom, boatMat);
    mesh.position.set(x, 0, z);
    mesh.scale.set(sX, sY, sX);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    group.add(mesh);

    boats.push({
      mesh,
      vel: 1 + Math.random() * 3,
      amp: 1 + Math.random() * 4,
      pos: 0.03 + Math.random() * 0.08,
    });
  }

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime() * 3;

    // Ocean Waves
    const posAttr = geo.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      const wave = waves[i];
      // Apply displacement wave math
      posAttr.setX(i, wave.x + Math.cos(wave.ang) * wave.amp);
      posAttr.setY(i, wave.y + Math.sin(wave.ang / 2) * wave.amp);
      posAttr.setZ(i, wave.z + Math.cos(wave.ang / 3) * wave.amp);
      wave.ang += wave.speed;
    }
    posAttr.needsUpdate = true;

    // Boats Bobbing
    boats.forEach(boat => {
      boat.mesh.rotation.z = (Math.sin(time / boat.vel) * boat.amp * Math.PI) / 180;
      boat.mesh.rotation.x = (Math.cos(time) * boat.vel * Math.PI) / 180;
      // center height bobbing
      boat.mesh.position.y = Math.sin(time / boat.vel) * boat.pos - 1.0; 
    });

    // Scene Rotation
    group.rotation.y += 0.0003; // Calm Waters setting

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
})();
