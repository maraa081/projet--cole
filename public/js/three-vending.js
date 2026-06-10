// ─── 3D Vending Machine ──────────────────────────────────────
// Three.js interactive model

const container = document.getElementById('three-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(6, 3, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 1.3;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.update();

// ─── Lights ─────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x404080, 0.5);
scene.add(ambient);

const mainLight = new THREE.DirectionalLight(0xffeedd, 1.5);
mainLight.position.set(10, 15, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x6c5ce7, 0.4);
rimLight.position.set(0, 5, -8);
scene.add(rimLight);

// Ground glow
const groundGlow = new THREE.PointLight(0x6c5ce7, 0.3, 10);
groundGlow.position.set(0, 0.1, 0);
scene.add(groundGlow);

// ─── Ground ─────────────────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x12122a,
    roughness: 0.8,
    metalness: 0.2,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// Grid helper for style
const gridHelper = new THREE.GridHelper(20, 20, 0x6c5ce7, 0x1a1a3a);
gridHelper.position.y = 0;
scene.add(gridHelper);

// ─── Build Vending Machine ──────────────────────────────────

function createVendingMachine() {
    const group = new THREE.Group();
    const bodyColor = 0x1a1a3a;
    const accentColor = 0x6c5ce7;
    const glassColor = 0x4488ff;

    // Main body
    const bodyGeo = new THREE.BoxGeometry(3.2, 4.5, 1.8);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.3,
        metalness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.25;
    body.castShadow = true;
    group.add(body);

    // Front frame (accent border)
    const frameMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.2,
        metalness: 0.8,
        emissive: accentColor,
        emissiveIntensity: 0.05,
    });

    const frameGeo = new THREE.BoxGeometry(2.95, 3.8, 0.05);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.3, 0.9);
    group.add(frame);

    // Glass panel (transparent)
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88bbff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        envMapIntensity: 0.5,
    });
    const glassGeo = new THREE.BoxGeometry(2.7, 3.5, 0.03);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 2.3, 0.92);
    group.add(glass);

    // Interior back wall (glowing)
    const interiorMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a5a,
        roughness: 0.5,
        metalness: 0.3,
    });
    const interiorGeo = new THREE.BoxGeometry(2.6, 3.4, 0.02);
    const interior = new THREE.Mesh(interiorGeo, interiorMat);
    interior.position.set(0, 2.3, 0.75);
    group.add(interior);

    // LED strip top
    const ledMat = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        emissive: 0x6c5ce7,
        emissiveIntensity: 0.5,
    });
    const ledGeo = new THREE.BoxGeometry(2.9, 0.05, 0.05);
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 4.05, 0.9);
    group.add(led);

    // Bottom LED
    const ledBottom = new THREE.Mesh(ledGeo.clone(), ledMat);
    ledBottom.position.set(0, 0.55, 0.9);
    group.add(ledBottom);

    // Shelves (3 rows)
    const shelfMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        roughness: 0.2,
        metalness: 0.6,
    });
    const shelfPositions = [3.3, 2.2, 1.1];
    const productsMatrix = [];

    shelfPositions.forEach((yPos, shelfIndex) => {
        const shelfGeo = new THREE.BoxGeometry(2.5, 0.05, 0.9);
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(0, yPos, 0.4);
        group.add(shelf);

        // Products on shelf (5 columns)
        const rowProducts = [];
        for (let i = 0; i < 5; i++) {
            const xPos = -1.0 + i * 0.5;
            const productColor = new THREE.Color().setHSL((shelfIndex * 0.33 + i * 0.1) % 1, 0.8, 0.5);

            // Can body
            const canMat = new THREE.MeshStandardMaterial({
                color: productColor,
                roughness: 0.3,
                metalness: 0.5,
            });
            const canGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.3, 16);
            const can = new THREE.Mesh(canGeo, canMat);
            can.position.set(xPos, yPos + 0.18, 0.4);
            can.castShadow = true;
            group.add(can);

            // Can top
            const topMat = new THREE.MeshStandardMaterial({
                color: 0x444466,
                roughness: 0.2,
                metalness: 0.8,
            });
            const topGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.03, 16);
            const top = new THREE.Mesh(topGeo, topMat);
            top.position.set(xPos, yPos + 0.33, 0.4);
            group.add(top);

            rowProducts.push({ x: xPos, y: yPos + 0.18, z: 0.4, color: productColor });
        }
        productsMatrix.push(rowProducts);
    });

    // Selection panel (front bottom)
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x222244,
        roughness: 0.3,
        metalness: 0.5,
    });
    const panelGeo = new THREE.BoxGeometry(2.5, 0.4, 0.2);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0.3, 0.95);
    group.add(panel);

    // Selection buttons
    const btnMat = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        emissive: 0x6c5ce7,
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.3,
    });

    for (let i = 0; i < 5; i++) {
        const btnGeo = new THREE.CircleGeometry(0.08, 16);
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(-0.8 + i * 0.4, 0.3, 1.06);
        group.add(btn);

        // Button label (using small box as placeholder)
        const labelMat = new THREE.MeshStandardMaterial({
            color: 0x8888bb,
            emissive: 0x4444aa,
            emissiveIntensity: 0.1,
        });
        const labelGeo = new THREE.BoxGeometry(0.15, 0.03, 0.01);
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(-0.8 + i * 0.4, 0.23, 1.06);
        group.add(label);
    }

    // Coin slot
    const slotMat = new THREE.MeshStandardMaterial({
        color: 0x333355,
        roughness: 0.2,
        metalness: 0.9,
    });
    const slotGeo = new THREE.BoxGeometry(0.3, 0.08, 0.05);
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(1.1, 0.3, 1.06);
    group.add(slot);

    // Top display screen
    const screenMat = new THREE.MeshStandardMaterial({
        color: 0x00cec9,
        emissive: 0x00cec9,
        emissiveIntensity: 0.3,
    });
    const screenGeo = new THREE.BoxGeometry(1.5, 0.3, 0.02);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 4.2, 0.92);
    group.add(screen);

    // Top sign
    const signMat = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        emissive: 0x6c5ce7,
        emissiveIntensity: 0.1,
        roughness: 0.1,
        metalness: 0.8,
    });
    const signGeo = new THREE.BoxGeometry(2.5, 0.15, 0.3);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 4.55, 0.9);
    group.add(sign);

    return group;
}

const machine = createVendingMachine();
scene.add(machine);

// ─── Particles ──────────────────────────────────────────────
const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({
    color: 0x6c5ce7,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
});
const particles = new THREE.Points(particleGeo, particleMat);
particles.position.y = 5;
scene.add(particles);

// ─── Products from API ──────────────────────────────────────
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    try {
        const res = await fetch('/api/produits');
        const produits = await res.json();

        grid.innerHTML = produits.map(p => {
            const stockClass = p.quantite === 0 ? 'empty' : p.quantite < 5 ? 'low' : '';
            const stockText = p.quantite === 0 ? 'Rupture' : p.quantite < 5 ? `Plus que ${p.quantite}` : `${p.quantite} en stock`;
            const icone = p.type === 'canette' ? '🥫' : p.type === 'snack' ? '🍫' : '🧃';

            return `
                <div class="product-item" data-id="${p.id}">
                    <div class="product-can" style="background:${p.couleur || '#6c5ce7'}">
                        ${icone}
                    </div>
                    <h3>${p.nom}</h3>
                    <div class="price">${p.prix.toFixed(2)}€</div>
                    <div class="stock ${stockClass}">${stockText}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        grid.innerHTML = '<p style="color:var(--text-secondary)">Erreur de chargement des produits</p>';
    }
}

loadProducts();

// ─── Animation ──────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Pulse LEDs
    const pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.002);
    machine.children.forEach(child => {
        if (child.material && child.material.emissive) {
            if (child.material.color.getHex() === 0x6c5ce7) {
                child.material.emissiveIntensity = pulse;
            }
        }
    });

    // Rotate particles
    particles.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

animate();

// ─── Resize ─────────────────────────────────────────────────
window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

// User interaction stops auto-rotate
renderer.domElement.addEventListener('mousedown', () => {
    controls.autoRotate = false;
});
renderer.domElement.addEventListener('mouseup', () => {
    setTimeout(() => { controls.autoRotate = true; }, 3000);
});

// ─── Toast helper ───────────────────────────────────────────
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
