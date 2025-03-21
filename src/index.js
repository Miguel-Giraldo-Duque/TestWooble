import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffffff");

const cubeTextureLoader = new THREE.CubeTextureLoader();
// Configuración inicial y constantes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

// Definir uniforms con valores predeterminados
const uniforms = {
  uTime: new THREE.Uniform(0),
  uFrequencySong: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(0.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(0.3),
  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),
  uColorA: new THREE.Uniform(new THREE.Color("#22dfe2")),
  uColorB: new THREE.Uniform(new THREE.Color("#e9dddd")),
};

// Crear material con configuración optimizada
const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms: uniforms,
  silent: true,
  metalness: 1,
  roughness: 0.7,
  color: "#ffffff",
  transmission: 1,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

const depthMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  uniforms: uniforms,
  silent: true,
  depthPacking: THREE.RGBADepthPacking,
});

// Reducir la complejidad de la geometría
let geometry = new THREE.IcosahedronGeometry(2.5, 40);
geometry = mergeVertices(geometry);
geometry.computeTangents();

// Mesh
const wobble = new THREE.Mesh(geometry, material);
wobble.customDepthMaterial = depthMaterial;
scene.add(wobble);

// Luz más simple y precalculada
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);

// Posición inicial de la cámara
if (window.innerWidth < 500) {
  camera.position.set(13, -30, -5);
} else {
  camera.position.set(13, -10, -5);
}
camera.position.z = 6;
camera.lookAt(scene.position); // Asegurar que la cámara mire al centro de la escena

// Función debounce para eventos de resize
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Uso de evento pasivo y debounce para resize
const debouncedResize = debounce(() => {
  // Actualizar tamaños
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Actualizar posición de la cámara
  if (window.innerWidth < 500) {
    camera.position.set(13, -25, -5);
  } else {
    camera.position.set(13, -20, -5);
  }

  // Actualizar propiedades de la cámara
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Actualizar renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
}, 250);

window.addEventListener("resize", debouncedResize, { passive: true });

// Configuración de renderer con opciones de rendimiento
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: window.devicePixelRatio < 2, // Solo usar antialias cuando sea necesario
  powerPreference: "high-performance",
  precision: "mediump", // Usar precisión media para mejorar rendimiento
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

// Carga diferida del environment map
function loadEnvironmentAsync() {
  const cubeTextureLoader = new THREE.CubeTextureLoader();

  // Rutas a las imágenes de la cubemap (6 caras)
  const cubeMapUrls = [
    "path/px.png", // Derecha (positive X)
    "path/nx.png", // Izquierda (negative X)
    "path/py.png", // Arriba (positive Y)
    "path/ny.png", // Abajo (negative Y)
    "path/pz.png", // Frente (positive Z)
    "path/nz.png", // Atrás (negative Z)
  ];

  cubeTextureLoader.load(cubeMapUrls, (cubeTexture) => {
    cubeTexture.mapping = THREE.CubeReflectionMapping;
    console.log(cubeTexture);
    scene.environment = cubeTexture;
  });
}

// Usar RAF cancelable y deltaTime para animación constante
const clock = new THREE.Clock();
let lastTime = 0;
let rafId;
let isRunning = true;

// Manejar visibilidad de página para pausar cuando no está visible
document.addEventListener(
  "visibilitychange",
  () => {
    if (document.visibilityState === "hidden") {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      clock.stop();
    } else {
      isRunning = true;
      clock.start();
      if (!rafId) {
        lastTime = performance.now();
        tick();
      }
    }
  },
  { passive: true }
);

// Función de animación
const tick = () => {
  if (!isRunning) return;

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Rotar el objeto
  wobble.rotation.y += deltaTime * 0.5;

  // Actualizar uniforms (tiempo de reloj para efectos de shader)
  uniforms.uTime.value = clock.getElapsedTime();

  // Render
  renderer.render(scene, camera);

  // Programar siguiente frame
  rafId = requestAnimationFrame(tick);
};

// Inicialización en dos fases
function init() {
  // Fase 1: Iniciar animación inmediatamente
  lastTime = performance.now();
  tick();

  // Fase 2: Cargar recursos secundarios después del primer render
  setTimeout(() => {
    loadEnvironmentAsync();
  }, 100);
}

// Iniciar aplicación
init();
