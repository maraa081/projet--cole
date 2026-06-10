// ─── BDD Viewer — Toutes les donnees ─────────────────────

function renderTable(name, rows) {
    if (!rows || rows.length === 0) {
        return `<div class="chart-container">
            <h3>${escapeHtml(name)}</h3>
            <p style="color:var(--text-secondary)">Table vide</p>
        </div>`;
    }
    
    const cols = Object.keys(rows[0]);
    
    const header = cols.map(c => `<th>${escapeHtml(c)}</th>`).join('');
    const body = rows.map(row => {
        return '<tr>' + cols.map(c => {
            let val = row[c];
            if (val === null || val === undefined) return '<td style="color:var(--text-secondary)">NULL</td>';
            if (c.toLowerCase().includes('status')) {
                const color = val === 'OK' ? 'var(--success)' : val === 'ALERTE' ? 'var(--warning)' : val === 'DANGER' ? 'var(--danger)' : 'var(--text)';
                return `<td><span style="color:${color};font-weight:600">${escapeHtml(String(val))}</span></td>`;
            }
            return `<td>${escapeHtml(String(val))}</td>`;
        }).join('') + '</tr>';
    }).join('');
    
    return `<div class="chart-container">
        <h3>${escapeHtml(name)} <span style="font-weight:400;font-size:0.85rem;color:var(--text-secondary)">(${rows.length} lignes)</span></h3>
        <div style="overflow-x:auto;max-height:500px;overflow-y:auto">
            <table>
                <thead><tr>${header}</tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    </div>`;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadLocale() {
    try {
        const res = await fetch('/ecole/api/bdd/locale');
        const data = await res.json();
        const container = document.getElementById('locale-content');
        
        // Stats
        let totalRows = 0;
        let html = '<div class="stats-grid" style="margin-bottom:1rem">';
        for (const [name, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
                html += `<div class="stat-card"><h4>${escapeHtml(name)}</h4><div class="value accent">${rows.length}</div></div>`;
                totalRows += rows.length;
            }
        }
        html += `<div class="stat-card"><h4>Total</h4><div class="value success">${totalRows}</div></div>`;
        html += '</div>';
        
        // Tables
        for (const [name, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
                html += renderTable(name, rows);
            }
        }
        
        container.innerHTML = html;
    } catch(e) {
        document.getElementById('locale-content').innerHTML = '<p style="color:var(--danger)">Erreur chargement</p>';
    }
}

async function loadPartagee() {
    try {
        const res = await fetch('/ecole/api/bdd/partagee');
        const data = await res.json();
        const container = document.getElementById('partagee-content');
        
        if (data.error) {
            container.innerHTML = `<p style="color:var(--danger)">${data.error}</p>`;
            return;
        }
        
        let totalRows = 0;
        let html = '<div class="stats-grid" style="margin-bottom:1rem">';
        for (const [name, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
                html += `<div class="stat-card"><h4>${escapeHtml(name)}</h4><div class="value accent2">${rows.length}</div></div>`;
                totalRows += rows.length;
            }
        }
        html += `<div class="stat-card"><h4>Total</h4><div class="value success">${totalRows}</div></div>`;
        html += '</div>';
        
        for (const [name, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
                html += renderTable(name, rows);
            }
        }
        
        container.innerHTML = html;
    } catch(e) {
        document.getElementById('partagee-content').innerHTML = '<p style="color:var(--danger)">Erreur chargement</p>';
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.className = b.className.replace(' btn-primary', ' btn-secondary').replace(' active', '');
        if (b.textContent.toLowerCase().includes(tab === 'locale' ? 'locale' : 'partagee')) {
            b.className = 'btn btn-primary tab-btn active';
        }
    });
    document.getElementById('tab-locale').style.display = tab === 'locale' ? 'block' : 'none';
    document.getElementById('tab-partagee').style.display = tab === 'partagee' ? 'block' : 'none';
}

// Init
loadLocale();
loadPartagee();

// Refresh toutes les 3 secondes
setInterval(loadLocale, 3000);
setInterval(loadPartagee, 5000);
