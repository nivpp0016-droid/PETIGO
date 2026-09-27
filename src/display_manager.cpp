#include "display_manager.h"
#include "config.h"
#include <Wire.h>

DisplayManager::DisplayManager()
    : _display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, -1),
      _isInitialized(false) {
}

void DisplayManager::begin() {
    // 1. Enable strong internal pull-ups on I2C pins (SDA=21, SCL=22)
    pinMode(21, INPUT_PULLUP);
    pinMode(22, INPUT_PULLUP);

    // 2. Start I2C at standard 100 kHz (safe for all wire lengths)
    Wire.begin(21, 22);
    Wire.setClock(100000);
    delay(100);

    // 3. Scan I2C bus to find display address
    uint8_t foundAddress = 0;
    Wire.beginTransmission(0x3C);
    if (Wire.endTransmission() == 0) {
        foundAddress = 0x3C;
    } else {
        Wire.beginTransmission(0x3D);
        if (Wire.endTransmission() == 0) {
            foundAddress = 0x3D;
        }
    }

    // Full bus scan if 0x3C and 0x3D did not respond directly
    if (foundAddress == 0) {
        Serial.println("[I2C] Scanning all 127 addresses for OLED display...");
        for (uint8_t addr = 1; addr < 127; addr++) {
            Wire.beginTransmission(addr);
            if (Wire.endTransmission() == 0) {
                Serial.printf("[I2C] Found responding I2C device at: 0x%02X\n", addr);
                if (addr == 0x3C || addr == 0x3D) {
                    foundAddress = addr;
                }
            }
        }
    }

    if (foundAddress == 0) {
        Serial.println("[I2C] Warning: No OLED ACK at 0x3C/0x3D! Defaulting to 0x3C");
        foundAddress = 0x3C;
    } else {
        Serial.printf("[I2C] OLED detected at: 0x%02X\n", foundAddress);
    }

    // 4. Initialize SSD1306 with SwitchCapVCC (enables on-chip 7.5V–9V charge pump)
    if (!_display.begin(SSD1306_SWITCHCAPVCC, foundAddress)) {
        Serial.printf("[OLED] Warning: SSD1306 SwitchCap init failed at 0x%02X, retrying...\n", foundAddress);
        delay(100);
        if (!_display.begin(SSD1306_SWITCHCAPVCC, foundAddress)) {
            Serial.printf("[OLED] Fatal: Unable to initialize SSD1306 at 0x%02X!\n", foundAddress);
            _isInitialized = false;
            return;
        }
    }

    _isInitialized = true;

    // 5. Explicitly force Display ON and Max Contrast
    _display.ssd1306_command(SSD1306_DISPLAYON); // 0xAF
    _display.ssd1306_command(SSD1306_SETCONTRAST); // 0x81
    _display.ssd1306_command(0xFF); // Maximum brightness
    _display.dim(false);

    // 6. Draw Diagnostic Splash (PETIGO SMART BOX with test border)
    _display.clearDisplay();
    _display.drawRect(0, 0, 128, 64, SSD1306_WHITE); // Visual confirmation of all 4 borders
    _display.setTextColor(SSD1306_WHITE);
    _display.setTextSize(2);
    _display.setCursor(26, 14);
    _display.println("PETIGO");
    _display.setTextSize(1);
    _display.setCursor(18, 38);
    _display.println("SMART DOORSTEP BOX");
    _display.display();

    Serial.printf("[OLED] SSD1306 initialized & display test rendered at 0x%02X.\n", foundAddress);
}

void DisplayManager::showBootScreen(const char* ipStr) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.drawRect(0, 0, 128, 64, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(18, 8);
    _display.println("PETIGO SMART BOX");
    _display.drawLine(10, 20, 118, 20, SSD1306_WHITE);

    _display.setCursor(14, 28);
    _display.print("WiFi: ");
    _display.println(ipStr);

    _display.setCursor(14, 44);
    _display.println("Initializing sensors...");

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
    _display.setTextColor(SSD1306_WHITE);

    // Top Header: Box Code & WiFi status
    _display.setTextSize(1);
    _display.setCursor(4, 2);
    _display.print(boxCode);

    _display.setCursor(80, 2);
    if (wifiOk) {
        _display.print("[ONLINE]");
    } else {
        _display.print("[OFFLN]");
    }

    _display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    // Middle Info: Door & Ultrasonic Status
    _display.setCursor(4, 17);
    _display.print("Door  : ");
    _display.println(doorOpen ? "OPEN (!)" : "CLOSED");

    _display.setCursor(4, 29);
    _display.print("Dist  : ");
    if (distanceCm > 0) {
        _display.print(distanceCm, 1);
        _display.println(" cm");
    } else {
        _display.println("-- cm");
    }

    _display.setCursor(4, 41);
    _display.print("Chamber: ");
    _display.println(parcelDetected ? "FULL" : "EMPTY");

    // Bottom prompt
    _display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
    _display.setCursor(10, 55);
    _display.print("Press # for OTP");

    _display.display();
}

void DisplayManager::showOtpEntry(uint8_t length) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(16, 4);
    _display.println("DELIVERY ACCESS");
    _display.drawLine(10, 16, 118, 16, SSD1306_WHITE);

    _display.setCursor(16, 22);
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
    _display.setCursor(10, 55);
    _display.print("#:Submit  *:Clear");

    _display.display();
}

void DisplayManager::showVerifying() {
    showMessage("VERIFYING OTP", "Checking authorization...");
}

void DisplayManager::showAccessGranted() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.drawRect(0, 0, 128, 64, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(14, 8);
    _display.println("ACCESS GRANTED!");
    _display.drawLine(10, 20, 118, 20, SSD1306_WHITE);

    _display.setCursor(18, 30);
    _display.println("Lock Released");

    _display.setCursor(14, 46);
    _display.println("Please open door");

    _display.display();
}

void DisplayManager::showAccessDenied(const char* reason) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.drawRect(0, 0, 128, 64, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(20, 8);
    _display.println("ACCESS DENIED");
    _display.drawLine(10, 20, 118, 20, SSD1306_WHITE);

    _display.setCursor(10, 32);
    _display.println(reason);

    _display.setCursor(10, 48);
    _display.println("Check OTP on App");

    _display.display();
}

void DisplayManager::showDoorOpen(float distanceCm, bool parcelDetected) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(26, 4);
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
    _display.print("Chamber: ");
    _display.println(parcelDetected ? "FULL" : "EMPTY");

    _display.setCursor(10, 52);
    if (parcelDetected) {
        _display.println("Please close door.");
    } else {
        _display.println("Place parcel inside.");
    }

    _display.display();
}

void DisplayManager::showParcelDetected() {
    showMessage("CHAMBER FULL", "Please close door");
}

void DisplayManager::showDeliveryComplete() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.drawRect(0, 0, 128, 64, SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(12, 10);
    _display.println("DELIVERY COMPLETE");
    _display.drawLine(10, 24, 118, 24, SSD1306_WHITE);

    _display.setCursor(22, 34);
    _display.println("Chamber Locked");

    _display.setCursor(30, 48);
    _display.println("THANK YOU!");

    _display.display();
}

void DisplayManager::showAlarm() {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);

    _display.setTextSize(2);
    _display.setCursor(14, 4);
    _display.println("! ALARM !");

    _display.setTextSize(1);
    _display.setCursor(8, 24);
    _display.println("TAMPER DETECTED");
    _display.setCursor(8, 36);
    _display.println("Door opened without OTP");
    _display.drawLine(0, 48, 127, 48, SSD1306_WHITE);
    _display.setCursor(10, 52);
    _display.println("Press * to Dismiss");

    _display.display();
}

void DisplayManager::showMessage(const char* title, const char* message) {
    if (!_isInitialized) return;

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);

    _display.setTextSize(1);
    _display.setCursor(10, 12);
    _display.println(title);

    _display.drawLine(10, 26, 118, 26, SSD1306_WHITE);

    _display.setCursor(10, 38);
    _display.println(message);

    _display.display();
}