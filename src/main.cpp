#include <Arduino.h>

#include "system_state.h"
#include "lock.h"
#include "wifi_manager.h"
#include "config.h"
#include "display_manager.h"

#define RELAY_PIN 26

LockController parcelLock(RELAY_PIN);
WiFiManager wifiManager;
DisplayManager display;

BoxState currentState = BoxState::LOCKED;

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

    currentState = BoxState::LOCKED;
    display.showLocked();
    delay(3000);

    currentState = BoxState::UNLOCKED;
    display.showUnlocked();
    delay(3000);

    currentState = BoxState::DOOR_OPEN;
    display.showMessage("PARCEL BOX", "DOOR OPEN");
    delay(3000);

    currentState = BoxState::PARCEL_DETECTED;
    display.showParcelDetected();
    delay(3000);

    currentState = BoxState::DELIVERY_COMPLETE;
    display.showDeliveryComplete();
    delay(3000);

    currentState = BoxState::LOCKED;
    display.showLocked();
    delay(3000);
}