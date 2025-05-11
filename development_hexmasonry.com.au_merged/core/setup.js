import { updateMesh } from './build.js'
import { updateCamera } from './build.js';

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

export {
  params,
  scene,
  camera,
  renderer,
  controls,
  gui
};
