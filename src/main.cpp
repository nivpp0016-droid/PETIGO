#include <Arduino.h>

#include "system_state.h"
#include "lock.h"
#include "wifi_manager.h"
#include "config.h"

#define RELAY_PIN 26

LockController parcelLock(RELAY_PIN);
WiFiManager wifiManager;

void setup() {

    Serial.begin(115200);

    Serial.println();
    Serial.println("==============================");
    Serial.println(" Universal Smart Parcel Box");
    Serial.println("==============================");

    parcelLock.begin();

    wifiManager.begin(WIFI_SSID, WIFI_PASSWORD);
}

void loop() {

    wifiManager.printStatus();

    delay(5000);
}