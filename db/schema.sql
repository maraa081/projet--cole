-- Schéma de la base de données du distributeur automatique

CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('canette', 'snack', 'bouteille', 'autre')),
    prix REAL NOT NULL DEFAULT 1.50,
    quantite INTEGER NOT NULL DEFAULT 10,
    image_url TEXT DEFAULT '',
    couleur TEXT DEFAULT '#ff6b35',
    en_stock INTEGER NOT NULL DEFAULT 1,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donnees_capteurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupe TEXT NOT NULL,
    capteur TEXT NOT NULL,
    valeur REAL NOT NULL,
    unite TEXT DEFAULT '',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historique_commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER,
    quantite INTEGER NOT NULL,
    total REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Données initiales
INSERT INTO produits (nom, type, prix, quantite, couleur) VALUES
    ('Coca-Cola', 'canette', 1.50, 15, '#e20613'),
    ('Orangina', 'canette', 1.50, 12, '#ff8c00'),
    ('Ice Tea Pêche', 'bouteille', 2.00, 10, '#f5a623'),
    ('Oasis Tropical', 'bouteille', 2.00, 8, '#ff6b35'),
    ('Kit Kat', 'snack', 1.20, 20, '#d42027'),
    ('Mars', 'snack', 1.20, 18, '#4a2800'),
    ('Snickers', 'snack', 1.20, 16, '#8b4513'),
    ('Eau Plate', 'bouteille', 1.00, 24, '#3498db'),
    ('Monster Energy', 'canette', 2.50, 10, '#00a65a'),
    ('Pringles', 'snack', 2.00, 6, '#c0392b');

-- Données simulées du capteur de gaz
-- Table mesures SGP30 (notre capteur de gaz)
CREATE TABLE IF NOT EXISTS mesures (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT    NOT NULL,
    tvoc      INTEGER NOT NULL,
    eco2      INTEGER NOT NULL,
    status    TEXT    NOT NULL,
    sample    INTEGER DEFAULT 0
);

-- Table alertes SGP30
CREATE TABLE IF NOT EXISTS alertes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    type      TEXT NOT NULL,
    tvoc      INTEGER,
    eco2      INTEGER,
    message   TEXT
);

-- Données simulées SGP30 (pour démo)
INSERT INTO mesures (timestamp, tvoc, eco2, status, sample) VALUES
    (datetime('now', '-1 hour', '+0 minutes'), 45, 420, 'OK', 0),
    (datetime('now', '-1 hour', '+2 minutes'), 52, 435, 'OK', 1),
    (datetime('now', '-1 hour', '+4 minutes'), 48, 428, 'OK', 2),
    (datetime('now', '-1 hour', '+6 minutes'), 38, 415, 'OK', 3),
    (datetime('now', '-1 hour', '+8 minutes'), 55, 442, 'OK', 4),
    (datetime('now', '-1 hour', '+10 minutes'), 62, 458, 'OK', 5),
    (datetime('now', '-1 hour', '+12 minutes'), 120, 520, 'ALERTE', 6),
    (datetime('now', '-1 hour', '+14 minutes'), 98, 490, 'ALERTE', 7),
    (datetime('now', '-1 hour', '+16 minutes'), 72, 465, 'OK', 8),
    (datetime('now', '-1 hour', '+18 minutes'), 58, 445, 'OK', 9),
    (datetime('now', '-1 hour', '+20 minutes'), 63, 455, 'OK', 10),
    (datetime('now', '-1 hour', '+22 minutes'), 55, 440, 'OK', 11),
    (datetime('now', '-1 hour', '+24 minutes'), 48, 425, 'OK', 12),
    (datetime('now', '-1 hour', '+26 minutes'), 42, 418, 'OK', 13),
    (datetime('now', '-1 hour', '+28 minutes'), 50, 430, 'OK', 14),
    (datetime('now', '-1 hour', '+30 minutes'), 56, 438, 'OK', 15),
    (datetime('now', '-1 hour', '+32 minutes'), 250, 1200, 'DANGER', 16),
    (datetime('now', '-1 hour', '+34 minutes'), 310, 1500, 'DANGER', 17),
    (datetime('now', '-1 hour', '+36 minutes'), 180, 800, 'ALERTE', 18),
    (datetime('now', '-1 hour', '+38 minutes'), 95, 520, 'ALERTE', 19),
    (datetime('now', '-1 hour', '+40 minutes'), 68, 460, 'OK', 20),
    (datetime('now', '-1 hour', '+42 minutes'), 55, 435, 'OK', 21),
    (datetime('now', '-1 hour', '+44 minutes'), 48, 420, 'OK', 22),
    (datetime('now', '-1 hour', '+46 minutes'), 44, 415, 'OK', 23),
    (datetime('now', '-1 hour', '+48 minutes'), 50, 428, 'OK', 24),
    (datetime('now', '-1 hour', '+50 minutes'), 53, 432, 'OK', 25);

-- Données simulées des autres groupes
INSERT INTO donnees_capteurs (groupe, capteur, valeur, unite, timestamp) VALUES
    ('Groupe B', 'DHT22 (Temperature)', 22.5, '°C', datetime('now', '-1 day')),
    ('Groupe C', 'HC-SR04 (Distance)', 15.2, 'cm', datetime('now', '-1 day')),
    ('Groupe D', 'LDR (Lumiere)', 780, 'lux', datetime('now', '-1 day')),
    ('Groupe E', 'PIR (Mouvement)', 1, 'detecte', datetime('now', '-1 day')),
    ('Groupe F', 'Microphone', 45.6, 'dB', datetime('now', '-1 day'));
