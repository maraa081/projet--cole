"""
serial_bridge.py - Pont TCP -> API SmartVend
Ecoute les donnees STM32 relayees par Windows et les poste a l'API.
"""
import socket
import requests
import json
import sys
import time

HOST = '0.0.0.0'
PORT = 9090
API_URL = 'http://localhost:3040/api/mesures'

print(f"Pont TCP demarre sur {HOST}:{PORT}")
print(f"Envoie vers {API_URL}")
print("Attente de connexion depuis Windows...")
print("-" * 50)

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((HOST, PORT))
server.listen(1)

conn, addr = server.accept()
print(f"[OK] Connecte depuis Windows ({addr[0]}:{addr[1]})")
conn.settimeout(None)

buffer = ""
try:
    while True:
        data = conn.recv(4096)
        if not data:
            print("[FIN] Connexion fermee par Windows")
            break
        
        buffer += data.decode('utf-8', errors='ignore')
        
        while '\n' in buffer:
            line, buffer = buffer.split('\n', 1)
            line = line.strip()
            if not line:
                continue
            
            print(f"[STM32] {line}")
            
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                print(f"  -> skip (pas du JSON)")
                continue
            
            if "error" in payload:
                print(f"  -> ERREUR: {payload['error']}")
                continue
            if "boot" in payload or "info" in payload:
                print(f"  -> INFO: {line}")
                continue
            if "tvoc" not in payload or "eco2" not in payload:
                continue
            
            data_to_send = {
                "tvoc": payload["tvoc"],
                "eco2": payload["eco2"],
                "status": payload.get("status", "OK"),
                "sample": payload.get("id", 0)
            }
            
            try:
                r = requests.post(API_URL, json=data_to_send, timeout=3)
                if r.status_code == 200:
                    print(f"  -> API OK (id={r.json().get('id','?')})")
                else:
                    print(f"  -> API ERR {r.status_code}")
            except Exception as e:
                print(f"  -> API FAIL {e}")

except KeyboardInterrupt:
    print("\nArret demande")
finally:
    conn.close()
    server.close()
    print("Ferme")
