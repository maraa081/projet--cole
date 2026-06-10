"""
gateway.py - Passerelle STM32 -> Base de données
Lit le JSON envoyé par la NUCLEO et l'enregistre en SQLite
via l'API Flask.

Usage : python gateway.py --port COM3
"""

import serial
import requests
import json
import time
import argparse
import sys
from datetime import datetime

# ── Config ──────────────────────────────────────────────────
BAUD_RATE = 115200
URL_API   = "http://localhost:5000/api/mesures"

# ── Arguments ───────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Passerelle STM32 -> API")
parser.add_argument("--port", default="COM3", help="Port série (ex: COM3 ou /dev/ttyACM0)")
args = parser.parse_args()

print(f"[{datetime.now().strftime('%H:%M:%S')}] Passerelle démarrée sur {args.port}")
print(f"[{datetime.now().strftime('%H:%M:%S')}] API cible : {URL_API}")
print("─" * 50)

# ── Connexion série ──────────────────────────────────────────
try:
    ser = serial.Serial(args.port, BAUD_RATE, timeout=2)
    time.sleep(2)
    print(f"[OK] Port {args.port} ouvert à {BAUD_RATE} bauds")
except serial.SerialException as e:
    print(f"[ERREUR] Impossible d'ouvrir {args.port} : {e}")
    print("Vérifiez que le port est correct et que la NUCLEO est branchée.")
    sys.exit(1)

# ── Boucle principale ────────────────────────────────────────
buffer = ""
try:
    while True:
        if ser.in_waiting > 0:
            chunk = ser.read(ser.in_waiting).decode("utf-8", errors="ignore")
            buffer += chunk

            # Traiter ligne par ligne
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                print(f"[STM32] {line}")

                # Parser le JSON
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    print(f"  ↳ [SKIP] Pas du JSON valide")
                    continue

                # Messages d'info/erreur du STM32
                if "error" in data:
                    print(f"  ↳ [ERREUR CAPTEUR] {data['error']}")
                    continue
                if "info" in data or "boot" in data:
                    print(f"  ↳ [INFO] {line}")
                    continue

                # Données capteur
                if "tvoc" not in data or "eco2" not in data:
                    continue

                tvoc   = data["tvoc"]
                eco2   = data["eco2"]
                status = data.get("status", "OK")
                sid    = data.get("id", 0)

                # Affichage console
                icons = {"OK": "✅", "ALERTE": "⚠️ ", "DANGER": "🚨", "INIT": "🔄"}
                icon  = icons.get(status, "  ")
                print(f"  ↳ {icon} TVOC={tvoc} ppb | eCO2={eco2} ppm | {status}")

                # Envoi à l'API
                payload = {
                    "tvoc":   tvoc,
                    "eco2":   eco2,
                    "status": status,
                    "sample": sid
                }
                try:
                    r = requests.post(URL_API, json=payload, timeout=3)
                    if r.status_code == 200:
                        print(f"  ↳ [DB] Enregistré (id={r.json().get('id','?')})")
                    else:
                        print(f"  ↳ [DB] Erreur HTTP {r.status_code}")
                except requests.exceptions.ConnectionError:
                    print(f"  ↳ [DB] API non disponible - lance server.py d'abord")

        time.sleep(0.1)

except KeyboardInterrupt:
    print("\n[STOP] Passerelle arrêtée.")
    ser.close()
