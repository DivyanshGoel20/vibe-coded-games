import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const BED_ASSET_URL = '/bed.glb';

function showOnlyBed() {
  document.getElementById('app')!.innerHTML = '';

  // Scene, camera, renderer
  const scene = new THREE.Scene();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x6b4f2c); // Sepia brown
  document.getElementById('app')!.appendChild(renderer.domElement);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemiLight);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  // Load and add the 3D bed asset
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    BED_ASSET_URL, 
    (gltf: any) => {
      const bedModel = gltf.scene;
      
      // Compute bounding box
      const box = new THREE.Box3().setFromObject(bedModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Center the bed at origin
      bedModel.position.x -= center.x;
      bedModel.position.y -= box.min.y; // Place on ground
      bedModel.position.z -= center.z;

      // Scale the bed to a reasonable size
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 3; // Increased from 2.5
      const scale = desiredSize / maxDim;
      bedModel.scale.set(scale, scale, scale);

      scene.add(bedModel);

      // Position camera much further back with better angle
      const distance = Math.max(size.x, size.z) * scale * 2; // Dynamic distance based on bed size
      camera.position.set(distance * 0.8, distance * 0.6, distance * 1.2);
      camera.lookAt(0, 0, 0); // Look at center of bed

      console.log('Bed loaded:', {
        originalSize: size,
        scaledSize: size.clone().multiplyScalar(scale),
        cameraPosition: camera.position,
        scale: scale
      });

      // Add axes helper for debugging (uncomment to see coordinate system)
      // scene.add(new THREE.AxesHelper(2));
    },
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading bed model:', error);
      
      // Fallback: create a simple bed shape if model fails to load
      const geometry = new THREE.BoxGeometry(2, 0.5, 1.5);
      const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      const fallbackBed = new THREE.Mesh(geometry, material);
      fallbackBed.position.y = 0.25;
      scene.add(fallbackBed);
      
      // Position camera for fallback
      camera.position.set(4, 3, 5);
      camera.lookAt(0, 0, 0);
      
      console.log('Using fallback bed geometry');
    }
  );

  // Responsive resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation loop
  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

showOnlyBed();