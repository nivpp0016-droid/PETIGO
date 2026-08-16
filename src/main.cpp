#include <Arduino.h>

#include "system_state.h"
#include "lock.h"
#include "wifi_manager.h"
#include "config.h"
#include "display_manager.h"
#include "keypad_manager.h"

#define RELAY_PIN 26

LockController parcelLock(RELAY_PIN);
WiFiManager wifiManager;
DisplayManager display;
KeypadManager keypad;

BoxState currentState = BoxState::LOCKED;
String enteredOTP = "";

void setup() {

    Serial.begin(115200);

    Serial.println();
    Serial.println("==============================");
    Serial.println(" Universal Smart Parcel Box");
    Serial.println("==============================");

    parcelLock.begin();

    display.begin();
    display.showBootScreen();

    wifiManager.begin(WIFI_SSID, WIFI_PASSWORD);
}

void loop() {

    char key = keypad.getKey();

    if (key != NO_KEY) {

        Serial.print("Key pressed: ");
        Serial.println(key);

        if (key >= '0' && key <= '9') {

            if (enteredOTP.length() < 6) {
                enteredOTP += key;
            }

            display.showMessage(
                "ENTER OTP",
                enteredOTP.c_str()
            );
        }

        else if (key == '*') {

            enteredOTP = "";

            display.showEnterOTP();
        }

        else if (key == '#') {

            if (enteredOTP.length() == 6) {

                Serial.println("OTP entered.");

                // Verification will be added later.
                display.showMessage(
                    "OTP",
                    "VERIFYING"
                );

            } else {

                display.showMessage(
                    "OTP",
                    "6 DIGITS"
                );
            }

            delay(1500);

            enteredOTP = "";
            display.showEnterOTP();
        }
    }
}