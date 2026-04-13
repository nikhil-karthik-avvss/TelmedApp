import base64
import json
import time

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from ppg_processor import PPGProcessor

app = FastAPI(title="PPG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/ppg")
async def ws_ppg(websocket: WebSocket):
    await websocket.accept()
    processor = PPGProcessor()

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            # ── decode base64 JPEG frame ──────────────────────────────────
            b64 = msg.get("frame", "")
            if "," in b64:                       # strip data-URL prefix
                b64 = b64.split(",", 1)[1]

            img_bytes = base64.b64decode(b64)
            arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_text(
                    json.dumps({"error": "Could not decode frame"})
                )
                continue

            # ── run PPG computation ───────────────────────────────────────
            result = processor.process_frame(frame)

            # ── build response ────────────────────────────────────────────
            response = {
                "ppgValue":      result["ppg_value"],
                "heartRate":     result["heart_rate"],
                "spo2":          result["spo2"],
                "signalQuality": result["signal_quality"],
                "fingerPresent": result["finger_present"],
                "placementOk":   result["placement_ok"],
                "placementMsg":  result["placement_msg"],
                "bufferSize":    result["buffer_size"],
                "alerts":        _build_alerts(result),
            }

            await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        print(f"[ws_ppg] error: {exc}")


# ── helpers ───────────────────────────────────────────────────────────────

def _build_alerts(r: dict) -> list:
    now = int(time.time() * 1000)
    alerts = []

    if not r["finger_present"]:
        alerts.append({
            "type": "warning",
            "message": "No finger detected — place finger over camera lens",
            "timestamp": now,
        })
    elif not r["placement_ok"]:
        alerts.append({
            "type": "warning",
            "message": r["placement_msg"],
            "timestamp": now,
        })
    else:
        alerts.append({
            "type": "success",
            "message": r["placement_msg"],
            "timestamp": now,
        })

    if not r["illum_ok"]:
        alerts.append({
            "type": "error",
            "message": r["illum_msg"],
            "timestamp": now,
        })

    if r["heart_rate"] is not None:
        alerts.append({
            "type": "info",
            "message": f"Heart Rate: {r['heart_rate']} BPM",
            "timestamp": now,
        })

    if r["spo2"] is not None:
        alerts.append({
            "type": "info",
            "message": f"SpO2: {r['spo2']}%",
            "timestamp": now,
        })

    return alerts
