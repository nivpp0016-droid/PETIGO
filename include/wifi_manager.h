#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

class WiFiManager {
public:
    WiFiManager();

    void begin(const char* ssid, const char* password);
    bool isConnected();
    void printStatus();

private:
    const char* _ssid;
    const char* _password;
};

#endif