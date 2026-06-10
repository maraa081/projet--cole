# SmartVend 🥫 — Distributeur Automatique Connecté

Projet IoT/Dev — Capteur de gaz + interface web moderne

## Structure
- **/** — Page d'accueil / présentation
- **/distributeur** — Visualisation 3D du distributeur (Three.js)
- **/admin** — Panneau d'administration (CRUD produits)
- **/capteurs** — Données des capteurs en temps réel

## API
- `GET /api/produits` — Liste des produits
- `GET /api/capteurs` — Données capteurs
- `POST /api/capteurs` — Envoyer une donnée capteur
- `GET /api/stats` — Statistiques du stock

## Stack
- Backend : Node.js + Express + SQLite
- Frontend : HTML/CSS vanilla + Three.js + Chart.js
- 3D : Three.js (distributeur interactif)
