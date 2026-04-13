import time
from typing import Optional

import cv2
import numpy as np


# ─────────────────────────── FINGER DETECTION ────────────────────────────

def is_finger_present(frame: np.ndarray,
                      red_ratio_thresh: float = 1.2,
                      min_red: float = 80) -> bool:
    r = np.mean(frame[:, :, 2])
    g = np.mean(frame[:, :, 1])
    b = np.mean(frame[:, :, 0])
    red_ratio = r / (g + b + 1e-6)
    return bool((r > min_red) and (red_ratio > red_ratio_thresh))


# ─────────────────────── ILLUMINATION CHECK ──────────────────────────────

def check_illumination_uncovered(frame: np.ndarray,
                                 min_brightness: float = 80):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    if brightness < min_brightness:
        return False, "Turn ON the light"
    return True, "Illumination OK"


# ─────────────────────────── FINGER PLACEMENT ────────────────────────────

def check_finger_placement(frame: np.ndarray,
                           edge_thresh: float = 1.1,
                           corner_thresh: float = 1.25,
                           var_thresh: float = 18):
    h, w, _ = frame.shape

    edge_regions = {
        "move left":  frame[:, :w // 4],
        "move right": frame[:, 3 * w // 4:],
        "move up":    frame[:h // 4, :],
        "move down":  frame[3 * h // 4:, :],
    }

    issues = []
    for direction, region in edge_regions.items():
        r = np.mean(region[:, :, 2])
        g = np.mean(region[:, :, 1])
        b = np.mean(region[:, :, 0])
        red_ratio = r / (g + b + 1e-6)
        if red_ratio < edge_thresh:
            issues.append(direction)

    cs = max(1, min(h, w) // 10)
    corners = [
        frame[:cs, :cs],
        frame[:cs, -cs:],
        frame[-cs:, :cs],
        frame[-cs:, -cs:],
    ]
    for corner in corners:
        r = np.mean(corner[:, :, 2])
        g = np.mean(corner[:, :, 1])
        b = np.mean(corner[:, :, 0])
        red_ratio = r / (g + b + 1e-6)
        gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
        variance = float(np.var(gray))
        if red_ratio < corner_thresh or variance > var_thresh:
            return False, "Cover all corners completely"

    if not issues:
        return True, "Finger placement OK"
    return False, "Finger not covering properly → " + ", ".join(issues)


# ─────────────────────────── PPG PROCESSOR ───────────────────────────────

class PPGProcessor:
    # Keep up to 20 s worth of samples (assuming ≤30 fps)
    MAX_BUFFER = 600
    # Need at least 5 s of clean data before computing vitals
    MIN_SAMPLES = 150

    def __init__(self):
        self.red_buf: list[float] = []
        self.green_buf: list[float] = []
        self.ts_buf: list[float] = []

    def reset(self):
        self.red_buf.clear()
        self.green_buf.clear()
        self.ts_buf.clear()

    # ── public entry point ────────────────────────────────────────────────

    def process_frame(self, frame_bgr: np.ndarray) -> dict:
        now = time.time()

        finger_present = is_finger_present(frame_bgr)

        if finger_present:
            illum_ok, illum_msg = True, "Finger detected (PPG mode)"
        else:
            illum_ok, illum_msg = check_illumination_uncovered(frame_bgr)

        place_ok, place_msg = check_finger_placement(frame_bgr)

        r_mean = float(np.mean(frame_bgr[:, :, 2]))
        g_mean = float(np.mean(frame_bgr[:, :, 1]))

        # Buffer only when finger is correctly placed
        if finger_present and place_ok:
            self.red_buf.append(r_mean)
            self.green_buf.append(g_mean)
            self.ts_buf.append(now)
            if len(self.red_buf) > self.MAX_BUFFER:
                self.red_buf.pop(0)
                self.green_buf.pop(0)
                self.ts_buf.pop(0)

        signal_quality = 1.0 if (finger_present and place_ok) \
                         else (0.5 if finger_present else 0.0)

        heart_rate: Optional[float] = None
        spo2: Optional[float] = None
        if len(self.red_buf) >= self.MIN_SAMPLES:
            heart_rate = self._heart_rate()
            spo2 = self._spo2()

        return {
            "finger_present": finger_present,
            "placement_ok":   place_ok,
            "placement_msg":  place_msg,
            "illum_ok":       illum_ok,
            "illum_msg":      illum_msg,
            "ppg_value":      g_mean,
            "heart_rate":     heart_rate,
            "spo2":           spo2,
            "signal_quality": signal_quality,
            "buffer_size":    len(self.red_buf),
        }

    # ── private helpers ───────────────────────────────────────────────────

    def _fps(self) -> float:
        if len(self.ts_buf) < 2:
            return 30.0
        elapsed = self.ts_buf[-1] - self.ts_buf[0]
        return (len(self.ts_buf) - 1) / elapsed if elapsed > 0 else 30.0

    def _heart_rate(self) -> Optional[float]:
        signal = np.array(self.red_buf, dtype=float)
        signal -= signal.mean()

        fs = self._fps()
        fft_vals = np.abs(np.fft.rfft(signal))
        fft_freqs = np.fft.rfftfreq(len(signal), 1.0 / fs)

        # Valid HR range: 42–210 BPM → 0.7–3.5 Hz
        mask = (fft_freqs >= 0.7) & (fft_freqs <= 3.5)
        if not np.any(mask):
            return None

        peak_freq = float(fft_freqs[mask][np.argmax(fft_vals[mask])])
        return round(peak_freq * 60.0, 1)

    def _spo2(self) -> Optional[float]:
        red   = np.array(self.red_buf,   dtype=float)
        green = np.array(self.green_buf, dtype=float)

        ac_r, dc_r = float(np.std(red)),   float(np.mean(red))
        ac_g, dc_g = float(np.std(green)), float(np.mean(green))

        if dc_r < 1 or dc_g < 1 or ac_g < 0.01:
            return None

        R = (ac_r / dc_r) / (ac_g / dc_g)
        # Simplified ratio-of-ratios calibration for camera PPG
        spo2 = 110.0 - 25.0 * R
        return round(max(85.0, min(100.0, spo2)), 1)
