#include "display_manager.h"

#define OLED_ADDRESS 0x3C

DisplayManager::DisplayManager()
    : _display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET) {
}

void DisplayManager::begin() {

    if (!_display.begin(
        SSD1306_SWITCHCAPVCC,
        OLED_ADDRESS
    )) {
        Serial.println("OLED initialization failed!");
        return;
    }

    _display.clearDisplay();
    _display.setTextColor(SSD1306_WHITE);
    _display.setTextSize(1);
    _display.setCursor(0, 0);

    Serial.println("OLED initialized.");
}

void DisplayManager::showBootScreen() {

    _display.clearDisplay();

    _display.setTextSize(1);
    _display.setCursor(20, 15);
    _display.println("UNIVERSAL");

    _display.setCursor(20, 30);
    _display.println("PARCEL BOX");

    _display.setCursor(35, 50);
    _display.println("BOX001");

    _display.display();
}

void DisplayManager::showLocked() {

    showMessage(
        "PARCEL BOX",
        "LOCKED"
    );
}

void DisplayManager::showUnlocked() {

    showMessage(
        "PARCEL BOX",
        "UNLOCKED"
    );
}

void DisplayManager::showEnterOTP() {

    _display.clearDisplay();

    _display.setTextSize(1);
    _display.setCursor(20, 10);
    _display.println("DELIVERY ACCESS");

    _display.setCursor(30, 30);
    _display.println("ENTER OTP");

    _display.setCursor(25, 48);
    _display.println("_ _ _ _ _ _");

    _display.display();
}

void DisplayManager::showParcelDetected() {

    showMessage(
        "PARCEL STATUS",
        "DETECTED"
    );
}

void DisplayManager::showDeliveryComplete() {

    showMessage(
        "DELIVERY",
        "COMPLETE"
    );
}

void DisplayManager::showMessage(
    const char* line1,
    const char* line2
) {

    _display.clearDisplay();

    _display.setTextSize(1);

    _display.setCursor(20, 15);
    _display.println(line1);

    _display.setTextSize(2);
    _display.setCursor(20, 35);
    _display.println(line2);

    _display.display();
}