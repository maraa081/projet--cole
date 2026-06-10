"""
server.py - Serveur Flask + SQLite
Reçoit les données de gateway.py et les stocke.
Sert aussi le dashboard HTML.

Usage : python server.py
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH   = "distributeur.db"
HTML_PATH = os.path.dirname(os.path.abspath(__file__))

# ── Init base de données ─────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS mesures (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT    NOT NULL,
            tvoc      INTEGER NOT NULL,
            eco2      INTEGER NOT NULL,
            status    TEXT    NOT NULL,
            sample    INTEGER DEFAULT 0
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS alertes (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            type      TEXT NOT NULL,
            tvoc      INTEGER,
            eco2      INTEGER,
            message   TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("[DB] Base de données initialisée : distributeur.db")

# ── Route : recevoir une mesure ──────────────────────────────
@app.route("/api/mesures", methods=["POST"])
def post_mesure():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON invalide"}), 400

    tvoc   = data.get("tvoc", 0)
    eco2   = data.get("eco2", 0)
    status = data.get("status", "OK")
    sample = data.get("sample", 0)
    ts     = datetime.now().isoformat()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO mesures (timestamp, tvoc, eco2, status, sample) VALUES (?,?,?,?,?)",
        (ts, tvoc, eco2, status, sample)
    )
    new_id = c.lastrowid

    # Enregistrer les alertes automatiquement
    if status in ("ALERTE", "DANGER"):
        msgs = {
            "ALERTE": f"Niveau anormal détecté — TVOC {tvoc} ppb / eCO2 {eco2} ppm",
            "DANGER": f"FUITE CRITIQUE — TVOC {tvoc} ppb / eCO2 {eco2} ppm"
        }
        c.execute(
            "INSERT INTO alertes (timestamp, type, tvoc, eco2, message) VALUES (?,?,?,?,?)",
            (ts, status, tvoc, eco2, msgs[status])
        )

    conn.commit()
    conn.close()
    return jsonify({"id": new_id, "status": "ok"}), 200

# ── Route : lire les dernières mesures ───────────────────────
@app.route("/api/mesures", methods=["GET"])
def get_mesures():
    limit = request.args.get("limit", 60, type=int)
    conn  = sqlite3.connect(DB_PATH)
    c     = conn.cursor()
    c.execute(
        "SELECT id, timestamp, tvoc, eco2, status FROM mesures ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    rows = c.fetchall()
    conn.close()
    mesures = [
        {"id": r[0], "timestamp": r[1], "tvoc": r[2], "eco2": r[3], "status": r[4]}
        for r in reversed(rows)
    ]
    return jsonify(mesures), 200

# ── Route : dernière mesure ───────────────────────────────────
@app.route("/api/mesures/last", methods=["GET"])
def get_last():
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("SELECT id, timestamp, tvoc, eco2, status FROM mesures ORDER BY id DESC LIMIT 1")
    r = c.fetchone()
    conn.close()
    if not r:
        return jsonify({"error": "Aucune mesure"}), 404
    return jsonify({"id": r[0], "timestamp": r[1], "tvoc": r[2], "eco2": r[3], "status": r[4]}), 200

# ── Route : alertes ───────────────────────────────────────────
@app.route("/api/alertes", methods=["GET"])
def get_alertes():
    limit = request.args.get("limit", 20, type=int)
    conn  = sqlite3.connect(DB_PATH)
    c     = conn.cursor()
    c.execute(
        "SELECT id, timestamp, type, tvoc, eco2, message FROM alertes ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    rows = c.fetchall()
    conn.close()
    alertes = [
        {"id": r[0], "timestamp": r[1], "type": r[2], "tvoc": r[3], "eco2": r[4], "message": r[5]}
        for r in rows
    ]
    return jsonify(alertes), 200

# ── Route : statistiques ──────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("SELECT COUNT(*) FROM mesures")
    total = c.fetchone()[0]
    c.execute("SELECT AVG(tvoc), AVG(eco2), MAX(tvoc), MAX(eco2) FROM mesures")
    r = c.fetchone()
    c.execute("SELECT COUNT(*) FROM alertes WHERE type='DANGER'")
    dangers = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM alertes WHERE type='ALERTE'")
    alertes = c.fetchone()[0]
    conn.close()
    return jsonify({
        "total_mesures": total,
        "tvoc_moy": round(r[0] or 0, 1),
        "eco2_moy": round(r[1] or 0, 1),
        "tvoc_max": r[2] or 0,
        "eco2_max": r[3] or 0,
        "nb_dangers": dangers,
        "nb_alertes": alertes
    }), 200

# ── Servir le dashboard ───────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(HTML_PATH, "dashboard.html")

# ── Lancement ────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print("[SERVER] Serveur démarré sur http://localhost:5000")
    print("[SERVER] Dashboard : http://localhost:5000")
    print("[SERVER] API       : http://localhost:5000/api/mesures")
    app.run(host="0.0.0.0", port=5000, debug=False)
