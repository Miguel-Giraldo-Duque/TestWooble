import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import GIF from "gif.js";
/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 });

gui.close();
gui.hide();

const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load("./urban_alley_01_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  let skyBoxGround = new EXRLoader(environmentMap, 15, 70);

  scene.add(skyBoxGround);

  scene.environment = environmentMap;
});

/**
 * Wobble
 */

scene.background = new THREE.Color("#ffff");

// Material
debugObject.colorA = "#22dfe2";
debugObject.colorB = "#e9dddd";

const uniforms = {
  uTime: new THREE.Uniform(0),
  uFrequencySong: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(0.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(0.3),
  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),
  uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
  uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),
};

const material = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms: uniforms,
  silent: true,

  // MeshPhysicalMaterial
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
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  uniforms: uniforms,
  silent: true,

  // MeshDepthMaterial
  depthPacking: THREE.RGBADepthPacking,
});

// Tweaks
gui
  .add(uniforms.uPositionFrequency, "value", 0, 2, 0.001)
  .name("uPositionFrequency");
gui.add(uniforms.uTimeFrequency, "value", 0, 2, 0.001).name("uTimeFrequency");
gui.add(uniforms.uStrength, "value", 0, 2, 0.001).name("uStrength");
gui
  .add(uniforms.uWarpPositionFrequency, "value", 0, 2, 0.001)
  .name("uWarpPositionFrequency");
gui
  .add(uniforms.uWarpTimeFrequency, "value", 0, 2, 0.001)
  .name("uWarpTimeFrequency");
gui.add(uniforms.uWarpStrength, "value", 0, 2, 0.001).name("uWarpStrength");
gui
  .addColor(debugObject, "colorA")
  .onChange(() => uniforms.uColorA.value.set(debugObject.colorA));
gui
  .addColor(debugObject, "colorB")
  .onChange(() => uniforms.uColorB.value.set(debugObject.colorB));
gui.add(material, "metalness", 0, 1, 0.001);
gui.add(material, "roughness", 0, 1, 0.001);
gui.add(material, "transmission", 0, 1, 0.001);
gui.add(material, "ior", 0, 10, 0.001);
gui.add(material, "thickness", 0, 10, 0.001);

// Geometry
let geometry = new THREE.IcosahedronGeometry(2.5, 50);
console.log(geometry.attributes);
geometry = mergeVertices(geometry);
console.log(geometry.index);
geometry.computeTangents();

// Mesh
const wobble = new THREE.Mesh(geometry, material);

wobble.customDepthMaterial = depthMaterial;
wobble.receiveShadow = true;
wobble.castShadow = true;
scene.add(wobble);

// gltfLoader.load('./suzanne.glb', (gltf) =>
// {
//     const wobble = gltf.scene.children[0]
//     wobble.receiveShadow = true
//     wobble.castShadow = true
//     wobble.material = material
//     wobble.customDepthMaterial = depthMaterial

//     scene.add(wobble)
// })

/**
 * Plane
 */
// const plane = new THREE.Mesh(
//     new THREE.PlaneGeometry(15, 15, 15),
//     new THREE.MeshStandardMaterial()
// )
// plane.receiveShadow = true
// plane.rotation.y = Math.PI
// plane.position.y = - 5
// plane.position.z = 5
// scene.add(plane)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

// window.addEventListener("click", (e) => {
//   toggleFullScreen();
// });

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
/**
 * Camera
 */
// Base camera
const Group = new THREE.Group();

scene.add(Group);
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
if (window.innerWidth < 500) {
  camera.position.set(13, -30, -5);
  camera.updateProjectionMatrix();
} else {
  camera.position.set(13, -10, -5);
  camera.updateProjectionMatrix();
}
camera.position.z = 6;
Group.add(camera);

// scene.add(camera);

//song

const listener = new THREE.AudioListener();

camera.add(listener);

const song = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();

const analyser = new THREE.AudioAnalyser(song, 32);

// audioLoader.load("/Måneskin - CORALINE (Lyrics_Testo).mp4", (buffer) => {
//   song.setBuffer(buffer);
//   window.addEventListener("click", () => {
//     song.play();
//   });
// });

// Función para actualizar la posición de la cámara
const updateCameraPosition = () => {
  if (window.innerWidth < 500) {
    camera.position.set(13, -25, -5);
  } else {
    camera.position.set(13, -20, -5);
  }
  camera.updateProjectionMatrix(); // Asegúrate de actualizar la matriz de proyección si se cambia la posición o aspecto
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  updateCameraPosition();
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  // alpha: true,
  // preserveDrawingBuffer: true, // Añade esta línea
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();
// Función para capturar imagen transparente
function captureTransparentImage() {
  // Asegúrate de que no hay nada en el fondo
  // scene.background = null;

  // Renderiza la escena
  renderer.render(scene, camera);

  // Obtén los datos de imagen con alfa
  const imageData = canvas.toDataURL("image/png");

  // Crea un enlace para descargar
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "wobble-transparent.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Restaura el entorno si es necesario para la visualización normal
  // scene.environment = environmentMap; (si necesitas restaurarlo)
}

// Función para grabar video transparente
// Función para grabar video con el fondo incluido
function captureTransparentVideo(duration = 9000) {
  // Asegúrate de que el environmentMap esté activo
  if (!scene.environment) {
    rgbeLoader.load("./urban_alley_01_1k.hdr", (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = environmentMap;
    });
  }

  // Configura el renderer para preservar el fondo
  // Fondo negro con alfa 0 (transparente si no hay environment)
  renderer.render(scene, camera); // Renderiza la escena una vez para asegurar que todo esté listo

  // Captura el stream del canvas
  const stream = canvas.captureStream(30); // 30 FPS
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9", // Soporta transparencia en teoría con vp9
  });

  const chunks = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wobble-animation-with-background.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Libera memoria
  };

  console.log("Comenzando grabación con fondo...");
  mediaRecorder.start();

  // Detener la grabación después del tiempo especificado
  setTimeout(() => {
    mediaRecorder.stop();
    console.log("Grabación finalizada");
  }, duration);
}
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);
// // Función para capturar GIF
// function captureGif(duration = 4000) {
//   console.log("1. Iniciando captureGif con duración:", duration);

//   const gif = new GIF({
//     workers: 2,
//     quality: 10,
//     workerScript: "./assets/gif.worker.js", // Ruta corregida
//   });
//   console.log("2. Objeto GIF creado:", gif);
//   gif.on("start", () => console.log("GIF worker iniciado"));
//   gif.on("error", (e) => console.error("Error en worker:", e));
//   const frameRate = 60;
//   const frameTime = 1000 / frameRate;
//   const totalFrames = Math.floor(duration / frameTime);
//   let currentFrame = 0;
//   // console.log(
//   //   "3. Configuración: frameRate:",
//   //   frameRate,
//   //   "totalFrames:",
//   //   totalFrames
//   // );

//   function captureFrame() {
//     // console.log("4. Capturando frame número:", currentFrame);

//     if (currentFrame >= totalFrames) {
//       console.log("5. Todos los frames capturados, iniciando render...");
//       gif.render();
//       return;
//     }

//     renderer.render(scene, camera);
//     console.log("6. Escena renderizada para frame", currentFrame);

//     gif.addFrame(renderer.domElement, { delay: frameTime, copy: true });
//     console.log("7. Frame", currentFrame, "agregado al GIF");

//     currentFrame++;
//     requestAnimationFrame(captureFrame);
//   }

//   gif.on("finished", (blob) => {
//     console.log("8. GIF finalizado, blob recibido:", blob);
//     const url = URL.createObjectURL(blob);
//     console.log("9. URL del GIF creada:", url);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "animation.gif";
//     document.body.appendChild(a);
//     // a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//     console.log("10. GIF descargado exitosamente");
//   });

//   console.log("11. Iniciando captura de frames...");
//   captureFrame();
// }
// Añadir eventos para capturar
window.addEventListener("keydown", (event) => {
  if (event.key === "c" || event.key === "C") {
    captureTransparentImage();
    console.log("Imagen capturada");
  }
});

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  wobble.rotation.y = elapsedTime * 0.5;

  // Materials
  uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
