#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

class DisplayManager {
public:
    DisplayManager();

    void begin();
    void showBootScreen();
    void showLocked();
    void showUnlocked();
    void showEnterOTP();
    void showParcelDetected();
    void showDeliveryComplete();
    void showMessage(const char* line1, const char* line2);

private:
    Adafruit_SSD1306 _display;
};

#endif