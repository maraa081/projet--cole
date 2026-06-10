// ─── 3D Vending Machine (simplified) ──────────────────────

const container = document.getElementById('three-container');
const w = container.clientWidth;
const h = container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0eeff);

const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 50);
camera.position.set(5, 2.5, 7);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = 1.2;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0x8888bb, 0.5));
const dl = new THREE.DirectionalLight(0xffffff, 1);
dl.position.set(5, 10, 7);
dl.castShadow = true;
scene.add(dl);
scene.add(new THREE.DirectionalLight(0x4488ff, 0.3).position.set(-3, 3, -3));

// Ground
const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0xe8e6f5, roughness: 0.8 })
);
gnd.rotation.x = -Math.PI / 2;
gnd.position.y = -0.01;
gnd.receiveShadow = true;
scene.add(gnd);
scene.add(new THREE.GridHelper(20, 20, 0x6c5ce7, 0xddd6f3));

// Build vending machine - open front design
const mach = new THREE.Group();
const dark = 0x1a1a3a;
const accent = 0x6c5ce7;

// Back wall
const bwall = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 4.4, 0.05),
    new THREE.MeshStandardMaterial({ color: dark, metalness: 0.4, roughness: 0.3 })
);
bwall.position.set(0, 2.3, -0.9);
mach.add(bwall);

// Interior - lighter
const interior = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 4.0, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x2a2a5a, roughness: 0.5 })
);
interior.position.set(0, 2.3, -0.88);
mach.add(interior);

// Side walls (narrow strips at the edges)
for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 4.4, 1.7),
        new THREE.MeshStandardMaterial({ color: dark, metalness: 0.4, roughness: 0.3 })
    );
    sw.position.set(side * 1.5, 2.3, -0.05);
    mach.add(sw);
}

// Top & bottom panels
for (const y of [4.5, 0.1]) {
    const p = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.06, 1.7),
        new THREE.MeshStandardMaterial({ color: dark, metalness: 0.4, roughness: 0.3 })
    );
    p.position.set(0, y, -0.05);
    mach.add(p);
}

// Front frame (accent color - decorative border around the opening)
const frameMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.2, emissive: accent, emissiveIntensity: 0.05 });
const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.0, 0.04), frameMat);
frame.position.set(0, 2.3, 0.95);
mach.add(frame);

// Glass (transparent)
const glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 3.7, 0.02),
    new THREE.MeshPhysicalMaterial({ color: 0x88bbff, transparent: true, opacity: 0.12, roughness: 0, metalness: 0, clearcoat: 1 })
);
glass.position.set(0, 2.3, 0.96);
mach.add(glass);

// Shelves (3 rows - visible)
const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3a3a6a, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.8 });
[3.4, 2.2, 1.0].forEach(y => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 0.7), shelfMat);
    sh.position.set(0, y, 0.15);
    mach.add(sh);
});

// Top screen (display)
const scr = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.25, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x00cec9, emissive: 0x00cec9, emissiveIntensity: 0.2, roughness: 0.1 })
);
scr.position.set(0, 4.3, 0.93);
mach.add(scr);

// Sign on top
const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.12, 0.3),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.5, roughness: 0.2, emissive: accent, emissiveIntensity: 0.05 })
);
sign.position.set(0, 4.6, 0.92);
mach.add(sign);

// LED strips
[4.0, 0.5].forEach(y => {
    const led = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 })
    );
    led.position.set(0, y, 0.93);
    mach.add(led);
});

// Bottom panel with buttons
const bp = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.3, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x222244, metalness: 0.3, roughness: 0.4 })
);
bp.position.set(0, 0.25, 0.95);
mach.add(bp);

// Buttons
const btnMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.15 });
for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), btnMat);
    btn.position.set(-0.7 + i * 0.35, 0.25, 1.05);
    mach.add(btn);
}

scene.add(mach);

// ─── Products (clickable) ─────────────────────────────────
const clickables = [];
const tooltipDiv = document.createElement('div');
tooltipDiv.style.cssText = 'position:fixed;display:none;background:white;border-radius:12px;padding:1rem;box-shadow:0 10px 40px rgba(0,0,0,0.15);font-family:Inter,sans-serif;z-index:100;pointer-events:none;min-width:180px;border:1px solid #e5e7eb;';
document.body.appendChild(tooltipDiv);

async function loadProducts3D() {
    try {
        const res = await fetch('/ecole/api/produits');
        const produits = await res.json();
        const shelfYs = [3.35, 2.15, 0.95];
        const xPos = [-0.8, -0.4, 0, 0.4, 0.8];

        produits.forEach((p, idx) => {
            const si = Math.floor(idx / 5) % 3;
            const pi = idx % 5;
            const y = shelfYs[si];
            const x = xPos[pi];
            const col = new THREE.Color(p.couleur || '#6c5ce7');

            // Can body
            const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.3 });
            const can = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.28, 12), mat);
            can.position.set(x, y + 0.14, 0.18);
            can.castShadow = true;
            mach.add(can);

            // Can top
            const tmat = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.6, roughness: 0.2 });
            const top = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.02, 12), tmat);
            top.position.set(x, y + 0.29, 0.18);
            mach.add(top);

            // Store product data for click
            can.userData = { produit: p };
            clickables.push(can);
        });

        // Update grid below
        const grid = document.getElementById('products-grid');
        grid.innerHTML = produits.map(p => {
            const sc = p.quantite === 0 ? 'empty' : p.quantite < 5 ? 'low' : '';
            const st = p.quantite === 0 ? 'Rupture' : p.quantite < 5 ? `+ que ${p.quantite}` : `${p.quantite} en stock`;
            return `<div class="product-item" data-id="${p.id}">
                <div class="product-can" style="background:${p.couleur || '#6c5ce7'}"></div>
                <h3>${p.nom}</h3>
                <div class="price">${p.prix.toFixed(2)}€</div>
                <div class="stock ${sc}">${st}</div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('3D products error:', e);
    }
}

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let moved = false;
let downPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', e => {
    moved = false;
    downPos.x = e.clientX;
    downPos.y = e.clientY;
});
renderer.domElement.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - downPos.x) > 5 || Math.abs(e.clientY - downPos.y) > 5) moved = true;
    // Hover
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = -(e.clientY / h) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables);
    renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
});
renderer.domElement.addEventListener('pointerup', e => {
    if (moved) return;
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = -(e.clientY / h) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables);
    if (hits.length > 0) {
        const p = hits[0].object.userData.produit;
        if (p) {
            const sc = p.quantite === 0 ? '#ff6b6b' : p.quantite < 5 ? '#fdcb6e' : '#00b894';
            tooltipDiv.innerHTML = `
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
                    <span style="width:10px;height:10px;border-radius:50%;background:${p.couleur||'#6c5ce7'}"></span>
                    <strong>${p.nom}</strong>
                </div>
                <div style="font-size:0.85rem;display:grid;grid-template-columns:1fr 1fr;gap:0.3rem">
                    <div><span style="color:#6b7280">Type:</span> ${p.type}</div>
                    <div><span style="color:#6b7280">Prix:</span> ${p.prix.toFixed(2)}€</div>
                    <div style="grid-column:1/-1;color:${sc};font-weight:600">Stock: ${p.quantite} unites</div>
                </div>`;
            let tx = e.clientX + 15, ty = e.clientY + 15;
            if (tx > window.innerWidth - 200) tx = e.clientX - 200;
            if (ty > window.innerHeight - 150) ty = e.clientY - 150;
            tooltipDiv.style.left = tx + 'px';
            tooltipDiv.style.top = ty + 'px';
            tooltipDiv.style.display = 'block';
        }
    } else {
        tooltipDiv.style.display = 'none';
    }
});

// Particles
const pGeo = new THREE.BufferGeometry();
const pos = new Float32Array(100 * 3);
for (let i = 0; i < 300; i++) pos[i] = (Math.random() - 0.5) * 16;
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x6c5ce7, size: 0.025, transparent: true, opacity: 0.25 }));
parts.position.y = 4;
scene.add(parts);

// Animate
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const p = 0.3 + 0.2 * Math.sin(Date.now() * 0.003);
    mach.children.forEach(c => {
        if (c.material && c.material.emissive && c.material.color && c.material.color.getHex() === 0x6c5ce7) {
            c.material.emissiveIntensity = p;
        }
    });
    parts.rotation.y += 0.0005;
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    const nw = container.clientWidth, nh = container.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
});

renderer.domElement.addEventListener('mousedown', () => { controls.autoRotate = false; });
renderer.domElement.addEventListener('mouseup', () => setTimeout(() => { controls.autoRotate = true; }, 4000));

loadProducts3D();
