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
INSERT INTO donnees_capteurs (groupe, capteur, valeur, unite, timestamp) VALUES
    ('Groupe A', 'MQ-135 (Gaz)', 42.5, 'ppm', datetime('now', '-1 day', '+0 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 38.2, 'ppm', datetime('now', '-1 day', '+2 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 45.1, 'ppm', datetime('now', '-1 day', '+4 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 51.3, 'ppm', datetime('now', '-1 day', '+6 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 47.8, 'ppm', datetime('now', '-1 day', '+8 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 44.0, 'ppm', datetime('now', '-1 day', '+10 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 39.6, 'ppm', datetime('now', '-1 day', '+12 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 36.4, 'ppm', datetime('now', '-1 day', '+14 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 41.2, 'ppm', datetime('now', '-1 day', '+16 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 48.7, 'ppm', datetime('now', '-1 day', '+18 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 52.0, 'ppm', datetime('now', '-1 day', '+20 hours')),
    ('Groupe A', 'MQ-135 (Gaz)', 43.3, 'ppm', datetime('now', '-1 day', '+22 hours')),
    ('Groupe B', 'DHT22 (Température)', 22.5, '°C', datetime('now', '-1 day')),
    ('Groupe C', 'HC-SR04 (Distance)', 15.2, 'cm', datetime('now', '-1 day')),
    ('Groupe D', 'LDR (Lumière)', 780, 'lux', datetime('now', '-1 day')),
    ('Groupe E', 'PIR (Mouvement)', 1, 'détecté', datetime('now', '-1 day')),
    ('Groupe F', 'Microphone', 45.6, 'dB', datetime('now', '-1 day'));
