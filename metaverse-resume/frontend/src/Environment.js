import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = [];
    this.buildWorld();
  }

  // Helper to create glowing neon materials
  createNeonMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 2,
      roughness: 0.1,
      metalness: 0.8
    });
  }

  buildWorld() {
    // 1. Core Platform (Main Hub) - Glassmorphism Floor
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid Helper for Cyber/Sci-fi feel
    const grid = new THREE.GridHelper(200, 100, 0x00ffff, 0x001122);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // 2. Thematic Zones
    this.createEntryZone();
    this.createAIRoom();
    this.createProjectsGallery();
    this.createContactZone();
    this.createGlowingPath();

    // 3. Ambient Particles
    this.createParticles();
  }

  createEntryZone() {
    // Starting marker
    const markerGeo = new THREE.RingGeometry(2, 2.2, 32);
    const markerMat = this.createNeonMaterial(0x00ffff);
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, 0.05, 20);
    this.scene.add(marker);

    // Entry lighting
    const entryLight = new THREE.PointLight(0x00ffff, 2, 10);
    entryLight.position.set(0, 2, 20);
    this.scene.add(entryLight);
  }

  createAIRoom() {
    // AI Avatar / Glowing Orb
    const orbGeo = new THREE.SphereGeometry(2, 64, 64);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8
    });
    this.aiOrb = new THREE.Mesh(orbGeo, orbMat);
    this.aiOrb.position.set(0, 4, 0);
    this.aiOrb.userData = { 
      type: 'ai-core', 
      description: "I am the AI representation of Kalyan. Ask me anything."
    };
    this.scene.add(this.aiOrb);
    this.interactiveObjects.push(this.aiOrb);

    // Circular floor light for AI Room
    const ringGeo = new THREE.TorusGeometry(8, 0.1, 16, 100);
    const ringMat = this.createNeonMaterial(0x00ffff);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.05, 0);
    this.scene.add(ring);
  }

  createProjectsGallery() {
    const projectPoints = [
      { name: "Murali Music", type: "laptop", pos: [-15, 0, -10], color: 0xff00ff },
      { name: "Ollama Migration", type: "screen", pos: [-25, 0, -10], color: 0x00ffff },
      { name: "Product Design", type: "cube", pos: [-20, 0, -20], color: 0xffff00 }
    ];

    projectPoints.forEach(p => {
      const group = new THREE.Group();
      group.position.set(...p.pos);
      
      // Pedestal
      const pedGeo = new THREE.CylinderGeometry(1.2, 1.5, 1, 32);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
      const pedestal = new THREE.Mesh(pedGeo, pedMat);
      pedestal.position.y = 0.5;
      group.add(pedestal);

      // Representative Object
      let obj;
      if (p.type === 'laptop') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), this.createNeonMaterial(p.color));
        const screen = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.1), this.createNeonMaterial(p.color));
        screen.position.set(0, 0.8, -0.7);
        screen.rotation.x = -0.2;
        group.add(base, screen);
        obj = screen;
      } else if (p.type === 'screen') {
        obj = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), this.createNeonMaterial(p.color));
        obj.position.y = 2;
        obj.rotation.y = Math.PI / 4;
        group.add(obj);
      } else {
        obj = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), this.createNeonMaterial(p.color));
        obj.position.y = 2;
        group.add(obj);
      }

      obj.userData = { type: 'project', name: p.name, triggerImpact: true };
      this.interactiveObjects.push(obj);
      this.scene.add(group);
      
      if (p.type === 'cube') this.projectCube = obj;
    });
  }

  createContactZone() {
    const monolithGeo = new THREE.BoxGeometry(4, 12, 4);
    const monolithMat = new THREE.MeshStandardMaterial({ color: 0x010101, metalness: 1, roughness: 0.1 });
    const monolith = new THREE.Mesh(monolithGeo, monolithMat);
    monolith.position.set(20, 6, -10);
    monolith.userData = { type: 'contact' };
    this.scene.add(monolith);
    this.interactiveObjects.push(monolith);

    // Glowing accents for monolith
    for (let i = 0; i < 3; i++) {
        const accent = new THREE.Mesh(new THREE.TorusGeometry(3, 0.05, 16, 100), this.createNeonMaterial(0xff00ff));
        accent.position.set(20, 4 + i * 3, -10);
        accent.rotation.x = Math.PI / 2;
        this.scene.add(accent);
    }
  }

  createGlowingPath() {
    const points = [
        new THREE.Vector3(0, 0.01, 20),
        new THREE.Vector3(0, 0.01, 0),
        new THREE.Vector3(-20, 0.01, -10),
        new THREE.Vector3(20, 0.01, -10)
    ];
    const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    this.scene.add(pathLine);
  }

  createParticles() {
    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i+=3) {
      positions[i] = (Math.random() - 0.5) * 200; // x
      positions[i+1] = Math.random() * 40; // y
      positions[i+2] = (Math.random() - 0.5) * 200; // z
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.4
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(time) {
    if(this.aiOrb) {
      this.aiOrb.rotation.y = time * 0.5;
      const scale = 1 + Math.sin(time * 2) * 0.05;
      this.aiOrb.scale.set(scale, scale, scale);
      this.aiOrb.position.y = 4 + Math.sin(time) * 0.2;
    }
    
    if(this.projectCube) {
      this.projectCube.rotation.x = time * 0.5;
      this.projectCube.rotation.y = time * 0.5;
    }

    if(this.particles) {
      this.particles.rotation.y = time * 0.01;
    }
  }
}
