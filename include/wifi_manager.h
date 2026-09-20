#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>

class WiFiManager {
public:
    WiFiManager();

    void begin(const char* ssid, const char* password);
    void update();
    bool isConnected();
    String getLocalIP();
    int getRSSI();

private:
    const char* _ssid;
    const char* _password;
    unsigned long _lastReconnectAttempt;
    static const unsigned long RECONNECT_INTERVAL_MS = 10000;
};

#endif