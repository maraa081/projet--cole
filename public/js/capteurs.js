// ─── Capteurs Dashboard ───────────────────────────────────

let chartInstance = null;

async function loadSGP30Live() {
    try {
        const res = await fetch('/ecole/api/mesures/last');
        const data = await res.json();

        const statusColors = {
            'OK': 'var(--success)',
            'ALERTE': 'var(--warning)',
            'DANGER': 'var(--danger)',
            'INIT': 'var(--accent)'
        };

        document.getElementById('sgp30-live').innerHTML = `
            <div class="stat-card">
                <h4>TVOC (Composes organiques)</h4>
                <div class="value accent">${data.tvoc || '--'}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary)">ppb</div>
            </div>
            <div class="stat-card">
                <h4>eCO2 (CO2 equivalent)</h4>
                <div class="value accent2">${data.eco2 || '--'}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary)">ppm</div>
            </div>
            <div class="stat-card">
                <h4>Status</h4>
                <div class="value" style="color:${statusColors[data.status] || 'var(--text-secondary)'}">${data.status || '--'}</div>
            </div>
            <div class="stat-card">
                <h4>Derniere mesure</h4>
                <div class="value" style="font-size:0.9rem;color:var(--text-secondary)">
                    ${data.timestamp ? new Date(data.timestamp).toLocaleTimeString('fr-FR') : '--'}
                </div>
            </div>
        `;
    } catch (e) {
        document.getElementById('sgp30-live').innerHTML =
            '<p style="color:var(--text-secondary);grid-column:1/-1;text-align:center">En attente du capteur...</p>';
    }
}

async function loadSGP30Chart() {
    try {
        const res = await fetch('/ecole/api/mesures?limit=60');
        const data = await res.json();

        if (!data.length) return;

        const labels = data.map(d => {
            const t = new Date(d.timestamp);
            return t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        });
        const tvoc = data.map(d => d.tvoc);
        const eco2 = data.map(d => d.eco2);

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(document.getElementById('sgp30-chart'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'TVOC (ppb)',
                        data: tvoc,
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108,92,231,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        borderWidth: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: 'eCO2 (ppm)',
                        data: eco2,
                        borderColor: '#00cec9',
                        backgroundColor: 'rgba(0,206,201,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        borderWidth: 2,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { color: '#6b7280', font: { size: 12 } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#6b7280', maxTicksLimit: 12, font: { size: 11 } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'TVOC (ppb)', color: '#6c5ce7' },
                        ticks: { color: '#6b7280' },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'eCO2 (ppm)', color: '#00cec9' },
                        ticks: { color: '#6b7280' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart error:', e);
    }
}

async function loadAlertes() {
    try {
        const res = await fetch('/ecole/api/alertes?limit=10');
        const alertes = await res.json();
        const container = document.getElementById('alertes-list');

        if (!alertes.length) {
            container.innerHTML = '<p style="color:var(--text-secondary)">Aucune alerte</p>';
            return;
        }

        container.innerHTML = alertes.map(a => {
            const typeColor = a.type === 'DANGER' ? 'var(--danger)' : 'var(--warning)';
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:0.75rem 0;border-bottom:1px solid var(--border)">
                    <div>
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
                            background:${typeColor};margin-right:0.5rem"></span>
                        <strong style="color:${typeColor}">${a.type}</strong>
                        <span style="color:var(--text-secondary);margin-left:0.5rem">${a.message}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">
                        ${new Date(a.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('alertes-list').innerHTML =
            '<p style="color:var(--text-secondary)">Erreur chargement alertes</p>';
    }
}

async function loadOtherSensors() {
    try {
        const res = await fetch('/ecole/api/capteurs/tous');
        const capteurs = await res.json();
        const grid = document.getElementById('sensors-grid');

        grid.innerHTML = capteurs.map(c => {
            const badges = {
                'Groupe B': 'temp', 'Groupe C': 'dist',
                'Groupe D': 'lumiere', 'Groupe E': 'mouvement', 'Groupe F': 'son'
            };
            const labels = {
                'Groupe B': 'Temperature', 'Groupe C': 'Distance',
                'Groupe D': 'Lumiere', 'Groupe E': 'Mouvement', 'Groupe F': 'Son'
            };
            const label = labels[c.groupe] || c.capteur;
            const badge = badges[c.groupe] || 'gaz';

            return `
                <div class="sensor-card" style="background:var(--bg-card);padding:1.25rem;
                    border:1px solid var(--border);border-radius:var(--radius)">
                    <div class="sensor-header">
                        <span class="sensor-name">${c.groupe} — ${label}</span>
                        <span class="sensor-badge ${badge}">${c.groupe}</span>
                    </div>
                    <div class="sensor-value" style="font-size:1.8rem">
                        ${c.valeur} <span class="unit">${c.unite}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem">
                        ${new Date(c.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('sensors-grid').innerHTML = '<p style="color:var(--text-secondary)">En attente...</p>';
    }
}

// ─── Init ──────────────────────────────────────────────────
loadSGP30Live();
loadSGP30Chart();
loadAlertes();
loadOtherSensors();

// Auto-refresh toutes les 10s
setInterval(() => {
    loadSGP30Live();
    loadSGP30Chart();
    loadAlertes();
    loadOtherSensors();
}, 10000);
