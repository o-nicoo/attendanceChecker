#!/usr/bin/env python3
"""
Raspberry Pi RFID + Ultrasonic scanner
---------------------------------------
Wiring (example):
  HC-SR04 TRIG  -> GPIO 23
  HC-SR04 ECHO  -> GPIO 24
  MFRC522 (SPI) -> SPI0 (MOSI/MISO/SCK/CE0) + GPIO 25 (RST)

Dependencies:
  pip install RPi.GPIO mfrc522 requests
"""

import time
import requests
import RPi.GPIO as GPIO
try:
    from mfrc522 import SimpleMFRC522
    RFID_AVAILABLE = True
except ImportError:
    RFID_AVAILABLE = False
    print("[WARN] mfrc522 library not found – running in simulation mode")

# ── Configuration ──────────────────────────────────────────────────────────────
SERVER_URL   = "http://YOUR_SERVER_IP:3000"   # <-- set to your Nuxt server IP
SCAN_SECRET  = ""                             # <-- must match .env SCAN_SECRET
TRIGGER_PIN  = 23
ECHO_PIN     = 24
DISTANCE_CM  = 100   # trigger RFID scan if someone is within this distance
COOLDOWN_S   = 3     # seconds between scans for the same chip
# ───────────────────────────────────────────────────────────────────────────────

GPIO.setmode(GPIO.BCM)
GPIO.setup(TRIGGER_PIN, GPIO.OUT)
GPIO.setup(ECHO_PIN, GPIO.IN)

if RFID_AVAILABLE:
    reader = SimpleMFRC522()

last_scanned: dict[str, float] = {}


def measure_distance() -> float:
    """Returns distance in centimetres using HC-SR04."""
    GPIO.output(TRIGGER_PIN, GPIO.LOW)
    time.sleep(0.05)
    GPIO.output(TRIGGER_PIN, GPIO.HIGH)
    time.sleep(0.00001)
    GPIO.output(TRIGGER_PIN, GPIO.LOW)

    start = time.time()
    stop  = time.time()
    while GPIO.input(ECHO_PIN) == 0:
        start = time.time()
    while GPIO.input(ECHO_PIN) == 1:
        stop = time.time()

    elapsed = stop - start
    return (elapsed * 34300) / 2


def report_scan(rfid_id: str) -> None:
    """POST the RFID scan to the Nuxt API."""
    now = time.time()
    if rfid_id in last_scanned and (now - last_scanned[rfid_id]) < COOLDOWN_S:
        return
    last_scanned[rfid_id] = now

    payload = {"rfid_id": rfid_id}
    if SCAN_SECRET:
        payload["secret"] = SCAN_SECRET

    try:
        r = requests.post(f"{SERVER_URL}/api/logs", json=payload, timeout=5)
        data = r.json()
        name  = data.get("student", {}).get("name", "Unbekannt") if data.get("student") else "Unbekannt"
        event = data.get("event_type", "?")
        print(f"[SCAN] {rfid_id} → {name} ({event})")
    except Exception as e:
        print(f"[ERR ] Konnte API nicht erreichen: {e}")


def simulate_scan() -> None:
    """Simulation when no RFID hardware is present."""
    import random
    demo_ids = ["RFID-001", "RFID-002", "RFID-003"]
    rfid_id  = random.choice(demo_ids)
    print(f"[SIM ] Simulierter Scan: {rfid_id}")
    report_scan(rfid_id)


print(f"[INFO] Scanner gestartet. Server: {SERVER_URL}")
print(f"[INFO] RFID-Hardware: {'ja' if RFID_AVAILABLE else 'nein (Simulation)'}")

try:
    while True:
        distance = measure_distance()
        if distance < DISTANCE_CM:
            print(f"[DIST] Bewegung erkannt ({distance:.1f} cm)")
            if RFID_AVAILABLE:
                print("[RFID] Warte auf RFID-Chip…")
                rfid_id, _ = reader.read_no_block()
                if rfid_id:
                    report_scan(str(rfid_id))
            else:
                simulate_scan()
        time.sleep(0.2)
except KeyboardInterrupt:
    print("\n[INFO] Scanner beendet.")
finally:
    GPIO.cleanup()
