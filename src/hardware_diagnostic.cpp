#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Keypad.h>
#include "config.h"

Adafruit_SSD1306 display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, -1);
bool oledReady = false;

// 4x4 Keypad Setup
static char keys[KEYPAD_ROWS][KEYPAD_COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}
};
static byte rowPins[KEYPAD_ROWS] = {KEYPAD_ROW_PINS[0], KEYPAD_ROW_PINS[1], KEYPAD_ROW_PINS[2], KEYPAD_ROW_PINS[3]};
static byte colPins[KEYPAD_COLS] = {KEYPAD_COL_PINS[0], KEYPAD_COL_PINS[1], KEYPAD_COL_PINS[2], KEYPAD_COL_PINS[3]};
Keypad customKeypad = Keypad(makeKeymap(keys), rowPins, colPins, KEYPAD_ROWS, KEYPAD_COLS);

struct UltrasonicProbeResult {
    bool echoPreState;       // true if HIGH before trigger
    bool pulseDetected;      // true if echo went HIGH
    unsigned long durationUs;// pulse width in microseconds
    float distanceCm;        // calculated distance
    const char* diagnosis;   // explanation of what happened
};

UltrasonicProbeResult probeUltrasonic(uint8_t trigPin, uint8_t echoPin) {
    UltrasonicProbeResult res;
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    digitalWrite(trigPin, LOW);
    delayMicroseconds(5);

    res.echoPreState = (digitalRead(echoPin) == HIGH);
    if (res.echoPreState) {
        res.pulseDetected = false;
        res.durationUs = 0;
        res.distanceCm = -1.0f;
        res.diagnosis = "ECHO stuck HIGH before trigger (Check wiring / short)";
        return res;
    }

    // Send 10us trigger pulse
    digitalWrite(trigPin, LOW);
    delayMicroseconds(4);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(12);
    digitalWrite(trigPin, LOW);

    // Wait for ECHO to rise (max 15ms wait for pulse start)
    unsigned long startWait = micros();
    bool wentHigh = false;
    while (micros() - startWait < 15000UL) {
        if (digitalRead(echoPin) == HIGH) {
            wentHigh = true;
            break;
        }
    }

    if (!wentHigh) {
        res.pulseDetected = false;
        res.durationUs = 0;
        res.distanceCm = -1.0f;
        res.diagnosis = "ECHO stayed LOW (No chirp / check 5V power)";
        return res;
    }

    // Measure pulse duration (while ECHO is HIGH)
    unsigned long pulseStart = micros();
    bool wentLow = false;
    while (micros() - pulseStart < 35000UL) {
        if (digitalRead(echoPin) == LOW) {
            wentLow = true;
            break;
        }
    }
    unsigned long pulseEnd = micros();

    res.pulseDetected = true;
    res.durationUs = pulseEnd - pulseStart;
    res.distanceCm = (res.durationUs * 0.0343f) / 2.0f;
    res.diagnosis = wentLow ? "OK (Echo received)" : "Echo timed out (>4.5m)";
    return res;
}

// Variables
float lastDistA = -1.0f;
float lastDistB = -1.0f;
const char* diagA = "";
const char* diagB = "";
bool swappedWires = false;

char lastKey = '-';
bool doorOpen = false;
unsigned long lastProbeTime = 0;
unsigned long lastSerialTime = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n\n=======================================================");
    Serial.println(" ULTRASONIC SENSOR DEEP-DIVE HARDWARE DIAGNOSTIC");
    Serial.println("=======================================================");
    Serial.printf("Configured Pins: TRIG = GPIO %d | ECHO = GPIO %d\n", ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN);
    Serial.println("Testing both normal and swapped wire configurations...\n");

    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    pinMode(REED_PIN, INPUT_PULLUP);

    Wire.begin(21, 22);
    if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        oledReady = true;
        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(0, 0);
        display.println("ULTRASONIC DIAGNOSTIC");
        display.drawLine(0, 10, 127, 10, SSD1306_WHITE);
        display.setCursor(0, 20);
        display.println("Probing pins 23 & 13...");
        display.display();
    }
}

void loop() {
    unsigned long now = millis();

    // Check keypad
    char k = customKeypad.getKey();
    if (k != NO_KEY) {
        lastKey = k;
        Serial.printf("[KEYPAD] '%c'\n", k);
    }

    // Check reed door switch
    doorOpen = (digitalRead(REED_PIN) == HIGH);

    // Run Ultrasonic Probe every 250ms
    if (now - lastProbeTime >= 250) {
        lastProbeTime = now;

        // 1. Probe Config A (TRIG=23, ECHO=13)
        UltrasonicProbeResult rA = probeUltrasonic(ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN);
        lastDistA = rA.distanceCm;
        diagA = rA.diagnosis;

        delay(30); // spacing between tests

        // 2. Probe Config B (Swapped: TRIG=13, ECHO=23)
        UltrasonicProbeResult rB = probeUltrasonic(ULTRASONIC_ECHO_PIN, ULTRASONIC_TRIG_PIN);
        lastDistB = rB.distanceCm;
        diagB = rB.diagnosis;

        if (rB.pulseDetected && !rA.pulseDetected) {
            swappedWires = true;
        } else if (rA.pulseDetected) {
            swappedWires = false;
        }

        // Update OLED
        if (oledReady) {
            display.clearDisplay();
            display.setTextSize(1);
            display.setCursor(0, 0);
            display.print("ULTRASONIC PROBE");

            display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

            // Display Config A: Trig 23, Echo 13
            display.setCursor(0, 14);
            display.print("T23/E13: ");
            if (lastDistA > 0) {
                display.printf("%.1f cm [OK]", lastDistA);
            } else {
                display.print("[FAIL]");
            }

            // Display Config B: Trig 13, Echo 23 (swapped)
            display.setCursor(0, 26);
            display.print("T13/E23: ");
            if (lastDistB > 0) {
                display.printf("%.1f cm [SWAPPED!]", lastDistB);
            } else {
                display.print("[FAIL]");
            }

            display.setCursor(0, 38);
            if (swappedWires) {
                display.print(">> WIRES ARE SWAPPED! <<");
            } else if (lastDistA > 0) {
                display.print(">> SENSOR WORKING OK! <<");
            } else {
                display.print("Check: 5V (VIN) / GND");
            }

            display.setCursor(0, 52);
            display.printf("Door:%s | Key:%c", doorOpen ? "OPEN" : "CLOSED", lastKey);
            display.display();
        }
    }

    // Periodic Serial Reporting every 1000ms
    if (now - lastSerialTime >= 1000) {
        lastSerialTime = now;
        Serial.println("-------------------------------------------------------");
        Serial.printf("[PROBE A] TRIG=23, ECHO=13 -> Dist: %.1f cm | %s\n", lastDistA, diagA);
        Serial.printf("[PROBE B] TRIG=13, ECHO=23 -> Dist: %.1f cm | %s\n", lastDistB, diagB);
        if (swappedWires) {
            Serial.println(">>> ALERT: TRIG AND ECHO WIRES ARE REVERSED! <<<");
            Serial.println(">>> Fix: Connect sensor TRIG to GPIO 23, ECHO to GPIO 13. <<<");
        } else if (lastDistA > 0) {
            Serial.println(">>> SENSOR IS WORKING PERFECTLY ON GPIO 23 (TRIG) and 13 (ECHO)! <<<");
        } else {
            Serial.println(">>> ROOT CAUSE ANALYSIS: <<<");
            Serial.println(" 1. Power Issue: Standard HC-SR04 requires 5V to fire.");
            Serial.println("    Make sure HC-SR04 VCC is connected to VIN (5V from USB), NOT 3.3V!");
            Serial.println(" 2. Ground: Ensure HC-SR04 GND is securely connected to ESP32 GND.");
            Serial.println(" 3. Loose Wires: Check breadboard jumper connections.");
        }
        Serial.printf("[OTHER] Door: %s | Last Key: '%c'\n", doorOpen ? "OPEN" : "CLOSED", lastKey);
    }
}
