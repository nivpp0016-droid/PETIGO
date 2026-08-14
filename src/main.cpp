#include <Arduino.h>

void setup() {
    Serial.begin(115200);

    Serial.println();
    Serial.println("================================");
    Serial.println(" Universal Smart Parcel Box");
    Serial.println(" ESP32 Firmware Starting...");
    Serial.println("================================");
}

void loop() {
    Serial.println("System is running...");
    delay(2000);
}