"""
gateway.py - Passerelle STM32 -> SmartVend API
Lit le JSON envoye par la NUCLEO et l'enregistre via l'API Node.js

Usage : python gateway.py --port COM3
Usage : python gateway.py --port /dev/ttyACM0 --url http://localhost:3040
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
URL_API   = "http://localhost:3040/api/mesures"

# ── Arguments ───────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Passerelle STM32 -> SmartVend API")
parser.add_argument("--port", default="COM3", help="Port serie (ex: COM3 ou /dev/ttyACM0)")
parser.add_argument("--url", default=URL_API, help="URL de l'API SmartVend")
args = parser.parse_args()

print(f"[{datetime.now().strftime('%H:%M:%S')}] Passerelle demarree sur {args.port}")
print(f"[{datetime.now().strftime('%H:%M:%S')}] API cible : {args.url}")
print("-" * 50)

# ── Connexion serie ──────────────────────────────────────────
try:
    ser = serial.Serial(args.port, BAUD_RATE, timeout=2)
    time.sleep(2)
    print(f"[OK] Port {args.port} ouvert a {BAUD_RATE} bauds")
except serial.SerialException as e:
    print(f"[ERREUR] Impossible d'ouvrir {args.port} : {e}")
    print("Verifiez que le port est correct et que la NUCLEO est branchée.")
    sys.exit(1)

# ── Boucle principale ────────────────────────────────────────
buffer = ""
try:
    while True:
        if ser.in_waiting > 0:
            chunk = ser.read(ser.in_waiting).decode("utf-8", errors="ignore")
            buffer += chunk

            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                print(f"[STM32] {line}")

                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    print(f"  -> [SKIP] Pas du JSON valide")
                    continue

                if "error" in data:
                    print(f"  -> [ERREUR CAPTEUR] {data['error']}")
                    continue
                if "info" in data or "boot" in data:
                    print(f"  -> [INFO] {line}")
                    continue

                if "tvoc" not in data or "eco2" not in data:
                    continue

                payload = {
                    "tvoc": data["tvoc"],
                    "eco2": data["eco2"],
                    "status": data.get("status", "OK"),
                    "sample": data.get("id", 0)
                }

                try:
                    r = requests.post(args.url, json=payload, timeout=3)
                    if r.status_code == 200:
                        print(f"  -> [API OK] id={r.json().get('id', '?')}")
                    else:
                        print(f"  -> [API ERR] {r.status_code}")
                except requests.exceptions.RequestException as e:
                    print(f"  -> [API FAIL] {e}")

except KeyboardInterrupt:
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Arret demande")
finally:
    ser.close()
    print("[OK] Port serie ferme")
