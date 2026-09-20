#include <Arduino.h>

#include "config.h"
#include "wifi_manager.h"
#include "api_client.h"
#include "display_manager.h"
#include "reed_sensor.h"
#include "ultrasonic_sensor.h"
#include "lock.h"
#include "buzzer.h"
#include "keypad_manager.h"
#include "parcel_controller.h"

// Hardware instances
LockController parcelLock(RELAY_PIN, RELAY_ACTIVE_LOW);
WiFiManager wifiManager;
DisplayManager display;
KeypadManager keypad;
ReedSensor doorSensor(REED_PIN, true); // Active LOW: contact to GND when door closed
UltrasonicSensor ultrasonic(ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN, PARCEL_DETECT_DISTANCE_CM);
Buzzer buzzer(BUZZER_PIN);
ApiClient apiClient;
ParcelController parcelController;

// State tracking & buffers
String enteredOTP = "";
unsigned long lastOtpInputTime = 0;
unsigned long lastCommandPollTime = 0;
unsigned long lastStatusReportTime = 0;
unsigned long lastDisplayRefreshTime = 0;
unsigned long deliveryCompleteTime = 0;
unsigned long unlockTime = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println();
    Serial.println("==========================================");
    Serial.println(" Universal Smart Parcel Box - Firmware v2");
    Serial.println("==========================================");

    // 1. Initialize outputs
    parcelLock.begin();
    buzzer.begin();

    // 2. Initialize inputs & sensors
    doorSensor.begin();
    ultrasonic.begin();

    // 3. Initialize OLED Display
    display.begin();
    display.showBootScreen("Starting...");
    buzzer.beep(100);

    // 4. Start Wi-Fi connection
    wifiManager.begin(WIFI_SSID, WIFI_PASSWORD);

    // 5. Initialize API Client
    apiClient.begin(API_SERVER, DEVICE_TOKEN);

    // 6. Initialize Controller State
    parcelController.begin();

    // Small delay to allow Wi-Fi connection attempt
    delay(1000);
    display.showBootScreen(wifiManager.isConnected() ? wifiManager.getLocalIP().c_str() : "Connecting...");

    Serial.println("[BOOT] Setup complete. Entering operational loop.");
}

void loop() {
    unsigned long now = millis();

    // ----------------------------------------------------
    // 1. Update Hardware & Background Services
    // ----------------------------------------------------
    wifiManager.update();
    doorSensor.update();
    ultrasonic.update();
    parcelLock.update();

    bool isDoorOpen = doorSensor.isDoorOpen();
    bool parcelDetected = ultrasonic.isParcelDetected();
    float currentDist = ultrasonic.getDistanceCm();
    ParcelState currentState = parcelController.getState();

    // ----------------------------------------------------
    // 2. Keypad Event Processing
    // ----------------------------------------------------
    char key = keypad.getKey();

    if (key != NO_KEY) {
        Serial.printf("[KEYPAD] Key pressed: '%c'\n", key);
        buzzer.beep(30);

        if (currentState == ParcelState::IDLE_LOCKED) {
            if (key == '#') {
                parcelController.startOtpEntry();
                enteredOTP = "";
                lastOtpInputTime = now;
                display.showOtpEntry(0);
            }
        } else if (currentState == ParcelState::OTP_ENTRY) {
            lastOtpInputTime = now;

            if (key >= '0' && key <= '9') {
                if (enteredOTP.length() < 6) {
                    enteredOTP += key;
                    display.showOtpEntry(enteredOTP.length());
                }
            } else if (key == '*') {
                // Clear or Cancel
                if (enteredOTP.length() > 0) {
                    enteredOTP = "";
                    display.showOtpEntry(0);
                } else {
                    parcelController.cancelOtpEntry();
                    display.showIdleScreen(BOX_CODE, wifiManager.isConnected(), wifiManager.getLocalIP().c_str(), isDoorOpen, currentDist, parcelDetected);
                }
            } else if (key == '#') {
                // Submit OTP for verification
                if (enteredOTP.length() == 6) {
                    parcelController.setState(ParcelState::VERIFYING);
                    display.showVerifying();

                    bool accessGranted = false;
                    String message = "";
                    bool verified = apiClient.verifyOtp(BOX_CODE, enteredOTP.c_str(), accessGranted, message);

                    if (verified && accessGranted) {
                        Serial.println("[AUTH] OTP verified successfully!");
                        buzzer.success();
                        display.showAccessGranted();
                        parcelLock.unlock(SOLENOID_UNLOCK_DURATION_MS);
                        parcelController.unlock();
                        unlockTime = now;
                    } else {
                        Serial.printf("[AUTH] Verification failed: %s\n", message.c_str());
                        buzzer.error();
                        display.showAccessDenied(message.c_str());
                        delay(2000);
                        enteredOTP = "";
                        parcelController.resetToIdle();
                    }
                } else {
                    buzzer.error();
                    display.showMessage("INVALID LENGTH", "Must be 6 digits");
                    delay(1500);
                    display.showOtpEntry(enteredOTP.length());
                }
            }
        }
    }

    // Keypad Inactivity Timeout (30 seconds)
    if (currentState == ParcelState::OTP_ENTRY) {
        if (now - lastOtpInputTime > OTP_INPUT_TIMEOUT_MS) {
            Serial.println("[OTP] Input timeout, returning to idle.");
            enteredOTP = "";
            parcelController.cancelOtpEntry();
        }
    }

    // ----------------------------------------------------
    // 3. Handle Door Sensor State Changes
    // ----------------------------------------------------
    if (doorSensor.hasChanged()) {
        Serial.printf("[DOOR] State changed -> %s\n", isDoorOpen ? "OPEN" : "CLOSED");

        if (isDoorOpen) {
            if (currentState == ParcelState::UNLOCKED) {
                parcelController.doorOpened();
                display.showDoorOpen(currentDist, parcelDetected);
            } else if (currentState == ParcelState::IDLE_LOCKED) {
                // Tamper alert: door opened while locked!
                Serial.println("[SECURITY] Tamper detected! Door opened while locked.");
                parcelController.doorOpened(); // Triggers ALARM
                buzzer.alarm();
                display.showAlarm();
                apiClient.sendStatus("open", "locked", parcelDetected ? "detected" : "empty");
            }
        } else {
            // Door closed
            if (currentState == ParcelState::DOOR_OPEN || currentState == ParcelState::PARCEL_DETECTED) {
                parcelLock.lock(); // Ensure securely locked immediately
                parcelController.doorClosed(); // Transitions to DELIVERY_COMPLETE
                buzzer.success();
                display.showDeliveryComplete();
                deliveryCompleteTime = now;

                // Notify backend
                apiClient.sendStatus("closed", "locked", parcelDetected ? "detected" : "empty");
            } else if (currentState == ParcelState::ALARM) {
                parcelController.doorClosed();
            }
        }
    }

    // ----------------------------------------------------
    // 4. Handle Ultrasonic Parcel Detection during Door Open
    // ----------------------------------------------------
    if (currentState == ParcelState::DOOR_OPEN) {
        if (parcelDetected) {
            parcelController.parcelDetected();
            buzzer.beep(80);
            display.showDoorOpen(currentDist, true);
        } else {
            display.showDoorOpen(currentDist, false);
        }
    }

    // ----------------------------------------------------
    // 5. Auto-relock & Delivery Complete Reset Timers
    // ----------------------------------------------------
    // If unlocked but door was never opened within 15 seconds
    if (currentState == ParcelState::UNLOCKED) {
        if (now - unlockTime > 15000 && !isDoorOpen) {
            Serial.println("[LOCK] Unlocked timeout - door was never opened. Re-locking.");
            parcelLock.lock();
            parcelController.resetToIdle();
        }
    }

    // After delivery complete screen shows for 4 seconds, return to idle
    if (currentState == ParcelState::DELIVERY_COMPLETE) {
        if (now - deliveryCompleteTime > 4000) {
            parcelController.resetToIdle();
        }
    }

    // ----------------------------------------------------
    // 6. Cloud Communication: Command Polling & Telemetry
    // ----------------------------------------------------
    // Poll for remote unlock commands from the web dashboard
    if (now - lastCommandPollTime >= SERVER_POLL_INTERVAL_MS) {
        lastCommandPollTime = now;

        int commandId = 0;
        String command = "";
        if (apiClient.pollCommand(commandId, command)) {
            if (command == "UNLOCK") {
                Serial.printf("[COMMAND] Received remote UNLOCK (cmdId: %d)\n", commandId);
                apiClient.acknowledgeCommand(commandId);
                buzzer.success();
                display.showAccessGranted();
                parcelLock.unlock(SOLENOID_UNLOCK_DURATION_MS);
                parcelController.unlock();
                unlockTime = now;
            }
        }
    }

    // Periodic telemetry status report to backend
    if (now - lastStatusReportTime >= STATUS_REPORT_INTERVAL_MS) {
        lastStatusReportTime = now;
        apiClient.sendStatus(
            isDoorOpen ? "open" : "closed",
            parcelLock.isLocked() ? "locked" : "unlocked",
            parcelDetected ? "detected" : "empty"
        );
    }

    // ----------------------------------------------------
    // 7. Idle Screen Live Refresh (every 1 second)
    // ----------------------------------------------------
    if (currentState == ParcelState::IDLE_LOCKED) {
        if (now - lastDisplayRefreshTime >= 1000) {
            lastDisplayRefreshTime = now;

            Serial.printf("[SENSORS] Door: %s | Distance: %.1f cm | Parcel: %s | WiFi: %s\n",
                isDoorOpen ? "OPEN" : "CLOSED",
                currentDist,
                parcelDetected ? "DETECTED" : "EMPTY",
                wifiManager.isConnected() ? wifiManager.getLocalIP().c_str() : "OFFLINE"
            );

            display.showIdleScreen(
                BOX_CODE,
                wifiManager.isConnected(),
                wifiManager.getLocalIP().c_str(),
                isDoorOpen,
                currentDist,
                parcelDetected
            );
        }
    }

    delay(20); // Smooth loop pacing (50 Hz)
}