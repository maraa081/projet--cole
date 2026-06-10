// ─── 3D Vending Machine Interactive ──────────────────────

const container = document.getElementById('three-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0eeff);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(6, 3, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 1.3;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;
controls.update();

// ─── Lights ─────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x8888bb, 0.6);
scene.add(ambient);
const main = new THREE.DirectionalLight(0xffffff, 1.2);
main.position.set(8, 12, 8);
main.castShadow = true;
scene.add(main);
const fill = new THREE.DirectionalLight(0x4466ff, 0.3);
fill.position.set(-4, 3, -4);
scene.add(fill);

// ─── Ground ─────────────────────────────────────────────────
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0xe8e6f5, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(20, 20, 0x6c5ce7, 0xddd6f3);
grid.position.y = 0;
scene.add(grid);

// ─── Machine parts (non-interactive) ────────────────────────
const machine = new THREE.Group();

function addBox(w, h, d, color, x, y, z, metalness = 0.3, roughness = 0.5) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, metalness, roughness })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    machine.add(m);
    return m;
}

// Body walls (open front to see products through glass)
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, metalness: 0.5, roughness: 0.3 });

// Back wall (visible through front opening)
const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.6, 0.06), wallMat);
back.position.set(0, 2.4, -0.95);
machine.add(back);

// Left wall
const left = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.6, 1.8), wallMat);
left.position.set(-1.6, 2.4, 0);
machine.add(left);

// Right wall
const right = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.6, 1.8), wallMat);
right.position.set(1.6, 2.4, 0);
machine.add(right);

// Top
const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 1.8), wallMat);
top.position.set(0, 4.7, 0);
machine.add(top);

// Bottom
const bottom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 1.8), wallMat);
bottom.position.set(0, 0.05, 0);
machine.add(bottom);
// Frame
const frame = addBox(3.1, 4.0, 0.06, 0x6c5ce7, 0, 2.4, 1.0, 0.6, 0.2);
frame.material.emissive = new THREE.Color(0x6c5ce7);
frame.material.emissiveIntensity = 0.05;
// Glass
const glass = addBox(2.85, 3.7, 0.03, 0x88bbff, 0, 2.4, 1.02, 0, 0.05);
glass.material.transparent = true;
glass.material.opacity = 0.12;
glass.material.clearcoat = 1;
// Interior
addBox(2.75, 3.55, 0.02, 0x2a2a5a, 0, 2.4, 0.8, 0.2, 0.6);

// Shelves
const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3a3a6a, metalness: 0.4, roughness: 0.3 });
[3.4, 2.25, 1.1].forEach(y => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.04, 0.85), shelfMat);
    s.position.set(0, y, 0.45);
    machine.add(s);
});

// Top screen
const screen = addBox(1.8, 0.35, 0.03, 0x00cec9, 0, 4.35, 0.98, 0, 0.1);
screen.material.emissive = new THREE.Color(0x00cec9);
screen.material.emissiveIntensity = 0.2;

// Sign
const sign = addBox(2.8, 0.18, 0.35, 0x6c5ce7, 0, 4.7, 0.95, 0.6, 0.15);
sign.material.emissive = new THREE.Color(0x6c5ce7);
sign.material.emissiveIntensity = 0.08;

// LED strips
[4.2, 0.65].forEach(y => {
    const led = addBox(3.0, 0.04, 0.04, 0x6c5ce7, 0, y, 0.95, 0.3, 0.1);
    led.material.emissive = new THREE.Color(0x6c5ce7);
    led.material.emissiveIntensity = 0.4;
});

// Bottom panel
addBox(2.6, 0.4, 0.25, 0x222244, 0, 0.3, 0.95, 0.4, 0.3);

// Buttons
const btnMat = new THREE.MeshStandardMaterial({ color: 0x6c5ce7, emissive: 0x6c5ce7, emissiveIntensity: 0.15, metalness: 0.2, roughness: 0.3 });
for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), btnMat);
    btn.position.set(-0.8 + i * 0.4, 0.3, 1.07);
    machine.add(btn);
}

// Coin slot
const slot = addBox(0.3, 0.08, 0.05, 0x444466, 1.2, 0.3, 1.07, 0.8, 0.1);

scene.add(machine);

// ─── Interactive Products ─────────────────────────────────
const clickableProducts = [];
const productMeshes = [];
const shelfYs = [3.35, 2.2, 1.05];
const xPositions = [-1.0, -0.5, 0, 0.5, 1.0];
const tooltips = [];

// Tooltip HTML
const tooltipDiv = document.createElement('div');
tooltipDiv.style.cssText = `
    position: fixed; display: none; background: white; border-radius: 12px;
    padding: 1rem 1.25rem; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    font-family: Inter, sans-serif; z-index: 100; pointer-events: none;
    min-width: 180px; border: 1px solid #e5e7eb;
`;
document.body.appendChild(tooltipDiv);

async function loadProducts3D() {
    try {
        const res = await fetch('/ecole/api/produits');
        const produits = await res.json();

        const shapes = ['canette', 'bouteille', 'snack'];

        produits.forEach((p, idx) => {
            const shelfIdx = Math.floor(idx / 5) % 3;
            const posIdx = idx % 5;
            const y = shelfYs[shelfIdx];
            const x = xPositions[posIdx];
            const color = new THREE.Color(p.couleur || '#6c5ce7');

            let mesh;
            if (idx % 3 === 1) {
                // Bottle shape
                const g = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 12);
                const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.3 }));
                m.position.set(x, y + 0.18, 0.42);
                machine.add(m);
                mesh = m;
            } else if (idx % 3 === 2) {
                // Snack box shape
                const g = new THREE.BoxGeometry(0.14, 0.25, 0.10);
                const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 }));
                m.position.set(x, y + 0.13, 0.42);
                machine.add(m);
                mesh = m;
            } else {
                // Can shape
                const g = new THREE.CylinderGeometry(0.11, 0.12, 0.32, 16);
                const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 }));
                m.position.set(x, y + 0.16, 0.42);
                m.castShadow = true;
                machine.add(m);
                // Top
                const top = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.10, 0.11, 0.03, 16),
                    new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.7, roughness: 0.2 })
                );
                top.position.set(x, y + 0.33, 0.42);
                machine.add(top);
                mesh = m;
            }

            mesh.userData = { produit: p, index: idx };
            clickableProducts.push(mesh);
            productMeshes.push(mesh);

            // Small highlight on hover prep
            const hl = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.16, 0.005, 16),
                new THREE.MeshStandardMaterial({ color: 0x6c5ce7, transparent: true, opacity: 0, emissive: 0x6c5ce7, emissiveIntensity: 0 })
            );
            hl.position.set(x, y + 0.01, 0.42);
            machine.add(hl);
            mesh.userData.highlight = hl;
        });

        // Also update the products grid below
        updateProductsGrid(produits);
    } catch (e) {
        console.error('Error loading 3D products:', e);
    }
}

function updateProductsGrid(produits) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = produits.map(p => {
        const stockClass = p.quantite === 0 ? 'empty' : p.quantite < 5 ? 'low' : '';
        const stockText = p.quantite === 0 ? 'Rupture' : p.quantite < 5 ? `Plus que ${p.quantite}` : `${p.quantite} en stock`;
        const icon = p.type === 'canette' ? '🥫' : p.type === 'snack' ? '🍫' : '🧃';
        return `
            <div class="product-item" data-id="${p.id}">
                <div class="product-can" style="background:${p.couleur || '#6c5ce7'}">${icon}</div>
                <h3>${p.nom}</h3>
                <div class="price">${p.prix.toFixed(2)}€</div>
                <div class="stock ${stockClass}">${stockText}</div>
            </div>
        `;
    }).join('');
}

// ─── Raycaster (Click) ──────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPointerDown = false;
let pointerMoved = false;
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    pointerMoved = false;
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
});

renderer.domElement.addEventListener('pointermove', (e) => {
    if (isPointerDown && (Math.abs(e.clientX - pointerDownPos.x) > 5 || Math.abs(e.clientY - pointerDownPos.y) > 5)) {
        pointerMoved = true;
    }

    // Hover highlight
    mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableProducts);

    clickableProducts.forEach(p => {
        if (p.userData.highlight) {
            p.userData.highlight.material.opacity = 0;
            p.userData.highlight.material.emissiveIntensity = 0;
        }
    });

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.highlight) {
            hit.userData.highlight.material.opacity = 0.3;
            hit.userData.highlight.material.emissiveIntensity = 0.15;
        }
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'default';
    }
});

renderer.domElement.addEventListener('pointerup', (e) => {
    if (pointerMoved) return;

    mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableProducts);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const p = hit.userData.produit;
        if (p) showProductTooltip(e.clientX, e.clientY, p);
    } else {
        hideTooltip();
    }

    isPointerDown = false;
});

function showProductTooltip(x, y, p) {
    const stockStatus = p.quantite === 0 ? 'Rupture' : p.quantite < 5 ? 'Stock faible' : 'En stock';
    const stockColor = p.quantite === 0 ? '#ff6b6b' : p.quantite < 5 ? '#fdcb6e' : '#00b894';
    tooltipDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <span style="width:12px;height:12px;border-radius:50%;background:${p.couleur || '#6c5ce7'};display:inline-block"></span>
            <strong style="font-size:1.1rem">${p.nom}</strong>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem">
            <div>
                <div style="color:#6b7280;font-size:0.75rem">Type</div>
                <div>${p.type}</div>
            </div>
            <div>
                <div style="color:#6b7280;font-size:0.75rem">Prix</div>
                <div><strong>${p.prix.toFixed(2)}€</strong></div>
            </div>
            <div style="grid-column:1/-1">
                <div style="color:#6b7280;font-size:0.75rem">Stock</div>
                <div style="color:${stockColor};font-weight:600">${p.quantite} unites — ${stockStatus}</div>
            </div>
        </div>
    `;

    // Position tooltip near cursor but keep on screen
    let tx = x + 15;
    let ty = y + 15;
    if (tx + 200 > window.innerWidth) tx = x - 200;
    if (ty + 150 > window.innerHeight) ty = y - 150;
    tooltipDiv.style.left = tx + 'px';
    tooltipDiv.style.top = ty + 'px';
    tooltipDiv.style.display = 'block';
}

function hideTooltip() {
    tooltipDiv.style.display = 'none';
}

// Hide tooltip on scroll
window.addEventListener('scroll', hideTooltip);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTooltip(); });

// ─── Particles ──────────────────────────────────────────────
const pCount = 100;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 16;
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0x6c5ce7, size: 0.025, transparent: true, opacity: 0.3 });
const particles = new THREE.Points(pGeo, pMat);
particles.position.y = 4;
scene.add(particles);

// ─── Animation ──────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Pulse LEDs
    const pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.003);
    machine.children.forEach(c => {
        if (c.material && c.material.emissive && c.material.color.getHex() === 0x6c5ce7) {
            c.material.emissiveIntensity = pulse * (c.geometry.parameters ? 1 : 1);
        }
    });

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

renderer.domElement.addEventListener('mousedown', () => { controls.autoRotate = false; });
renderer.domElement.addEventListener('mouseup', () => { setTimeout(() => { controls.autoRotate = true; }, 4000); });

// ─── Init 3D products ──────────────────────────────────────
loadProducts3D();
