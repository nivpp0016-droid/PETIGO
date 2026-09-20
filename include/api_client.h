#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

class ApiClient {
public:
    ApiClient();

    void begin(const char* serverUrl, const char* deviceToken);

    bool sendStatus(
        const char* doorStatus,
        const char* lockStatus,
        const char* parcelStatus
    );

    bool verifyOtp(
        const char* boxCode,
        const char* otp,
        bool& accessGranted,
        String& message
    );

    bool pollCommand(
        int& commandId,
        String& command
    );

    bool acknowledgeCommand(int commandId);

    bool sendHeartbeat();

private:
    String _serverUrl;
    String _deviceToken;
};

#endif