#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

class DisplayManager {
public:
    DisplayManager();

    void begin();
    void showBootScreen(const char* ipStr = "Connecting...");
    void showIdleScreen(
        const char* boxCode,
        bool wifiOk,
        const char* ipStr,
        bool doorOpen,
        float distanceCm,
        bool parcelDetected
    );
    void showOtpEntry(uint8_t length);
    void showVerifying();
    void showAccessGranted();
    void showAccessDenied(const char* reason = "INVALID OTP");
    void showDoorOpen(float distanceCm, bool parcelDetected);
    void showParcelDetected();
    void showDeliveryComplete();
    void showAlarm();
    void showMessage(const char* title, const char* message);

private:
    Adafruit_SSD1306 _display;
    bool _isInitialized;
};

#endif