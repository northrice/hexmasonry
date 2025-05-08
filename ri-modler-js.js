import * as THREE from 'https://esm.sh/three@0.155.0';
import { Brush, Evaluator, ADDITION } from 'https://esm.sh/three-bvh-csg@0.0.17';
import { OrbitControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://esm.sh/three@0.155.0/examples/jsm/libs/lil-gui.module.min.js';
import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';

const params = {
  meshScale: 1,
  modelPosX: 0,
  modelPosY: 1,
  modelPosZ: 0,
  modelScale: 1,
  cameraY: 0,
  radialSegments: 64,
  sphereWidthSegments: 64,
  sphereHeightSegments: 32,
  radius: 5,
  height: 10,
  topSquash: 0.5,
  bottomSquash: 1,
  distance: 30,
  azimuth: 45,
  phi: 60,
  useUVTest: false
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById('threejs-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 100;

const gui = new GUI();

// Position top-left
const guiContainer = gui.domElement;
guiContainer.style.position = 'absolute';
guiContainer.style.top = '20px';
guiContainer.style.left = '20px';
guiContainer.style.zIndex = '100';
document.body.appendChild(guiContainer);

// Make draggable
let isDragging = false, offsetX = 0, offsetY = 0;
guiContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - guiContainer.offsetLeft;
  offsetY = e.clientY - guiContainer.offsetTop;
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  guiContainer.style.left = `${e.clientX - offsetX}px`;
  guiContainer.style.top = `${e.clientY - offsetY}px`;
});
document.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.userSelect = '';
});
gui.add(params, 'height', 1, 30).step(0.5).onChange(updateMesh);
gui.add(params, 'topSquash', 0.01, 1).step(0.01).onChange(updateMesh);
gui.add(params, 'bottomSquash', 0.01, 1).step(0.01).onChange(updateMesh);
gui.add(params, 'distance', 5, 100).step(1).onChange(updateCamera);
gui.add(params, 'azimuth', 0, 360).step(1).onChange(updateCamera);
gui.add(params, 'phi', 0, 180).step(1).onChange(updateCamera);
gui.add(params, 'useUVTest').onChange(updateMesh);
gui.add(params, 'cameraY', -100, 100).step(0.5).onChange(updateCamera);
gui.add(params, 'modelScale', 0.01, 10).step(0.01).onChange(() => {
  if (window.loadedModel) window.loadedModel.scale.setScalar(params.modelScale);
});
gui.add(params, 'modelPosX', -50, 50).step(0.1).onChange(() => {
  if (window.loadedModel) window.loadedModel.position.x = params.modelPosX;
});
gui.add(params, 'modelPosY', -50, 50).step(0.1).onChange(() => {
  if (window.loadedModel) window.loadedModel.position.y = params.modelPosY;
});
gui.add(params, 'modelPosZ', -50, 50).step(0.1).onChange(() => {
  if (window.loadedModel) window.loadedModel.position.z = params.modelPosZ;
});
gui.add(params, 'radialSegments', 8, 254).step(8).onChange(updateMesh);
gui.add(params, 'meshScale', 0.01, 10).step(0.01).onChange(updateMesh);
gui.add(params, 'sphereWidthSegments', 8, 254).step(8).onChange(updateMesh);
gui.add(params, 'sphereHeightSegments', 8, 128).step(4).onChange(updateMesh);

let hdrTexture = null;
let uvTestTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

new RGBELoader()
  .setPath('./textures/')
  .load('studio_small_03_2k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    hdrTexture = texture;
    scene.environment = hdrTexture;
    updateMesh();
  });

function createCappedCylinderMesh(radius, height, topSquash, bottomSquash) {
  const cyl = new THREE.CylinderGeometry(radius, radius, height, params.radialSegments, 1, true);

  const top = new THREE.SphereGeometry(radius, params.sphereWidthSegments, params.sphereHeightSegments, 0, Math.PI * 2, 0, Math.PI / 2);
  top.scale(1, topSquash, 1);
  top.translate(0, height / 2, 0);

  const bottom = new THREE.SphereGeometry(radius, params.sphereWidthSegments, params.sphereHeightSegments, 0, Math.PI * 2, Math.PI / 2, Math.PI);
  bottom.scale(1, bottomSquash, 1);
  bottom.translate(0, -height / 2, 0);

  const brushC = new Brush(cyl);
  const brushTop = new Brush(top);
  const brushBottom = new Brush(bottom);

  const evalr = new Evaluator();
  const combined = evalr.evaluate(brushC, brushTop, ADDITION);
  const final = evalr.evaluate(combined, brushBottom, ADDITION);

  applyCylindricalUVs(final.geometry);

  const material = new THREE.MeshBasicMaterial({
    map: params.useUVTest ? uvTestTexture : hdrTexture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(final.geometry, material);
  mesh.scale.setScalar(params.meshScale);
  return mesh;
}

function applyCylindricalUVs(geometry) {
  geometry = geometry.toNonIndexed();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const height = bbox.max.y - bbox.min.y;

  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    let theta = Math.atan2(z, x);
    let u = (theta + Math.PI) / (2 * Math.PI);
    if (u < 0.05) u += 1;
    u = u % 1; // Clamp seam to avoid duplicate UVs at 1.0
    const v = (y - bbox.min.y) / height * 0.98 + 0.01;

    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

let mesh;
function updateMesh() {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  mesh = createCappedCylinderMesh(params.radius, params.height, params.topSquash, params.bottomSquash);
  scene.add(mesh);
  window.mesh = mesh; // Update global reference
}

// Debug exposure
window.scene = scene;
window.camera = camera;

function updateCamera() {
  const azimuthRad = THREE.MathUtils.degToRad(params.azimuth);
  const phiRad = THREE.MathUtils.degToRad(params.phi);

  const x = params.distance * Math.sin(phiRad) * Math.cos(azimuthRad);
  const y = params.distance * Math.cos(phiRad);
  const z = params.distance * Math.sin(phiRad) * Math.sin(azimuthRad);

  camera.position.set(x, y + params.cameraY, z);
  controls.target.set(0, params.cameraY, 0);
  controls.update();
}

updateCamera();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Load external GLB/GLTF model
const modelUrl = 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php';
const loader = new GLTFLoader();
fetch(modelUrl)
  .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
  .then(buffer => loader.parseAsync(buffer, ''))
  .then(gltf => {
    const model = gltf.scene;
    model.scale.setScalar(params.modelScale);
    model.position.set(params.modelPosX, params.modelPosY, params.modelPosZ);
    scene.add(model);
    window.loadedModel = model;
    console.log('✅ Model loaded');
  })
  .catch(err => {
    console.error("Error loading model", err);
  });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
