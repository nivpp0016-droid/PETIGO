# PETIGO Project Report – Figure and Screenshot Index

This document provides a formal catalogue of all system screenshots, graphical user interfaces, and architectural figures captured for the B.E. final-year project report: **"PETIGO – Smart IoT Parcel Delivery & Secure Storage System"**.

All UI captures were taken in a standard **1440×900** desktop viewport (100% zoom, light theme, with secrets masked) and a **390×844** mobile viewport for responsive evaluation.

---

## Screenshot Inventory & Figure Captions

| Filename | Resolution | Figure Designation | Formal Report Caption | Status |
| :--- | :---: | :---: | :--- | :---: |
| `01_login.png` | 1440×900 | **Figure 4.1** | *Figure 4.1: Owner authentication portal showing 256-bit encrypted credential login.* | Captured |
| `02_register.png` | N/A | **N/A** | *Registration page – Skipped (No separate user registration component exists in the React frontend; the project handles authentication via `Login.jsx` and backend endpoint `POST /api/auth/register`).* | Skipped |
| `03_dashboard_idle.png` | 1440×900 | **Figure 4.2** | *Figure 4.2: Primary PETIGO dashboard displaying the smart parcel box in the online, locked, and idle state.* | Captured |
| `04_dashboard_telemetry.png` | 1440×900 | **Figure 4.3** | *Figure 4.3: Real-time sensor telemetry panel illustrating ultrasonic distance measurement and Wi-Fi signal strength (RSSI).* | Captured |
| `05_chamber_camera.png` | 1440×900 | **Figure 4.4** | *Figure 4.4: Optical chamber surveillance interface featuring the AI-Thinker ESP32-CAM live stream and illuminator controls.* | Captured |
| `06_otp_modal.png` | 1440×900 | **Figure 4.5** | *Figure 4.5: Ephemeral delivery code generation modal displaying a 6-digit dynamic OTP with a 5-minute countdown timer.* | Captured |
| `07_delivery_page.png` | 1440×900 | **Figure 4.6** | *Figure 4.6: Courier access terminal screen featuring the on-screen tactile virtual keypad for code entry.* | Captured |
| `08_otp_verified.png` | 1440×900 | **Figure 4.7** | *Figure 4.7: Access granted confirmation interface indicating successful OTP verification and solenoid unlatch.* | Captured |
| `09_otp_invalid.png` | 1440×900 | **Figure 4.8** | *Figure 4.8: Rejection warning dialogue displayed upon input of an incorrect or expired delivery access code.* | Captured |
| `10_otp_lockout.png` | 1440×900 | **Figure 4.9** | *Figure 4.9: Security lockout dialogue triggered after exceeding the maximum limit of five failed OTP attempts.* | Captured |
| `11_remote_unlock.png` | 1440×900 | **Figure 4.10** | *Figure 4.10: Web dashboard hero card reflecting the chamber in an active remotely unlocked state.* | Captured |
| `12_dashboard_parcel_detected.png` | 1440×900 | **Figure 4.11** | *Figure 4.11: Live dashboard state depicting door opening and ultrasonic parcel detection within the 25 cm threshold.* | Captured |
| `13_history.png` | 1440×900 | **Figure 4.12** | *Figure 4.12: Historical delivery audit log listing completed courier drop-offs with Indian Standard Time (IST) timestamps.* | Captured |
| `14_security_log.png` | 1440×900 | **Figure 4.13** | *Figure 4.13: Centralized security event audit log illustrating real-time tamper, OTP verification, and lockout records.* | Captured |
| `15_settings.png` | 1440×900 | **Figure 4.14** | *Figure 4.14: System configuration panel with sensitive hardware tokens and network credentials securely masked.* | Captured |
| `16_mobile_dashboard.png` | 390×844 | **Figure 4.15** | *Figure 4.15: Responsive mobile viewport view of the PETIGO dashboard running on a 390×844 handheld display.* | Captured |
| `17_api_tests_passing.png` | 1440×900 | **Figure 5.1** | *Figure 5.1: Terminal execution output of the backend API automated test suite demonstrating 33 passing test cases.* | Captured |
| `18_project_structure.png` | 1440×900 | **Figure 5.2** | *Figure 5.2: Directory hierarchy and modular codebase architecture across firmware, backend, and frontend packages.* | Captured |
| `19_db_schema.png` | 1440×900 | **Figure 5.3** | *Figure 5.3: Relational entity-relationship schema of the SQLite database operating in Write-Ahead Logging (WAL) mode.* | Captured |

---

## Technical Notes
- **Hardware Simulation:** Due to the physical ESP32 and ESP32-CAM boards running detached in lab bench conditions, live edge telemetry was supplied by `tools_tmp/esp32_simulator.js`, which faithfully mimics the exact HTTP payload and polling signatures implemented in `src/api_client.cpp`.
- **Credential Masking:** All device tokens, passwords, and private identifiers remained masked using default UI privacy controls (`••••••••••••`) to adhere to cybersecurity standards for academic documentation.
- **Data Anonymisation:** Screenshots were captured using demo account `demo@petigo.com` and box identifier `PETIGO Box 01`.
