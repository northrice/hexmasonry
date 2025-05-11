import { Brush, Evaluator, ADDITION, THREE, RGBELoader } from './globals.js';

let hdrTexture = null;
const uvTestTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

let brushesArray = [];

// SHAPE SELECTION
const shapeOptions = ['capped cylinder', 'capped octagon', 'capped square', 'custom polygon'];

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
    radius: { min: 1, max: 20, step: 0.1 },
    height: { min: 1, max: 50, step: 0.1 },
    topSquash: { min: 0, max: 1, step: 0.01 },
    bottomSquash: { min: 0, max: 1, step: 0.01 },
    sphereWidthSegments: { min: 3, max: 128, step: 1 },
    sphereHeightSegments: { min: 2, max: 64, step: 1 }
  },
  'capped square': {
    width: { min: 1, max: 20, step: 0.1 },
    height: { min: 1, max: 20, step: 0.1 },
    roundness: { min: 0, max: 1, step: 0.05 }
  },

  'custom polygon': {
    height: { min: 1, max: 50, step: 0.1 },
    topSquash: { min: 0, max: 1, step: 0.01 },
    bottomSquash: { min: 0, max: 1, step: 0.01 },
    side0Radius: { min: 1, max: 20, step: 0.1 },
    side1Radius: { min: 1, max: 20, step: 0.1 },
    side2Radius: { min: 1, max: 20, step: 0.1 },
    side3Radius: { min: 1, max: 20, step: 0.1 },
    side4Radius: { min: 1, max: 20, step: 0.1 },
    side5Radius: { min: 1, max: 20, step: 0.1 },
    side6Radius: { min: 1, max: 20, step: 0.1 },
    side7Radius: { min: 1, max: 20, step: 0.1 }
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
      radius: 5,
      height: 10,
      topSquash: 0.5,
      bottomSquash: 1,
      sphereWidthSegments: 32,
      sphereHeightSegments: 16
    },
    'capped square': {
      width: 5,
      height: 10,
      roundness: 0.2
    },
    'custom polygon': { //8 sides
      radius: 5,
      height: 10,
      topSquash: 0.5,
      bottomSquash: 1,
      side0Radius: 5,
      side1Radius: 5,
      side2Radius: 5,
      side3Radius: 5,
      side4Radius: 5,
      side5Radius: 5,
      side6Radius: 5,
      side7Radius: 5
    }
  };

  return structuredClone(defaults[shape] || {});
}
const meshParamsByShape = {
  'capped cylinder': getMeshParams('capped cylinder'),
  'capped octagon': getMeshParams('capped octagon'),
  'capped square': getMeshParams('capped square'),
  'custom polygon': getMeshParams('custom polygon')
};

function getShapeBrushes(params, mesh_params) {
  switch (params.shapeType) {
    case 'capped cylinder':
      return createCappedCylinder(mesh_params);
    case 'capped octagon':
      return createCappedOctagon(mesh_params);
    case 'capped square':
      return createCappedSquare(mesh_params);
    case 'custom polygon':
      return createCappedCustomPolygon(mesh_params);
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
  const radius = mesh_params.radius;
  const height = mesh_params.height;

  // 8-sided faceted cylinder (approximates octagon prism)
  const body = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    8, // 8 segments = octagon
    1,
    true
  );

  // Top cap
  const top = new THREE.SphereGeometry(
    radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  top.scale(1, mesh_params.topSquash, 1);
  top.translate(0, height / 2, 0);

  // Bottom cap
  const bottom = new THREE.SphereGeometry(
    radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI
  );
  bottom.scale(1, mesh_params.bottomSquash, 1);
  bottom.translate(0, -height / 2, 0);

  return [
    new Brush(body),
    new Brush(top),
    new Brush(bottom)
  ];
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

function createCappedCustomPolygon(mesh_params) {
  const height = mesh_params.height;
  const shape = new THREE.Shape();

  const segments = 8;
  const angleStep = (Math.PI * 2) / segments;

  // Collect all corner radii (side0Radius ... side7Radius)
  const radii = [];
  for (let i = 0; i < segments; i++) {
    radii.push(mesh_params[`side${i}Radius`] || mesh_params.radius);
  }

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    const r = radii[i];
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  // Extrude prism
  const extrudeSettings = {
    depth: height,
    bevelEnabled: false
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.translate(0, -height / 2, 0); // center vertically

  // Top cap
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
  top.translate(0, height / 2, 0);

  // Bottom cap
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
  bottom.translate(0, -height / 2, 0);

  return [
    new Brush(geometry),
    new Brush(top),
    new Brush(bottom)
  ];
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

  // Update matrix so bounding box reflects scale
  mesh.updateMatrixWorld(true);

  // Compute bounding box in world space
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();

  box.getCenter(center);
  box.getSize(size);

  mesh.userData.boundingBox = box;
  mesh.userData.boxCenter = center;
  mesh.userData.boxSize = size;

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

export { createMesh, applyUVs, initHDRI, brushesArray, shapeOptions, getShapeBrushes, getMeshParams, meshParamsByShape, shapeMeshParamSchemas   };
