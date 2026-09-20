#include "display_manager.h"
#include "config.h"
#include <Wire.h>

DisplayManager::DisplayManager()
    : _display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, -1),
      _isInitialized(false) {
}

void DisplayManager::begin() {
    Wire.begin(21, 22);
    Wire.setClock(100000); // 100 kHz standard I2C speed
    delay(100);

    Serial.println("[I2C] Scanning for connected I2C devices on SDA=21, SCL=22...");
    uint8_t foundAddress = 0;
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        uint8_t err = Wire.endTransmission();
        if (err == 0) {
            Serial.printf("[I2C] -> Found device at address 0x%02X\n", addr);
            if (addr == 0x3C || addr == 0x3D) {
                foundAddress = addr;
            }
        }
    }

    if (foundAddress == 0) {
        Serial.println("[I2C] WARNING: No OLED found at 0x3C or 0x3D on GPIO 21/22!");
        Serial.println("[I2C] Check your wiring: OLED VCC->3.3V/5V, GND->GND, SDA->Pin 21, SCL->Pin 22.");
        foundAddress = OLED_I2C_ADDRESS;
    } else {
        Serial.printf("[I2C] Using detected OLED address: 0x%02X\n", foundAddress);
    }

    if (!_display.begin(SSD1306_SWITCHCAPVCC, foundAddress)) {
        Serial.printf("[OLED] Warning: SSD1306 init failed at 0x%02X!\n", foundAddress);
        _isInitialized = false;
        return;
    }

    _isInitialized = true;
    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.setTextSize(2);
    _display.setCursor(20, 24);
    _display.println("READY!");
    _display.display();
    Serial.printf("[OLED] SSD1306 initialized at 0x%02X.\n", foundAddress);
}

void DisplayManager::showBootScreen(const char* ipStr) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(SSD1306_WHITE);

    _display.setCursor(10, 8);
    _display.println("UNIVERSAL SMART");
    _display.setCursor(18, 22);
    _display.println("PARCEL BOX");

    _display.drawLine(10, 36, 118, 36, SSD1306_WHITE);

    _display.setCursor(10, 44);
    _display.print("WiFi: ");
    _display.println(ipStr);

    _display.display();
}

void DisplayManager::showIdleScreen(
    const char* boxCode,
    bool wifiOk,
    const char* ipStr,
    bool doorOpen,
    float distanceCm,
    bool parcelDetected
) {
    if (!_isInitialized) return;

    _display.clearDisplay();

    // Top Header: Box Code & WiFi Icon/status
    _display.setTextSize(1);
    _display.setCursor(0, 0);
    _display.print(boxCode);

    _display.setCursor(80, 0);
    if (wifiOk) {
        _display.print("[WiFi]");
    } else {
        _display.print("[OFFL]");
    }

    _display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

    // Middle Info: Door & Ultrasonic Status
    _display.setCursor(0, 16);
    _display.print("Door: ");
    _display.println(doorOpen ? "OPEN (!)" : "CLOSED");

    _display.setCursor(0, 28);
    _display.print("Dist: ");
    if (distanceCm > 0) {
        _display.print(distanceCm, 1);
        _display.print(" cm");
    } else {
        _display.print("-- cm");
    }

    _display.setCursor(0, 40);
    _display.print("Parcel: ");
    _display.println(parcelDetected ? "DETECTED" : "EMPTY");

    // Bottom prompt
    _display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
    _display.setCursor(4, 55);
    _display.print("Press # for OTP");

    _display.display();
}

void DisplayManager::showOtpEntry(uint8_t length) {
    if (!_isInitialized) return;

    _display.clearDisplay();

    _display.setTextSize(1);
    _display.setCursor(16, 4);
    _display.println("DELIVERY ACCESS");
    _display.drawLine(10, 16, 118, 16, SSD1306_WHITE);

    _display.setCursor(20, 22);
    _display.println("Enter 6-Digit OTP:");

    _display.setTextSize(2);
    _display.setCursor(16, 36);

    for (uint8_t i = 0; i < 6; i++) {
        if (i < length) {
            _display.print("*");
        } else {
            _display.print("_");
        }
        if (i < 5) _display.print(" ");
    }

    _display.setTextSize(1);
    _display.setCursor(8, 55);
    _display.print("#:Send  *:Clear");

    _display.display();
}

void DisplayManager::showVerifying() {
    showMessage("VERIFYING OTP", "Checking cloud...");
}

void DisplayManager::showAccessGranted() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setCursor(14, 8);
    _display.println("ACCESS GRANTED!");

    _display.drawLine(10, 22, 118, 22, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(18, 32);
    _display.println("Lock Open (5s)");

    _display.setCursor(12, 48);
    _display.println("Please open door");

    _display.display();
}

void DisplayManager::showAccessDenied(const char* reason) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setCursor(14, 8);
    _display.println("ACCESS DENIED");

    _display.drawLine(10, 22, 118, 22, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(10, 34);
    _display.println(reason);

    _display.setCursor(10, 50);
    _display.println("Try again or check app");

    _display.display();
}

void DisplayManager::showDoorOpen(float distanceCm, bool parcelDetected) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setCursor(20, 4);
    _display.println("DOOR IS OPEN");
    _display.drawLine(10, 16, 118, 16, SSD1306_WHITE);

    _display.setCursor(10, 24);
    _display.print("Distance: ");
    if (distanceCm > 0) {
        _display.print(distanceCm, 1);
        _display.println(" cm");
    } else {
        _display.println("--");
    }

    _display.setCursor(10, 38);
    if (parcelDetected) {
        _display.println("Parcel: DETECTED!");
        _display.setCursor(10, 52);
        _display.println("Please close door.");
    } else {
        _display.println("Parcel: EMPTY");
        _display.setCursor(10, 52);
        _display.println("Place parcel inside.");
    }

    _display.display();
}

void DisplayManager::showParcelDetected() {
    showMessage("PARCEL DETECTED", "Please close door");
}

void DisplayManager::showDeliveryComplete() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setCursor(12, 10);
    _display.println("DELIVERY COMPLETE");

    _display.drawLine(10, 24, 118, 24, SSD1306_WHITE);

    _display.setCursor(18, 34);
    _display.println("Box is locked");

    _display.setCursor(30, 48);
    _display.println("THANK YOU!");

    _display.display();
}

void DisplayManager::showAlarm() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(2);
    _display.setCursor(8, 10);
    _display.println("! ALARM !");

    _display.setTextSize(1);
    _display.setCursor(8, 36);
    _display.println("TAMPER DETECTED");
    _display.setCursor(8, 50);
    _display.println("Door opened without OTP");

    _display.display();
}

void DisplayManager::showMessage(const char* title, const char* message) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setCursor(10, 12);
    _display.println(title);

    _display.drawLine(10, 26, 118, 26, SSD1306_WHITE);

    _display.setCursor(10, 38);
    _display.println(message);

    _display.display();
}