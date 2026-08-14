#include <Arduino.h>
#include <WiFi.h>
#include "wifi_manager.h"

WiFiManager::WiFiManager() {
    _ssid = nullptr;
    _password = nullptr;
}

void WiFiManager::begin(const char* ssid, const char* password) {
    _ssid = ssid;
    _password = password;

    Serial.println("Starting Wi-Fi...");

    WiFi.mode(WIFI_STA);
    WiFi.begin(_ssid, _password);

    Serial.println("Wi-Fi initialization complete.");
}

bool WiFiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void WiFiManager::printStatus() {
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("Wi-Fi Status: ONLINE");
    } else {
        Serial.println("Wi-Fi Status: OFFLINE");
    }
}