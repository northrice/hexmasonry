import { THREE, GLTFLoader } from './globals.js';
import { scene, camera, renderer, params, controls, light} from './setup.js';
import { createMesh, initHDRI, brushesArray, getShapeBrushes, meshParamsByShape } from './mesh-utils.js';

let mesh = null;

function updateMesh() {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  const mesh_params = meshParamsByShape[params.shapeType];
  const brushes = getShapeBrushes(params, mesh_params);
  mesh = createMesh(brushes, params);
  if (mesh) scene.add(mesh);

  window.mesh = mesh; 

  if (light) {
    light.intensity = params.lightIntensity;
    light.position.set(params.lightXPos, params.lightYPos, params.lightZPos);
  }

  const boxHelper = new THREE.BoxHelper(mesh, 0xff00ff); // Magenta box
  scene.add(boxHelper);
  window.boxHelper = boxHelper; // Optional: for console debugging

  return mesh;
}

// HDRI init
initHDRI(scene, updateMesh);

// Load model
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

export { updateMesh, mesh};
