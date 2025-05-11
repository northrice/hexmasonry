import { updateMesh } from './build.js'
import { updateCamera } from './build.js';
import { shapeOptions, meshParamsByShape, shapeMeshParamSchemas} from './mesh-utils.js';

const params = {

  modelPosX: 0,
  modelPosY: 1,
  modelPosZ: 0,
  modelScale: 1,
  cameraY: 0,
  distance: 30,
  azimuth: 45,
  phi: 60,
  useUVTest: false,
  meshScale: 1,

  lightIntensity: 1,
  lightXPos: 1,
  lightYPos: 1,
  lightZPos: 1,

  shapeType: 'capped cylinder',
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


// LIGHTING
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// GUI
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

// Gui Options
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

gui.add(params, 'lightIntensity', 0, 2).onChange(updateMesh);
gui.add(params, 'lightXPos', -10, 10).onChange(updateMesh);
gui.add(params, 'lightYPos', -10, 10).onChange(updateMesh);
gui.add(params, 'lightZPos', -10, 10).onChange(updateMesh);

//// SHAPE CHOOSER
let meshParamFolder = null;
rebuildMeshParamsGUI(params.shapeType);

gui.add(params, 'shapeType', shapeOptions).onChange(shape => {
  rebuildMeshParamsGUI(shape); // Update the param sliders for this shape
  updateMesh();                // Regenerate the mesh itself
});


// GUI SCHEMA
function rebuildMeshParamsGUI(currentShape) {
  // ✅ Correct way to remove the previous folder
  if (meshParamFolder) {
    meshParamFolder.destroy(); // ✅ Properly remove the GUI folder
    meshParamFolder = null;
  }

  // Create a new one
  meshParamFolder = gui.addFolder('Mesh Parameters');

  const paramSchema = shapeMeshParamSchemas[currentShape];
  const paramObject = meshParamsByShape[currentShape];

  console.log('paramSchema:', paramSchema);
  console.log('paramObject:', paramObject);

  for (const key in paramSchema) {
    const { min, max, step } = paramSchema[key];
    meshParamFolder
      .add(paramObject, key, min, max, step)
      .onChange(updateMesh);
  }

  meshParamFolder.open();
}



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
  gui,
  light
};
