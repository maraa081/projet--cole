// ─── BDD Viewer — Temps reel ──────────────────────────────

async function loadMesures() {
    try {
        const res = await fetch('/ecole/api/mesures?limit=30');
        const data = await res.json();
        document.getElementById('mesures-table').innerHTML = data.slice().reverse().map(m => {
            const statusColor = m.status === 'OK' ? 'var(--success)' : 
                                m.status === 'ALERTE' ? 'var(--warning)' : 'var(--danger)';
            return `<tr>
                <td>${m.id}</td>
                <td>${new Date(m.timestamp).toLocaleTimeString('fr-FR')}</td>
                <td><strong>${m.tvoc}</strong></td>
                <td><strong>${m.eco2}</strong></td>
                <td><span style="color:${statusColor};font-weight:600">${m.status}</span></td>
            </tr>`;
        }).join('');
        document.getElementById('mesures-count').textContent = data.length;
    } catch(e) {}
}

async function loadAlertes() {
    try {
        const res = await fetch('/ecole/api/alertes?limit=20');
        const data = await res.json();
        document.getElementById('alertes-table').innerHTML = data.length ? data.map(a => {
            const typeColor = a.type === 'DANGER' ? 'var(--danger)' : 'var(--warning)';
            return `<tr>
                <td>${a.id}</td>
                <td>${new Date(a.timestamp).toLocaleString('fr-FR')}</td>
                <td><span style="color:${typeColor};font-weight:600">${a.type}</span></td>
                <td>${a.tvoc}</td>
                <td>${a.eco2}</td>
                <td>${a.message}</td>
            </tr>`;
        }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">Aucune alerte</td></tr>';
    } catch(e) {}
}

async function loadPartage() {
    try {
        const res = await fetch('/ecole/api/partage/tout');
        const data = await res.json();
        
        // Temperature
        if (data.temperature) {
            document.getElementById('temp-table').innerHTML = `<tr>
                <td>${data.temperature.id}</td>
                <td>${data.temperature.temperature} °C</td>
                <td>${data.temperature.humidite} %</td>
                <td>${new Date(data.temperature.timestamp).toLocaleString('fr-FR')}</td>
            </tr>`;
        }
        
        // Luminosite
        if (data.luminosite) {
            document.getElementById('lumiere-table').innerHTML = `<tr>
                <td>${data.luminosite.id}</td>
                <td>${data.luminosite.luminosite} lux</td>
                <td>${new Date(data.luminosite.timestamp).toLocaleString('fr-FR')}</td>
            </tr>`;
        } else {
            document.getElementById('lumiere-table').innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary)">Pas encore de donnees</td></tr>';
        }
    } catch(e) {}
}

async function loadStats() {
    try {
        const [s1, s2] = await Promise.all([
            fetch('/ecole/api/mesures/stats').then(r => r.json()),
            fetch('/ecole/api/mesures/last').then(r => r.json()).catch(() => ({}))
        ]);
        document.getElementById('bdd-stats').innerHTML = `
            <div class="stat-card">
                <h4>Mesures SGP30</h4>
                <div class="value accent">${s1.total_mesures || 0}</div>
            </div>
            <div class="stat-card">
                <h4>TVOC moyen</h4>
                <div class="value accent2">${s1.tvoc_moy || '--'} <span class="unit">ppb</span></div>
            </div>
            <div class="stat-card">
                <h4>eCO2 moyen</h4>
                <div class="value success">${s1.eco2_moy || '--'} <span class="unit">ppm</span></div>
            </div>
            <div class="stat-card">
                <h4>Dernier status</h4>
                <div class="value" style="color:${s2.status === 'OK' ? 'var(--success)' : 'var(--danger)'}">${s2.status || '--'}</div>
            </div>
        `;
    } catch(e) {}
}

// Init + refresh rapide
loadStats();
loadMesures();
loadAlertes();
loadPartage();

setInterval(loadStats, 1000);
setInterval(loadMesures, 1000);
setInterval(loadAlertes, 5000);
setInterval(loadPartage, 5000);
