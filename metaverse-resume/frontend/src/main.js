import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { gsap } from 'gsap';
import { Environment } from './Environment.js';
import { AIManager } from './AI.js';

const uiLayer = document.getElementById('ui-layer');
const instructions = document.getElementById('instructions');
const impactPanel = document.getElementById('impact-panel');
const crosshair = document.getElementById('crosshair');
const recruiterModeBtn = document.getElementById('btn-recruiter-mode');

let camera, scene, renderer, controls;
let environment, aiManager;
let raycaster, mouse;
let lastTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isRecruiterMode = false;

init();
animate();

function init() {
  // 1. Scene Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020205);
  scene.fog = new THREE.FogExp2(0x020205, 0.02);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 25); // Start at Entry Zone

  // 2. Renderer Setup
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // 3. Environment & Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  environment = new Environment(scene);

  // 4. AI & UI Manager
  aiManager = new AIManager();

  // 5. Controls
  controls = new PointerLockControls(camera, document.body);
  
  instructions.addEventListener('click', () => {
    if(!isRecruiterMode) controls.lock();
  });
  
  controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
    uiLayer.style.pointerEvents = 'none'; // Need pointer lock for 3D
  });
  
  controls.addEventListener('unlock', () => {
    if(!isRecruiterMode) {
      instructions.style.display = 'block';
      uiLayer.style.pointerEvents = 'auto';
    }
  });

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  // 6. Raycasting
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2(0, 0); // Center of screen for pointer lock
  window.addEventListener('mousedown', onMouseClick);
  
  // 7. Recruiter Mode Trigger
  recruiterModeBtn.addEventListener('click', startRecruiterMode);
  
  window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
  if(isRecruiterMode) return;
  switch (event.code) {
    case 'ArrowUp': case 'KeyW': moveForward = true; break;
    case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
    case 'ArrowDown': case 'KeyS': moveBackward = true; break;
    case 'ArrowRight': case 'KeyD': moveRight = true; break;
  }
}

function onKeyUp(event) {
  if(isRecruiterMode) return;
  switch (event.code) {
    case 'ArrowUp': case 'KeyW': moveForward = false; break;
    case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
    case 'ArrowDown': case 'KeyS': moveBackward = false; break;
    case 'ArrowRight': case 'KeyD': moveRight = false; break;
  }
}

function onMouseClick() {
  if(controls.isLocked && !isRecruiterMode) {
    // Check intersections
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(environment.interactiveObjects);
    
    if(intersects.length > 0) {
      const obj = intersects[0].object;
      handleInteraction(obj);
    }
  }
}

function handleInteraction(object) {
  crosshair.classList.add('active');
  setTimeout(() => crosshair.classList.remove('active'), 200);

  const data = object.userData;
  
  if(data.type === 'project') {
    impactPanel.classList.add('visible');
    aiManager.handleSend(`Tell me more about your project: ${data.name}. What was the impact?`);
  } else if(data.type === 'ai-core') {
    aiManager.handleSend("Tell me about your AI Engineering architecture and the 'Creator AI' persona.");
  } else if(data.type === 'contact') {
    aiManager.handleSend("I'm impressed by the tour. How can I contact you for a potential role?");
  }
}

function startRecruiterMode() {
  isRecruiterMode = true;
  instructions.style.display = 'none';
  controls.unlock();
  
  uiLayer.style.pointerEvents = 'auto'; 
  
  // 1. Start at Entry
  aiManager.handleSend("Welcome to the Metaverse Resume. I am ready for the tour.");
  
  // 2. Cinematic Auto-Tour Timeline
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  
  tl.to(camera.position, { duration: 4, x: 0, y: 3, z: 8 }) // Move from Entry to AI Room entrance
    .to(camera.rotation, { duration: 4, x: 0, y: 0, z: 0 }, "<")
    .to(camera.position, { duration: 3, x: 0, y: 4, z: 5, onComplete: () => {
        aiManager.handleSend("Tell me about your AI persona and how you help recruiters.");
    } }) // Approach AI Orb
    .to(camera.rotation, { duration: 3, x: -0.2 }, "<")
    .to(camera.position, { duration: 5, x: -15, y: 3, z: -5, delay: 6, onComplete: () => {
        aiManager.handleSend("Show me your most impactful projects.");
    } }) // Move to Projects Room
    .to(camera.rotation, { duration: 5, y: -0.8 }, "<")
    .to(camera.position, { duration: 5, x: 15, y: 4, z: -5, delay: 6, onComplete: () => {
        aiManager.handleSend("The experience is great. How can we get in touch?");
    } }) // Move to Contact Zone
    .to(camera.rotation, { duration: 5, y: 0.8 }, "<")
    .to(camera.position, { duration: 4, x: 0, y: 2, z: 15, delay: 4, onComplete: () => {
        isRecruiterMode = false;
        aiManager.handleSend("The tour is complete. I am ready to connect.");
    }}); // Return to a neutral position
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  
  if (controls.isLocked && !isRecruiterMode) {
    const delta = (time - lastTime) / 1000;
    
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  // Update Environment (animations)
  environment.update(time / 1000);

  // Raycaster hover effect
  if(!isRecruiterMode) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(environment.interactiveObjects);
    if(intersects.length > 0) {
      crosshair.style.opacity = '1';
      crosshair.style.transform = 'scale(1.5)';
      crosshair.style.background = 'var(--neon-cyan)';
    } else {
      crosshair.style.opacity = '0.5';
      crosshair.style.transform = 'scale(1)';
      crosshair.style.background = 'white';
    }
  }

  renderer.render(scene, camera);
  lastTime = time;
}
