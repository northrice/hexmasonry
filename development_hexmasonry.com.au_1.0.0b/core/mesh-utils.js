import { Brush, Evaluator, ADDITION, THREE, RGBELoader } from './globals.js';

let hdrTexture = null;
const uvTestTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

let brushesArray = [];

// SHAPE SELECTION
const shapeOptions = ['capped cylinder', 'capped octagon', 'capped square'];

const shapeMeshParamSchemas = {
  'capped cylinder': {
    radius: { min: 1, max: 20, step: 0.1 },
    height: { min: 1, max: 50, step: 0.1 },
    topSquash: { min: 0, max: 1, step: 0.01 },
    bottomSquash: { min: 0, max: 1, step: 0.01 },
    radialSegments: { min: 3, max: 128, step: 1 },
    sphereWidthSegments: { min: 3, max: 128, step: 1 },
    sphereHeightSegments: { min: 2, max: 64, step: 1 }
  },
  'capped octagon': {
    sideLength: { min: 0.1, max: 10, step: 0.1 },
    height: { min: 1, max: 50, step: 0.1 },
    bevelSize: { min: 0, max: 1, step: 0.05 }
  },
  'capped square': {
    width: { min: 1, max: 20, step: 0.1 },
    height: { min: 1, max: 20, step: 0.1 },
    roundness: { min: 0, max: 1, step: 0.05 }
  }
};


function getMeshParams(shape) {
  const defaults = {
    'capped cylinder': {
      radius: 5,
      height: 10,
      topSquash: 0.5,
      bottomSquash: 1,
      radialSegments: 64,
      sphereWidthSegments: 64,
      sphereHeightSegments: 32
    },
    'capped octagon': {
      sideLength: 3,
      height: 10,
      bevelSize: 0.2
    },
    'capped square': {
      width: 5,
      height: 10,
      roundness: 0.2
    }
  };

  return structuredClone(defaults[shape] || {});
}
const meshParamsByShape = {
  'capped cylinder': getMeshParams('capped cylinder'),
  'capped octagon': getMeshParams('capped octagon'),
  'capped square': getMeshParams('capped square')
};

function getShapeBrushes(params, mesh_params) {
  switch (params.shapeType) {
    case 'capped cylinder':
      return createCappedCylinder(mesh_params);
    case 'capped octagon':
      return createCappedOctagon(mesh_params);
    case 'capped square':
      return createCappedSquare(mesh_params);
    default:
      console.warn('Unknown shape type:', params.shapeType);
      return [];
  }
}

function createCappedCylinder(mesh_params) {
  // CREATE CYLINDER
  const cyl = new THREE.CylinderGeometry(
    mesh_params.radius,
    mesh_params.radius,
    mesh_params.height,
    mesh_params.radialSegments,
    1,
    true
  );

  // TOP HEMISPHERE
  const top = new THREE.SphereGeometry(
    mesh_params.radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  top.scale(1, mesh_params.topSquash, 1);
  top.translate(0, mesh_params.height / 2, 0);

  // BOTTOM HEMISPHERE
  const bottom = new THREE.SphereGeometry(
    mesh_params.radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI
  );
  bottom.scale(1, mesh_params.bottomSquash, 1);
  bottom.translate(0, -mesh_params.height / 2, 0);

  return [
    new Brush(cyl),
    new Brush(top),
    new Brush(bottom)
  ];

}

function createCappedOctagon(mesh_params) {
  const shape = new THREE.CylinderGeometry(
    mesh_params.sideLength,
    mesh_params.height,
    mesh_params.bevelSize,
    8, // 8 segments for octagon shape
    1,
    true
  );
  return [new Brush(shape)];
}

function createCappedSquare(mesh_params) {
  const shape = new THREE.CylinderGeometry(
    mesh_params.width,
    mesh_params.height,
    mesh_params.roundness,
    4, // 4 segments for square shape
    1,
    true
  );
  return [new Brush(shape)];
}

function createMesh(brushesArray, params) {
  const evaluator = new Evaluator();

  if (brushesArray.length === 0) return null;

  // Combine all brushes using ADDITION
  let result = brushesArray[0];
  for (let i = 1; i < brushesArray.length; i++) {
    result = evaluator.evaluate(result, brushesArray[i], ADDITION);
  }

  applyUVs(result.geometry);

  const material = new THREE.MeshBasicMaterial({
    map: params.useUVTest ? uvTestTexture : hdrTexture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(result.geometry, material);
  mesh.scale.setScalar(params.meshScale);

  result.geometry.computeBoundingSphere();
  mesh.userData.boundingSphere = result.geometry.boundingSphere;

  return mesh;
}

function applyUVs(geometry) {
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
    u = u % 1;
    const v = (y - bbox.min.y) / height * 0.98 + 0.01;

    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// Load HDRI — optionally called externally to avoid circular reference
function initHDRI(scene, updateMeshCallback) {
  new RGBELoader()
    .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/')
    .load('studio_small_03_2k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      hdrTexture = texture;
      scene.environment = hdrTexture;
      if (updateMeshCallback) updateMeshCallback();
    });
}

export { createMesh, applyUVs, initHDRI, brushesArray, shapeOptions, getShapeBrushes, getMeshParams, meshParamsByShape, shapeMeshParamSchemas};
