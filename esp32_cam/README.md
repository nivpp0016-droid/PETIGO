# PETIGO ESP32-CAM Chamber Optical Monitor

This firmware turns your **AI-Thinker ESP32-CAM** (with **ESP32-CAM-MB** micro-USB baseboard) into a high-performance optical chamber camera for the **PETIGO Smart Doorstep Box**.

---

## 1. Hardware Connections
1. Plug the **ESP32-CAM** into the **ESP32-CAM-MB** baseboard (the micro-USB shield).
2. Connect the baseboard to your computer using a standard **micro-USB data cable**.
3. **No jumper wires needed**: The MB baseboard has built-in auto-reset (CH340 chip) and switches GPIO 0 automatically.

---

## 2. Flashing the Firmware

### Method A: Arduino IDE
1. Open **Arduino IDE**.
2. Go to **File -> Open** and select `esp32_cam.ino`.
3. In **Tools -> Board**, select **`AI Thinker ESP32-CAM`**.
4. In **Tools -> Port**, select the COM port of your baseboard (e.g. `COM7`).
5. Update your Wi-Fi credentials in `esp32_cam.ino`:
   ```cpp
   const char* WIFI_SSID     = "Ruhul jio";
   const char* WIFI_PASSWORD = "12345678";
   ```
6. Click **Upload** (arrow icon).
7. Once finished, open **Tools -> Serial Monitor** at **`115200 baud`**.
8. Press the **RST** button on the MB baseboard.
9. Note the printed IP address (e.g. `192.168.31.120`).

### Method B: PlatformIO
Compile and flash with one command:
```bash
~/.platformio/penv/Scripts/pio run -d esp32_cam -t upload
```

---

## 3. Endpoints & URLs
When connected to Wi-Fi, your ESP32-CAM provides:

| Endpoint | Port | Description |
| :--- | :--- | :--- |
| **`http://<IP>:81/stream`** | 81 | Low-latency live MJPEG video stream (800x600 SVGA) |
| **`http://<IP>/capture`** | 80 | Full-resolution single photo snapshot |
| **`http://<IP>/flash?state=1`** | 80 | Turn ON chamber flash light |
| **`http://<IP>/flash?state=0`** | 80 | Turn OFF chamber flash light |
| **`http://<IP>/status`** | 80 | JSON status (Wi-Fi signal RSSI, uptime, flash state) |

---

## 4. Connecting to PETIGO Dashboard
1. Open your PETIGO dashboard at `http://localhost:5173`.
2. Locate the **Chamber Camera** card.
3. Click the **Camera Settings (Gear icon)**.
4. Enter your ESP32-CAM's IP address (e.g. `192.168.31.120`) or full stream URL (`http://192.168.31.120:81/stream`).
5. Click **Save & Connect**.
6. The live video feed will immediately appear with crosshairs, live streaming badge, flash controls, and snapshot capture!
