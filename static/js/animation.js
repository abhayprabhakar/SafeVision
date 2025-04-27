// Initialize Three.js scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

// Get the container element
const container = document.querySelector('.hero');
if (!container) {
    console.error('Could not find .hero container');
    throw new Error('Container element not found');
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Transparent background
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Initialize post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // Bloom strength
    0.4,  // Bloom radius
    0.85  // Bloom threshold
);
composer.addPass(bloomPass);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

const lights = [];
const lightColors = [0x4444ff, 0x44ff44, 0xff4444];
lightColors.forEach((color, i) => {
    const light = new THREE.PointLight(color, 1, 50);
    light.position.set(
        Math.sin(Math.PI * 2 * i / 3) * 15,
        Math.cos(Math.PI * 2 * i / 3) * 15,
        0
    );
    lights.push(light);
    scene.add(light);
});

// Neural network node class
class NeuralNode {
    constructor(position) {
        this.position = position;
        this.connections = [];
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );
        this.activationLevel = Math.random();
        this.targetActivation = Math.random();
    }

    update() {
        // Update position with velocity
        this.position.add(this.velocity);

        // Bounce off boundaries
        const bound = 15;
        ['x', 'y', 'z'].forEach(axis => {
            if (Math.abs(this.position[axis]) > bound) {
                this.position[axis] = Math.sign(this.position[axis]) * bound;
                this.velocity[axis] *= -1;
            }
        });

        // Smooth activation level changes
        this.activationLevel += (this.targetActivation - this.activationLevel) * 0.05;
        if (Math.random() < 0.02) {
            this.targetActivation = Math.random();
        }
    }
}

// Create neural network
const nodeCount = 200;
const nodes = [];
const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const nodeMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    emissive: 0x2244ff,
    shininess: 100
});

for (let i = 0; i < nodeCount; i++) {
    const position = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
    );
    nodes.push(new NeuralNode(position));
}

// Create node meshes
const nodeMeshes = nodes.map(node => {
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    mesh.position.copy(node.position);
    scene.add(mesh);
    return mesh;
});

// Create connections with distance threshold
const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.5
});

const maxDistance = 8; // Maximum distance for connections
const maxConnectionsPerNode = 3; // Maximum number of connections per node

nodes.forEach((node, i) => {
    // Calculate distances to all other nodes
    const distances = nodes.map((other, j) => ({
        distance: node.position.distanceTo(other.position),
        index: j
    })).filter(d => d.index !== i && d.distance <= maxDistance);
    
    // Sort by distance and take only the closest ones
    distances.sort((a, b) => a.distance - b.distance);
    const nearestNeighbors = distances.slice(0, maxConnectionsPerNode);
    
    // Create connections to nearest neighbors
    nearestNeighbors.forEach(neighbor => {
        if (!node.connections.includes(neighbor.index)) {
            node.connections.push(neighbor.index);
        }
    });
});

// Create connection lines
const connectionGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(nodes.length * maxConnectionsPerNode * 6);
connectionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
scene.add(connections);

// Add BokehPass (Depth of Field)
const bokehPass = new THREE.BokehPass(scene, camera, {
    focus: 1.0,
    aperture: 0.0001,
    maxblur: 1.0,
    width: window.innerWidth,
    height: window.innerHeight
});
composer.addPass(bokehPass);

// Camera setup
camera.position.z = 20;

// Mouse interaction
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();

// Use container for mouse coordinates calculation
container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Update nodes
    nodes.forEach((node, i) => {
        node.update();
        nodeMeshes[i].position.copy(node.position);
        
        // Update node appearance based on activation
        nodeMeshes[i].material.emissiveIntensity = node.activationLevel;
        nodeMeshes[i].scale.setScalar(0.8 + node.activationLevel * 0.4);
    });

    // Update connections dynamically based on current positions
    nodes.forEach((node, i) => {
        // Clear existing connections
        node.connections = [];
        
        // Calculate current distances to all other nodes
        const distances = nodes.map((other, j) => ({
            distance: node.position.distanceTo(other.position),
            index: j
        })).filter(d => d.index !== i && d.distance <= maxDistance);
        
        // Update connections to nearest neighbors
        distances.sort((a, b) => a.distance - b.distance);
        const nearestNeighbors = distances.slice(0, maxConnectionsPerNode);
        nearestNeighbors.forEach(neighbor => {
            if (!node.connections.includes(neighbor.index)) {
                node.connections.push(neighbor.index);
            }
        });
    });

    // Update connection positions
    const positions = connections.geometry.attributes.position.array;
    // First, clear all positions
    positions.fill(0);
    
    let index = 0;
    nodes.forEach((node, i) => {
        node.connections.forEach(connectionIndex => {
            positions[index++] = node.position.x;
            positions[index++] = node.position.y;
            positions[index++] = node.position.z;
            positions[index++] = nodes[connectionIndex].position.x;
            positions[index++] = nodes[connectionIndex].position.y;
            positions[index++] = nodes[connectionIndex].position.z;
        });
    });
    connections.geometry.attributes.position.needsUpdate = true;

    // Update lights
    lights.forEach((light, i) => {
        light.position.x = Math.sin(time + i * Math.PI * 2 / 3) * 15;
        light.position.z = Math.cos(time + i * Math.PI * 2 / 3) * 15;
    });

    // Smooth camera movement
    target.lerp(mouse, 0.05);
    camera.position.x = target.x * 5;
    camera.position.y = target.y * 5;
    camera.lookAt(scene.position);

    // Render with post-processing
    composer.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    composer.setSize(width, height);
});

// Start animation
animate();
