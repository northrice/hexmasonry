import { THREE, OrbitControls, GUI } from './globals.js';
import { updateCamera } from './camera-utils.js';

const params = {
  modelPosX: 0,
  modelPosY: 0,
  modelPosZ: 0,
  modelScale: 1,
  envScale: 1,
  cameraY: 0,
  distance: 0,
  azimuth: 45,
  phi: 60,
  envPosX: 0,
  envPosY: 0.0,
  envPosZ: 0
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById('threejs-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 100;

// GUI
const gui = new GUI();

// Position top-left
const guiContainer = gui.domElement;
guiContainer.style.position = 'absolute';
guiContainer.style.top = '30px';
guiContainer.style.left = '30px';
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

/* SCALE GRID
const tileSize = 1;
const tilesX = 10;
const tilesZ = 10;

const tileGeometry = new THREE.BoxGeometry(tileSize, 0.05, tileSize);
const tileMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

for (let i = 0; i < tilesX; i++) {
  for (let j = 0; j < tilesZ; j++) {
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.position.set(
      (i - tilesX / 2) * tileSize + tileSize / 2,
      -0.24, // half height to sit on y=0
      (j - tilesZ / 2) * tileSize + tileSize / 2
    );
    scene.add(tile);
  }
}

const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.ShadowMaterial({ opacity: 0.2 });
const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);*/

// Gui Options
gui.add(params, 'distance', 5, 100).step(1).onChange(updateCamera);
gui.add(params, 'azimuth', 0, 360).step(1).onChange(updateCamera);
gui.add(params, 'phi', 0, 180).step(1).onChange(updateCamera);
gui.add(params, 'cameraY', -100, 100).step(0.5).onChange(updateCamera);
gui.add(params, 'modelScale', 0.01, 10).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.scale.setScalar(params.modelScale);
});
gui.add(params, 'envScale', 0.1, 10).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.scale.setScalar(params.envScale);
});
gui.add(params, 'modelPosX', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.x = params.modelPosX;
});
gui.add(params, 'modelPosY', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.y = params.modelPosY;
});
gui.add(params, 'modelPosZ', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.z = params.envModelPosZ;
});
gui.add(params, 'envPosX', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.x = params.envPosX;
});
gui.add(params, 'envPosY', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.y = params.envPosY;
});
gui.add(params, 'envPosZ', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.z = params.envPosZ;
});

// RAYCASTER
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let model = null;
let connectorLine = null;
let clickedPoint = null;
let clickedPointRef = null;

// Exports
export {
  //mesh_params,
  params,
  scene,
  camera,
  renderer,
  controls,
  gui
};
