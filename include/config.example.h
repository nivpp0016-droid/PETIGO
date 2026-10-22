#ifndef CONFIG_EXAMPLE_H
#define CONFIG_EXAMPLE_H

#include <Arduino.h>

// =======================================================
// Wi-Fi Configuration
// =======================================================
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// =======================================================
// Backend Server & Device Credentials
// =======================================================
#define API_SERVER "http://YOUR_SERVER_IP:3000"
#define BOX_CODE "BOX001"
#define DEVICE_TOKEN "YOUR_DEVICE_TOKEN_HEX_STRING"

// =======================================================
// GPIO Pin Mapping
// =======================================================
// Solenoid Lock Relay
#define RELAY_PIN 26
#define RELAY_ACTIVE_LOW false  // Set true if your relay triggers on LOW

// Magnetic Door Reed Sensor
#define REED_PIN 19             // Uses internal INPUT_PULLUP (Pin to GND)

// HC-SR04 Ultrasonic Distance Sensor
#define ULTRASONIC_TRIG_PIN 23
#define ULTRASONIC_ECHO_PIN 13

// Piezo Buzzer
#define BUZZER_PIN 4

// SSD1306 OLED Display (I2C)
// Default ESP32 I2C pins: SDA = GPIO 21, SCL = GPIO 22
#define OLED_I2C_ADDRESS 0x3C
#define OLED_SCREEN_WIDTH 128
#define OLED_SCREEN_HEIGHT 64

// 4x4 Matrix Keypad
#define KEYPAD_ROWS 4
#define KEYPAD_COLS 4
const byte KEYPAD_ROW_PINS[KEYPAD_ROWS] = {32, 33, 25, 27};
const byte KEYPAD_COL_PINS[KEYPAD_COLS] = {14, 16, 17, 18};

// =======================================================
// Operation Thresholds & Timers
// =======================================================
#define PARCEL_DETECT_DISTANCE_CM 25.0f  // Under this distance = parcel present
#define SOLENOID_UNLOCK_DURATION_MS 5000 // Relay stays energized max 5 seconds
#define OTP_INPUT_TIMEOUT_MS 30000       // Keypad input resets after 30s
#define SERVER_POLL_INTERVAL_MS 3000     // Poll backend for commands every 3s
#define STATUS_REPORT_INTERVAL_MS 5000   // Send telemetry status every 5s

#endif
