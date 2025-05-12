import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  THREE
} from './globals.js';
import { controls } from './setup.js';

import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'https://esm.sh/three@0.155.0/src/extras/PMREMGenerator.js';
import { FilmPass } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/FilmPass.js';
import { BokehPass } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/ShaderPass.js';
import { scene, camera, renderer, gui } from './setup.js';

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .setPath('/textures/')
  .load('studio_small_03_1k.hdr', (hdrEquirect) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
    scene.environment = envMap;
    scene.background = new THREE.Color(0xfffff0);
    hdrEquirect.dispose();
    pmremGenerator.dispose();
  });

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomParams = { strength: 0.45, radius: 0.65, threshold: 0.2 };
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
);
composer.addPass(bloomPass);

const staticGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    grainAmount: { value: 0.02 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float grainAmount;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = rand(vUv) * grainAmount;
      gl_FragColor = vec4(color.rgb + grain, color.a);
    }
  `
};
const staticGrainPass = new ShaderPass(staticGrainShader);
composer.addPass(staticGrainPass);

const bokehParams = {
  focusDistance: 15.0,
  fStop: 1.4,
  focalLength: 35
};

const bokehPass = new BokehPass(scene, camera, {
  focus: bokehParams.focusDistance,
  aperture: 0.00025, // temp override, will be updated dynamically
  maxblur: 0.1
});
composer.addPass(bokehPass);

const focusBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
const focusBoxMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
  depthWrite: false
});
const focusBox = new THREE.Mesh(focusBoxGeometry, focusBoxMaterial);
focusBox.visible = true;
scene.add(focusBox);

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.2 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float offset;
    uniform float darkness;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      gl_FragColor = texel * smoothstep(0.8, 0.0, dot(uv, uv) * darkness);
    }
  `
};
const vignettePass = new ShaderPass(vignetteShader);
composer.addPass(vignettePass);

const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(bloomParams, 'strength', 0, 5).step(0.01).onChange(val => bloomPass.strength = val);
bloomFolder.add(bloomParams, 'radius', 0, 1).step(0.01).onChange(val => bloomPass.radius = val);
bloomFolder.add(bloomParams, 'threshold', 0, 1).step(0.01).onChange(val => bloomPass.threshold = val);
bloomFolder.open();

const bokehFolder = gui.addFolder('Depth of Field');
bokehFolder.add(bokehParams, 'fStop', 0.8, 22.0).name('F-Stop').onChange(updateAperture);
bokehFolder.add(bokehParams, 'focalLength', 10, 85).name('Focal Length (mm)').onChange(updateAperture);
bokehFolder.add({ showFocusBox: true }, 'showFocusBox').name('Show Focus Box').onChange(val => focusBox.visible = val);
bokehFolder.add(bokehPass.materialBokeh.uniforms.maxblur, 'value', 0.001, 0.2).name('Max Blur');
bokehFolder.open();

function updateAperture() {
  const sensorHeight = 24; // mm
  const imageHeight = window.innerHeight;
  const pixelSize = sensorHeight / imageHeight;
  const aperture = (bokehParams.focusDistance * pixelSize) / (bokehParams.fStop * bokehParams.focalLength);
  bokehPass.materialBokeh.uniforms.aperture.value = aperture;
  console.log(`📸 f/${bokehParams.fStop}, FL: ${bokehParams.focalLength}mm, Aperture: ${aperture.toExponential(4)}`);
}
updateAperture();

const vignetteFolder = gui.addFolder('Vignette');
vignetteFolder.add(vignetteShader.uniforms.offset, 'value', 0.5, 2.0).name('Offset');
vignetteFolder.add(vignetteShader.uniforms.darkness, 'value', 0.5, 3.0).name('Darkness');
vignetteFolder.open();

const grainFolder = gui.addFolder('Static Grain');
grainFolder.add(staticGrainShader.uniforms.grainAmount, 'value', 0.0, 0.1).name('Grain Amount');
grainFolder.open();

window.addEventListener('resize', () => {
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  composer.setSize(size.x, size.y);
  bloomPass.setSize(size.x, size.y);

  camera.aspect = size.x / size.y;
  camera.updateProjectionMatrix();
  renderer.setSize(size.x, size.y);
  updateAperture();
});

export function renderSceneWithBloom() {
  const targetWorldPos = controls.target.clone();
  const targetViewSpace = targetWorldPos.clone().applyMatrix4(camera.matrixWorldInverse);
  const viewZ = -targetViewSpace.z;

  const newFocus = camera.position.distanceTo(controls.target);
bokehParams.focusDistance = newFocus;
bokehPass.materialBokeh.uniforms.focus.value = newFocus;

  const focusWorldPos = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(bokehParams.focusDistance));
  focusBox.position.copy(focusWorldPos);
  focusBox.lookAt(focusWorldPos.clone().add(camera.getWorldDirection(new THREE.Vector3())));

  const aperture = bokehPass.materialBokeh.uniforms.aperture.value;
  const margin = aperture * 10000;
  const thickness = margin * 2;
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * bokehParams.focusDistance;
  const width = height * camera.aspect;

  focusBox.scale.set(width, height, thickness);

  const worldDistance = camera.position.distanceTo(controls.target);
  console.log(`🎯 Focus Distance: ${bokehParams.focusDistance.toFixed(2)}, 📏 World Distance: ${worldDistance.toFixed(2)}, 🔘 Aperture: ${aperture.toExponential(4)}`);

  composer.render();
}

export {
  scene,
  camera,
  renderer,
  composer
};
