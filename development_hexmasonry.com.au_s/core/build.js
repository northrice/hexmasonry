import { THREE, GLTFLoader, OrbitControls } from './globals.js';
import {
  applyLightingToSubject,
  applyEnvironmentLighting,
  createLight
} from './lighting.js';
import { scene, camera, renderer, controls } from './setup.js';

// Helper: Ensure all geometry-only nodes are wrapped in a Mesh
function ensureMeshesFromGeometry(object, defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })) {
  object.traverse((child, index) => {
    if (!child.isMesh && child.geometry) {
      const mesh = new THREE.Mesh(child.geometry, defaultMaterial);
      mesh.position.copy(child.position);
      mesh.rotation.copy(child.rotation);
      mesh.scale.copy(child.scale);
      mesh.name = child.name || `GeneratedMesh_${object.name || 'Model'}_${index}`;
      child.parent.add(mesh);
      child.parent.remove(child);
    }
  });
}

function loadModelsIntoScene(configArray, scene, layerCallback) {
  const loader = new GLTFLoader();

  configArray.forEach((config, layerIndex) => {
    const loadMethod = config.sourceType === 'fetch' ? loadViaFetch : loadViaDirect;

    loadMethod(loader, config)
      .then(gltf => {
        const model = gltf.scene;
        model.name = config.name || `Model_${layerIndex}`;
        model.scale.setScalar(config.scale);
        model.position.set(config.position.x, config.position.y, config.position.z);

        ensureMeshesFromGeometry(model);

        let index = 0;
        model.traverse(obj => {
          if (obj.isMesh && obj.material) {
            obj.castShadow = !!config.castShadow;
            obj.receiveShadow = !!config.receiveShadow;
            obj.layers.set(layerIndex);
            if (!obj.name) obj.name = `${model.name}_AutoMesh_${index++}`;
          }
        });

        scene.add(model);

        if (config.type === 'subject') applyLightingToSubject(model);
        if (config.type === 'environment') applyEnvironmentLighting();

        if (Array.isArray(config.lights)) {
          config.lights.forEach(lightConfig => createLight(lightConfig, model));
        }

        if (config.exposeGlobalName) window[config.exposeGlobalName] = model;

        if (layerCallback) layerCallback(model, layerIndex);
      })
      .catch(err => console.error(`❌ Error loading model on layer ${layerIndex}`, err));
  });
}

function loadViaFetch(loader, config) {
  return fetch(config.url)
    .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
    .then(buffer => loader.parseAsync(buffer, ''));
}

function loadViaDirect(loader, config) {
  return new Promise((resolve, reject) => {
    loader.load(config.url, resolve, undefined, reject);
  });
}

export async function initViewer(containerElement, configOrArray) {
  if (!containerElement) throw new Error("Container element is required");

  let config;

  if (typeof configOrArray === 'string') {
    const response = await fetch(configOrArray);
    config = await response.json();
  } else {
    config = { models: configOrArray }; // Wrap array in object
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  const camera = new THREE.PerspectiveCamera(45, containerElement.clientWidth / containerElement.clientHeight, 0.1, 1000);
  camera.position.set(0, 1, 2);
  camera.layers.enableAll();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  containerElement.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 1;
  controls.maxDistance = 1000;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

  // Load models
  loadModelsIntoScene(config.models || [], scene);

  // Animate/render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    camera.aspect = containerElement.clientWidth / containerElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
  });
  resizeObserver.observe(containerElement);

  return { scene, camera, renderer, controls };
}

export { loadModelsIntoScene as loadModels };