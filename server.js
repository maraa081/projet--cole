const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Connexion MySQL partagee (lecture seule)
let mysqlConn = null;
async function initMySQL() {
    try {
        mysqlConn = await mysql.createConnection({
            host: 'mysql.mrlojnat.fr',
            port: 3306,
            user: 'g3d',
            password: 'nNzAsD5%U47qg@KR',
            connectTimeout: 10000
        });
        await mysqlConn.query('USE app');
        console.log('[MySQL] Connecte a la base partagee');
    } catch (e) {
        console.error('[MySQL] Erreur connexion:', e.message);
        mysqlConn = null;
    }
}
const PORT = process.env.PORT || 3040;

// DB
const db = new Database(path.join(__dirname, 'db', 'distributeur.db'));
db.pragma('journal_mode = WAL');

// Init DB
const schema = require('fs').readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
db.exec(schema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Produits ──────────────────────────────────────────

// GET /api/produits - Tous les produits
app.get('/api/produits', (req, res) => {
    const produits = db.prepare('SELECT * FROM produits ORDER BY type, nom').all();
    res.json(produits);
});

// GET /api/produits/:id - Un produit
app.get('/api/produits/:id', (req, res) => {
    const produit = db.prepare('SELECT * FROM produits WHERE id = ?').get(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(produit);
});

// POST /api/produits - Ajouter
app.post('/api/produits', (req, res) => {
    const { nom, type, prix, quantite, couleur } = req.body;
    const stmt = db.prepare('INSERT INTO produits (nom, type, prix, quantite, couleur, en_stock) VALUES (?, ?, ?, ?, ?, 1)');
    const result = stmt.run(nom, type, prix, quantite || 10, couleur || '#ff6b35');
    res.json({ id: result.lastInsertRowid, message: 'Produit ajoute' });
});

// PUT /api/produits/:id - Modifier
app.put('/api/produits/:id', (req, res) => {
    const { nom, type, prix, quantite, couleur } = req.body;
    const produit = db.prepare('SELECT * FROM produits WHERE id = ?').get(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    db.prepare(`UPDATE produits SET 
        nom = ?, type = ?, prix = ?, quantite = ?, couleur = ?,
        en_stock = CASE WHEN ? > 0 THEN 1 ELSE 0 END
        WHERE id = ?`).run(
        nom || produit.nom,
        type || produit.type,
        prix ?? produit.prix,
        quantite ?? produit.quantite,
        couleur || produit.couleur,
        quantite ?? produit.quantite,
        req.params.id
    );
    res.json({ message: 'Produit mis a jour' });
});

// DELETE /api/produits/:id - Supprimer
app.delete('/api/produits/:id', (req, res) => {
    db.prepare('DELETE FROM produits WHERE id = ?').run(req.params.id);
    res.json({ message: 'Produit supprime' });
});

// ─── API Capteurs ──────────────────────────────────────────

// GET /api/capteurs - Dernières données
app.get('/api/capteurs', (req, res) => {
    const donnees = db.prepare(`
        SELECT * FROM donnees_capteurs 
        ORDER BY timestamp DESC 
        LIMIT 50
    `).all();
    res.json(donnees);
});

// GET /api/capteurs/gaz - Spécifique gaz (notre groupe)
app.get('/api/capteurs/gaz', (req, res) => {
    const donnees = db.prepare(`
        SELECT * FROM donnees_capteurs 
        WHERE capteur LIKE '%Gaz%' 
        ORDER BY timestamp DESC 
        LIMIT 100
    `).all();
    res.json(donnees);
});

// GET /api/capteurs/tous - Tous les groupes
app.get('/api/capteurs/tous', (req, res) => {
    const donnees = db.prepare(`
        SELECT groupe, capteur, valeur, unite, timestamp 
        FROM donnees_capteurs 
        WHERE id IN (SELECT MAX(id) FROM donnees_capteurs GROUP BY capteur)
        ORDER BY groupe
    `).all();
    res.json(donnees);
});

// POST /api/capteurs - Recevoir des données (simulation API)
app.post('/api/capteurs', (req, res) => {
    const { groupe, capteur, valeur, unite } = req.body;
    const stmt = db.prepare('INSERT INTO donnees_capteurs (groupe, capteur, valeur, unite) VALUES (?, ?, ?, ?)');
    const result = stmt.run(groupe || 'Groupe A', capteur, valeur, unite || '');
    res.json({ id: result.lastInsertRowid, message: 'Donnée enregistrée ✅' });
});

// ─── API SGP30 (Capteur de gaz) ───────────────────────────

// POST /api/mesures - Recevoir une mesure du SGP30
app.post('/api/mesures', (req, res) => {
    const { tvoc, eco2, status, sample } = req.body;
    if (tvoc === undefined || eco2 === undefined) {
        return res.status(400).json({ error: 'Donnees invalides' });
    }
    const ts = new Date().toISOString();
    const st = db.prepare('INSERT INTO mesures (timestamp, tvoc, eco2, status, sample) VALUES (?,?,?,?,?)');
    const result = st.run(ts, tvoc, eco2, status || 'OK', sample || 0);

    // Alerte auto si besoin
    if (status === 'ALERTE' || status === 'DANGER') {
        const msgs = {
            ALERTE: `Niveau anormal - TVOC ${tvoc} ppb / eCO2 ${eco2} ppm`,
            DANGER: `FUITE CRITIQUE - TVOC ${tvoc} ppb / eCO2 ${eco2} ppm`
        };
        db.prepare('INSERT INTO alertes (timestamp, type, tvoc, eco2, message) VALUES (?,?,?,?,?)')
            .run(ts, status, tvoc, eco2, msgs[status]);
    }
    res.json({ id: result.lastInsertRowid, status: 'ok' });
});

// GET /api/mesures - Lire les mesures
app.get('/api/mesures', (req, res) => {
    const limit = parseInt(req.query.limit) || 60;
    const rows = db.prepare('SELECT id, timestamp, tvoc, eco2, status FROM mesures ORDER BY id DESC LIMIT ?').all(limit);
    const mesures = rows.reverse();
    res.json(mesures);
});

// GET /api/mesures/last - Derniere mesure
app.get('/api/mesures/last', (req, res) => {
    const row = db.prepare('SELECT id, timestamp, tvoc, eco2, status FROM mesures ORDER BY id DESC LIMIT 1').get();
    if (!row) return res.status(404).json({ error: 'Aucune mesure' });
    res.json(row);
});

// GET /api/alertes - Lire les alertes
app.get('/api/alertes', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const alertes = db.prepare('SELECT id, timestamp, type, tvoc, eco2, message FROM alertes ORDER BY id DESC LIMIT ?').all(limit);
    res.json(alertes);
});

// GET /api/mesures/stats - Stats capteur gaz
app.get('/api/mesures/stats', (req, res) => {
    const stats = db.prepare(`
        SELECT 
            COUNT(*) as total_mesures,
            ROUND(AVG(tvoc), 1) as tvoc_moy,
            ROUND(AVG(eco2), 1) as eco2_moy,
            MAX(tvoc) as tvoc_max,
            MAX(eco2) as eco2_max
        FROM mesures
    `).get();
    const dangers = db.prepare("SELECT COUNT(*) as count FROM alertes WHERE type='DANGER'").get();
    const alertesCount = db.prepare("SELECT COUNT(*) as count FROM alertes WHERE type='ALERTE'").get();
    res.json({ ...stats, nb_dangers: dangers.count, nb_alertes: alertesCount.count });
});

// ─── API Base partagee (MySQL) ───────────────────────────

// GET /api/partage/temperatures
app.get('/api/partage/temperatures', async (req, res) => {
    if (!mysqlConn) return res.json([]);
    try {
        const [rows] = await mysqlConn.query('SELECT * FROM temperature_humidite ORDER BY timestamp DESC LIMIT 50');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/partage/luminosite
app.get('/api/partage/luminosite', async (req, res) => {
    if (!mysqlConn) return res.json([]);
    try {
        const [rows] = await mysqlConn.query('SELECT * FROM luminosite ORDER BY timestamp DESC LIMIT 50');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/partage/tout - Toutes les donnees partagees
app.get('/api/partage/tout', async (req, res) => {
    if (!mysqlConn) return res.json({ temperature: [], luminosite: [] });
    try {
        const [temps] = await mysqlConn.query('SELECT * FROM temperature_humidite ORDER BY timestamp DESC LIMIT 1');
        const [lums] = await mysqlConn.query('SELECT * FROM luminosite ORDER BY timestamp DESC LIMIT 1');
        res.json({
            temperature: temps[0] || null,
            luminosite: lums[0] || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── API Commandes ─────────────────────────────────────────

// GET /api/commandes - Historique
app.get('/api/commandes', (req, res) => {
    const commandes = db.prepare(`
        SELECT hc.*, p.nom as produit_nom, p.couleur
        FROM historique_commandes hc
        LEFT JOIN produits p ON hc.produit_id = p.id
        ORDER BY hc.date DESC
        LIMIT 50
    `).all();
    res.json(commandes);
});

// POST /api/commandes - Nouvelle commande
app.post('/api/commandes', (req, res) => {
    const { produit_id, quantite } = req.body;
    const produit = db.prepare('SELECT * FROM produits WHERE id = ? AND en_stock = 1').get(produit_id);
    if (!produit) return res.status(400).json({ error: 'Produit indisponible' });
    if (produit.quantite < quantite) return res.status(400).json({ error: 'Stock insuffisant' });

    const total = (produit.prix * quantite).toFixed(2);
    db.prepare('INSERT INTO historique_commandes (produit_id, quantite, total) VALUES (?, ?, ?)').run(produit_id, quantite, quantite);
    db.prepare('UPDATE produits SET quantite = quantite - ?, en_stock = CASE WHEN quantite - ? <= 0 THEN 0 ELSE 1 END WHERE id = ?').run(quantite, quantite, produit_id);
    res.json({ message: 'Commande validee', total });
});

// GET /api/stats - Stats dashboard
app.get('/api/stats', (req, res) => {
    const totalProduits = db.prepare('SELECT COUNT(*) as count FROM produits').get();
    const totalStock = db.prepare('SELECT SUM(quantite) as total FROM produits').get();
    const totalCommandes = db.prepare('SELECT COUNT(*) as count FROM historique_commandes').get();
    const produitsFaibles = db.prepare('SELECT COUNT(*) as count FROM produits WHERE quantite < 5 AND en_stock = 1').get();
    const derniereVente = db.prepare(`
        SELECT hc.*, p.nom FROM historique_commandes hc 
        LEFT JOIN produits p ON hc.produit_id = p.id 
        ORDER BY hc.date DESC LIMIT 1
    `).get();
    res.json({
        totalProduits: totalProduits.count,
        totalStock: totalStock.total || 0,
        totalCommandes: totalCommandes.count,
        produitsFaibles: produitsFaibles.count,
        derniereVente: derniereVente || null
    });
});

// ─── Pages HTML ──────────────────────────────────────────
app.get('/distributeur', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'distributeur.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/capteurs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'capteurs.html'));
});
app.get('/bdd', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bdd.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialisation MySQL + demarrage
initMySQL().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`SmartVend API — http://localhost:${PORT}`);
        console.log(`Capteurs sur /api/capteurs`);
        console.log(`Produits sur /api/produits`);
        console.log(`Mesures SGP30 sur /api/mesures`);
        console.log(`Base partagee sur /api/partage/tout`);
    });
});
