// ─── Admin Dashboard ───────────────────────────────────────

async function loadStats() {
    try {
        const res = await fetch('/ecole/api/stats');
        const stats = await res.json();
        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card">
                <h4>Produits</h4>
                <div class="value accent">${stats.totalProduits}</div>
            </div>
            <div class="stat-card">
                <h4>Stock total</h4>
                <div class="value accent2">${stats.totalStock} unités</div>
            </div>
            <div class="stat-card">
                <h4>Commandes</h4>
                <div class="value success">${stats.totalCommandes}</div>
            </div>
            <div class="stat-card">
                <h4>Stock faible</h4>
                <div class="value ${stats.produitsFaibles > 0 ? 'danger' : 'success'}">${stats.produitsFaibles}</div>
            </div>
        `;
    } catch (e) {
        document.getElementById('stats-grid').innerHTML = '<p>Erreur stats</p>';
    }
}

async function loadProduits() {
    try {
        const res = await fetch('/ecole/api/produits');
        const produits = await res.json();
        document.getElementById('produits-table').innerHTML = produits.map(p => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:0.5rem">
                        <span style="width:12px;height:12px;border-radius:50%;background:${p.couleur || '#6c5ce7'};display:inline-block"></span>
                        ${p.nom}
                    </div>
                </td>
                <td>${p.type}</td>
                <td>${p.prix.toFixed(2)}€</td>
                <td>${p.quantite}</td>
                <td>
                    ${p.quantite === 0 ? '<span style="color:var(--danger)">Rupture</span>' : 
                      p.quantite < 5 ? '<span style="color:var(--warning)">Faible</span>' : 
                      '<span style="color:var(--success)">OK</span>'}
                </td>
                <td>
                    <button class="action-btn edit" onclick="editProduit(${p.id})">✏️</button>
                    <button class="action-btn delete" onclick="deleteProduit(${p.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        document.getElementById('produits-table').innerHTML = '<tr><td colspan="6">Erreur de chargement</td></tr>';
    }
}

async function loadCommandes() {
    try {
        const res = await fetch('/ecole/api/commandes');
        const commandes = await res.json();
        document.getElementById('commandes-table').innerHTML = commandes.length ? commandes.map(c => `
            <tr>
                <td>${new Date(c.date).toLocaleString('fr-FR')}</td>
                <td>${c.produit_nom || '—'}</td>
                <td>${c.quantite}</td>
                <td>${c.total ? parseFloat(c.total).toFixed(2) + '€' : '—'}</td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">Aucune commande pour le moment</td></tr>';
    } catch (e) {
        document.getElementById('commandes-table').innerHTML = '<tr><td colspan="4">Erreur</td></tr>';
    }
}

// ─── Modal ─────────────────────────────────────────────────
function openModal(produit = null) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = produit ? 'Modifier le produit' : 'Ajouter un produit';
    document.getElementById('edit-id').value = produit ? produit.id : '';
    document.getElementById('nom').value = produit ? produit.nom : '';
    document.getElementById('type').value = produit ? produit.type : 'canette';
    document.getElementById('prix').value = produit ? produit.prix : '';
    document.getElementById('quantite').value = produit ? produit.quantite : 10;
    document.getElementById('couleur').value = produit ? (produit.couleur || '#6c5ce7') : '#6c5ce7';
    overlay.classList.add('active');
}

function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-overlay').classList.remove('active');
}

// Close on escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('active');
});

async function saveProduct(event) {
    event.preventDefault();
    const id = document.getElementById('edit-id').value;
    const data = {
        nom: document.getElementById('nom').value,
        type: document.getElementById('type').value,
        prix: parseFloat(document.getElementById('prix').value),
        quantite: parseInt(document.getElementById('quantite').value),
        couleur: document.getElementById('couleur').value,
    };

    try {
        const url = id ? `/ecole/api/produits/${id}` : '/ecole/api/produits';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        showToast(result.message, 'success');
        closeModal();
        loadStats();
        loadProduits();
        loadCommandes();
    } catch (e) {
        showToast('Erreur lors de l\'enregistrement', 'error');
    }
}

async function editProduit(id) {
    try {
        const res = await fetch(`/ecole/api/produits/${id}`);
        const produit = await res.json();
        openModal(produit);
    } catch (e) {
        showToast('Erreur de chargement', 'error');
    }
}

async function deleteProduit(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await fetch(`/ecole/api/produits/${id}`, { method: 'DELETE' });
        showToast('Produit supprimé ✅', 'success');
        loadStats();
        loadProduits();
    } catch (e) {
        showToast('Erreur de suppression', 'error');
    }
}

// ─── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Init ──────────────────────────────────────────────────
loadStats();
loadProduits();
loadCommandes();
