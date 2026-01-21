const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });

renderer.setSize(window.innerWidth, window.innerHeight);

// Sky
scene.background = new THREE.Color(0x87CEEB);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Plane
const plane = new THREE.Group();

// Fuselage
const fuselageGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
fuselage.rotation.z = Math.PI / 2;
plane.add(fuselage);

// Wings
const wingGeometry = new THREE.BoxGeometry(3, 0.05, 0.3);
const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const wings = new THREE.Mesh(wingGeometry, wingMaterial);
wings.position.y = 0.1;
plane.add(wings);

// Tail
const tailGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.05);
const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const tail = new THREE.Mesh(tailGeometry, tailMaterial);
tail.position.set(0, 0.3, -1.8);
plane.add(tail);

// Engine
const engineGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
const engine = new THREE.Mesh(engineGeometry, fuselageMaterial);
engine.position.z = 2;
plane.add(engine);

scene.add(plane);

// Position plane on runway
plane.position.set(0, 0.25, 400);

// Mountains
for (let i = 0; i < 5; i++) {
    const mountainGeometry = new THREE.ConeGeometry(50, 100, 8);
    const mountainMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(Math.random() * 1000 - 500, 50, Math.random() * 1000 - 500);
    scene.add(mountain);
}

// Houses
for (let i = 0; i < 10; i++) {
    const houseGeometry = new THREE.BoxGeometry(10, 10, 10);
    const houseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(Math.random() * 800 - 400, 5, Math.random() * 800 - 400);
    scene.add(house);
}

// Vegetation (Trees)
for (let i = 0; i < 20; i++) {
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 10);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(Math.random() * 600 - 300, 5, Math.random() * 600 - 300);
    
    const leavesGeometry = new THREE.SphereGeometry(5);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 10;
    
    trunk.add(leaves);
    scene.add(trunk);
}

// Water (Lake)
const waterGeometry = new THREE.PlaneGeometry(200, 200);
const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1, transparent: true, opacity: 0.7 });
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.set(300, 0.1, 300);
scene.add(water);

// Airport Runway
const runwayGeometry = new THREE.BoxGeometry(20, 0.5, 200);
const runwayMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
runway.position.set(0, 0.25, 400);
scene.add(runway);

// Airport Buildings
for (let i = 0; i < 3; i++) {
    const buildingGeometry = new THREE.BoxGeometry(15, 20, 15);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-50 + i * 50, 10, 350);
    scene.add(building);
}

// Camera position
camera.position.set(0, 2, 390);
camera.lookAt(plane.position);

// Controls
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

let throttle = 0;
const maxThrottle = 0.1;

let velocity = new THREE.Vector3(0, 0, 0);
const gravity = -0.0005;
const dragCoeff = 0.001;
const liftCoeff = 0.005;
const thrustPower = 0.005;

function animate() {
    requestAnimationFrame(animate);

    // Controls
    if (keys['KeyW']) plane.rotation.x -= 0.01; // Pitch up
    if (keys['KeyS']) plane.rotation.x += 0.01; // Pitch down
    if (keys['KeyA']) plane.rotation.y += 0.01; // Yaw left
    if (keys['KeyD']) plane.rotation.y -= 0.01; // Yaw right
    if (keys['KeyQ']) plane.rotation.z += 0.01; // Roll left
    if (keys['KeyE']) plane.rotation.z -= 0.01; // Roll right
    if (keys['Space']) throttle = Math.min(throttle + 0.001, maxThrottle);
    if (keys['ShiftLeft']) throttle = Math.max(throttle - 0.001, 0);

    // Physics
    // Gravity
    velocity.y += gravity;

    // Thrust
    if (throttle > 0) {
        const thrustDir = new THREE.Vector3(0, 0, -1);
        thrustDir.applyQuaternion(plane.quaternion);
        velocity.add(thrustDir.multiplyScalar(thrustPower * throttle));
    }

    // Drag
    velocity.multiplyScalar(1 - dragCoeff);

    // Lift
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(plane.quaternion);
    const forwardSpeed = velocity.dot(forward);
    if (forwardSpeed > 0) {
        const lift = new THREE.Vector3(0, liftCoeff * forwardSpeed * forwardSpeed, 0);
        velocity.add(lift);
    }

    // Update position
    plane.position.add(velocity);

    // Ground collision
    if (plane.position.y < 0.25) {
        plane.position.y = 0.25;
        velocity.y = 0;
    }

    // Camera follow
    const offset = new THREE.Vector3(0, 2, 10);
    offset.applyQuaternion(plane.quaternion);
    camera.position.copy(plane.position).add(offset);
    camera.lookAt(plane.position);

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});