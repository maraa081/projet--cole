// MySQL Admin — Interface base partagee

async function loadSchema() {
    const list = document.getElementById('schema-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    try {
        const res = await fetch('/ecole/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'SHOW TABLES' })
        });
        const data = await res.json();
        
        if (data.error) {
            list.innerHTML = `<p style="color:var(--danger)">${data.error}</p>`;
            return;
        }
        
        let html = '';
        for (const row of data.rows) {
            const tableName = Object.values(row)[0];
            html += `<details class="schema-table">
                <summary>${tableName}</summary>
                <div id="cols-${tableName}">
                    <div class="loading"><div class="spinner"></div>Chargement colonnes...</div>
                </div>
            </details>`;
            
            // Load columns async
            loadColumns(tableName);
        }
        list.innerHTML = html;
    } catch(e) {
        list.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
}

async function loadColumns(table) {
    try {
        const res = await fetch('/ecole/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `DESCRIBE \`${table}\`` })
        });
        const data = await res.json();
        
        if (data.error) return;
        
        const cols = document.getElementById(`cols-${table}`);
        cols.innerHTML = data.rows.map(r => {
            const field = Object.values(r)[0];
            const type = Object.values(r)[1];
            const key = r.Key === 'PRI' ? '🔑' : r.Key === 'MUL' ? '🔗' : '';
            return `<div class="col-info">
                <span>${field}</span>
                <span class="type">${type}</span>
                <span class="key">${key}</span>
            </div>`;
        }).join('');
        
        // Add click to query
        cols.innerHTML += `<div style="padding:0.5rem 1rem">
            <button class="btn btn-secondary" onclick="quickQuery('${table}')" style="font-size:0.8rem;padding:0.3rem 0.7rem">Voir les donnees</button>
        </div>`;
    } catch(e) {}
}

function quickQuery(table) {
    document.getElementById('sql-input').value = `SELECT * FROM \`${table}\` ORDER BY id DESC LIMIT 50`;
    runQuery();
}

async function runQuery() {
    const sql = document.getElementById('sql-input').value.trim();
    if (!sql) return;
    
    const resultDiv = document.getElementById('sql-result');
    const timeDiv = document.getElementById('query-time');
    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Execution...</div>';
    
    const start = Date.now();
    try {
        const res = await fetch('/ecole/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql })
        });
        const data = await res.json();
        const elapsed = Date.now() - start;
        
        if (data.error) {
            resultDiv.innerHTML = `<div style="color:var(--danger);padding:1rem;background:rgba(255,107,107,0.1);border-radius:var(--radius-sm)">${escapeHtml(data.error)}</div>`;
            timeDiv.textContent = `Erreur (${elapsed}ms)`;
            return;
        }
        
        if (!data.rows || data.rows.length === 0) {
            resultDiv.innerHTML = '<p style="color:var(--text-secondary);padding:1rem">Aucun resultat</p>';
            timeDiv.textContent = `${elapsed}ms — 0 lignes`;
            return;
        }
        
        const cols = Object.keys(data.rows[0]);
        const header = cols.map(c => `<th>${escapeHtml(c)}</th>`).join('');
        const body = data.rows.map(row => {
            return '<tr>' + cols.map(c => {
                let val = row[c];
                if (val === null || val === undefined) return '<td style="color:var(--text-secondary);font-style:italic">NULL</td>';
                return `<td>${escapeHtml(String(val))}</td>`;
            }).join('') + '</tr>';
        }).join('');
        
        resultDiv.innerHTML = `<div class="table-container"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
        timeDiv.textContent = `${elapsed}ms — ${data.rows.length} lignes`;
        
    } catch(e) {
        resultDiv.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`;
        timeDiv.textContent = `Erreur (${Date.now() - start}ms)`;
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
loadSchema();
runQuery();
