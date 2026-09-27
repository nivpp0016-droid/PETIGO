#include "wifi_manager.h"

WiFiManager::WiFiManager()
    : _ssid(nullptr),
      _password(nullptr),
      _lastReconnectAttempt(0) {
}

void WiFiManager::begin(const char* ssid, const char* password) {
    _ssid = ssid;
    _password = password;

    Serial.print("[WIFI] Connecting to SSID: ");
    Serial.println(_ssid);

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);
    if (_password && strlen(_password) > 0) {
        WiFi.begin(_ssid, _password);
    } else {
        WiFi.begin(_ssid);
    }

    // Initial non-blocking check
    _lastReconnectAttempt = millis();
}

void WiFiManager::update() {
    if (WiFi.status() != WL_CONNECTED) {
        if (millis() - _lastReconnectAttempt > RECONNECT_INTERVAL_MS) {
            _lastReconnectAttempt = millis();
            Serial.println("[WIFI] Connection lost. Reconnecting...");
            WiFi.disconnect();
            WiFi.reconnect();
        }
    }
}

bool WiFiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

String WiFiManager::getLocalIP() {
    if (isConnected()) {
        return WiFi.localIP().toString();
    }
    return "Disconnected";
}

int WiFiManager::getRSSI() {
    if (isConnected()) {
        return WiFi.RSSI();
    }
    return 0;
}