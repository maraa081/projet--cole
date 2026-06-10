// ─── Capteurs Dashboard ───────────────────────────────────

async function loadAllSensors() {
    try {
        const res = await fetch('/ecole/api/capteurs/tous');
        const capteurs = await res.json();
        const grid = document.getElementById('sensors-grid');

        const icons = {
            'Gaz': '💨', 'Température': '🌡️', 'Distance': '📏',
            'Lumière': '☀️', 'Mouvement': '🚶', 'Son': '🎤'
        };
        const badges = {
            'Gaz': 'gaz', 'Température': 'temp', 'Distance': 'dist',
            'Lumière': 'lumiere', 'Mouvement': 'mouvement', 'Son': 'son'
        };

        grid.innerHTML = capteurs.map(c => {
            const label = c.capteur.split('(')[0].trim() || c.capteur;
            const badgeClass = badges[Object.keys(badges).find(k => c.capteur.includes(k))] || 'gaz';
            const icon = icons[Object.keys(icons).find(k => c.capteur.includes(k))] || '📡';
            return `
                <div class="sensor-card">
                    <div class="sensor-header">
                        <span class="sensor-name">${icon} ${label}</span>
                        <span class="sensor-badge ${badgeClass}">${c.groupe}</span>
                    </div>
                    <div class="sensor-value">
                        ${c.valeur} <span class="unit">${c.unite}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.3rem">
                        ${new Date(c.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('sensors-grid').innerHTML = '<p style="color:var(--text-secondary)">En attente des données...</p>';
    }
}

async function loadGazChart() {
    try {
        const res = await fetch('/ecole/api/capteurs/gaz');
        const data = await res.json();

        if (!data.length) {
            document.getElementById('gaz-chart').parentElement.innerHTML +=
                '<p style="color:var(--text-secondary);text-align:center">Aucune donnée gaz disponible</p>';
            return;
        }

        const labels = data.reverse().map(d =>
            new Date(d.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        );
        const values = data.map(d => d.valeur);

        new Chart(document.getElementById('gaz-chart'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Gaz (ppm)',
                    data: values,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#6c5ce7',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#8888bb' } }
                },
                scales: {
                    x: {
                        ticks: { color: '#8888bb', maxTicksLimit: 10 },
                        grid: { color: 'rgba(108,92,231,0.1)' }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: { color: '#8888bb' },
                        grid: { color: 'rgba(108,92,231,0.1)' }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Gaz chart error:', e);
    }
}

async function loadAllSensorTable() {
    try {
        const res = await fetch('/ecole/api/capteurs');
        const data = await res.json();
        const container = document.getElementById('all-sensors-table');

        // Group by capteur
        const grouped = {};
        data.forEach(d => {
            if (!grouped[d.capteur]) grouped[d.capteur] = [];
            grouped[d.capteur].push(d);
        });

        container.innerHTML = Object.entries(grouped).map(([capteur, entries]) => `
            <div style="margin-bottom:1rem">
                <h4 style="margin-bottom:0.5rem;color:var(--text-secondary);font-size:0.85rem">
                    📡 ${capteur}
                </h4>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                    ${entries.slice(0, 10).map(e => `
                        <span style="background:var(--bg-card);padding:0.3rem 0.7rem;border-radius:4px;font-size:0.85rem">
                            ${e.valeur} ${e.unite}
                            <span style="color:var(--text-secondary);font-size:0.75rem;margin-left:0.3rem">
                                ${new Date(e.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('all-sensors-table').innerHTML =
            '<p style="color:var(--text-secondary)">En attente...</p>';
    }
}

// ─── Init ──────────────────────────────────────────────────
loadAllSensors();
loadGazChart();
loadAllSensorTable();

// Auto-refresh every 30s
setInterval(() => {
    loadAllSensors();
    loadAllSensorTable();
}, 30000);
